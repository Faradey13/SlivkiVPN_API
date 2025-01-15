import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../token/token.service';
import { UserService } from '../user/user.service';
import { createUserDto } from '../user/dto/createUser.dto';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import * as process from 'node:process';
import { TokenDto } from '../token/dto/tokenDto';
import * as uuid from 'uuid';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger();
  constructor(
    private userService: UserService,
    private tokenService: TokenService,
    private prisma: PrismaService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  public async sendEmailActivationLink(
    to: string,
    link: string,
  ): Promise<void> {
    try {
      this.logger.log(`Sending email to: ${to}`);
      await this.transporter.sendMail({
        from: 'ikg1366@ya.ru',
        to: to,
        subject: 'Регистрация на сайте SlivkiVPN',
        text: 'Добро пожаловать, введите этот код для активации акаунта',
        html: `
                <div><a href="${link}">${link}</a></div>
                `,
      });
      this.logger.log('Email sent successfully');
    } catch (error) {
      this.logger.error(`Error sending email: ${error.message}`);
      throw error;
    }
  }
  async generateActivationCode() {
    return uuid.v4();
  }
  async registration(userDto: createUserDto) {
    const candidate = await this.userService.getUserByEmail(userDto.email);
    if (candidate) {
      throw new HttpException('user already exist', HttpStatus.BAD_REQUEST);
    }
    const hashPassword = await bcrypt.hash(userDto.password, 5);
    const activationCode = await this.generateActivationCode();
    const user = await this.userService.createUser({
      ...userDto,
      password: hashPassword,
    });
    await this.sendEmailActivationLink(userDto.email, activationCode);
    const findUser = await this.prisma.user.findUnique({
      where: { email: user.email },
    });
    await this.prisma.activation_codes.create({
      data: {
        activation_code: activationCode,
        user_id: findUser.id,
      },
    });

    return await this.tokenService.newTokens(user);
  }

  async activate(activationCode: string) {
    try {
      const result = await this.prisma.activation_codes.findFirst({
        where: {
          activation_code: activationCode,
        },
        include: {
          user: true,
        },
      });
      if (!result) {
        throw new Error('Activation code not found or invalid');
      }

      const now = new Date().getTime();
      const codeCreatedAt = new Date(result.created_at).getTime();

      if (activationCode !== result.activation_code) {
        return 'Link incorrect';
      }

      if (now - codeCreatedAt > Number(process.env.ACTIVATION_CODE_LIFETIME)) {
        return 'The link is expired, please request again';
      }
      await this.prisma.user.update({
        where: {
          id: result.user.id,
        },
        data: {
          is_activated: true,
        },
      });
    } catch (error) {
      throw new Error(error);
    }
  }
  async resendCode(oldActivationCode: string) {
    const newActivationCode = await this.generateActivationCode();

    const updatedRecord = await this.prisma.activation_codes.update({
      where: {
        activation_code: oldActivationCode,
      },
      data: {
        activation_code: newActivationCode,
        created_at: new Date(),
      },
    });

    if (!updatedRecord) {
      throw new Error('Failed to update activation code');
    }
    const result = await this.prisma.activation_codes.findFirst({
      where: {
        activation_code: newActivationCode,
      },
      include: { user: true },
    });
    await this.sendEmailActivationLink(result.user.email, newActivationCode);
  }

  async login(userDto: createUserDto) {
    const user = await this.userService.getUserByEmail(userDto.email);
    if (!user) {
      throw new HttpException(
        'User with this email already exists',
        HttpStatus.BAD_REQUEST,
      );
    }
    const passwordEquals = await bcrypt.compare(
      userDto.password,
      user.password,
    );
    if (!passwordEquals) {
      throw new UnauthorizedException({
        message: 'Email or password is incorrect',
      });
    }
    const userWithRoles = await this.userService.getUserWithRoles(user.id);

    const userDTO: TokenDto = {
      id: userWithRoles.id,
      roles: userWithRoles.roles,
      is_activated: userWithRoles.is_activated,
      email: userWithRoles.email,
    };
    console.log(`login dto${userDTO}`);
    const tokens = await this.tokenService.generateToken({ ...userDTO });
    console.log(tokens);
    await this.tokenService.saveToken(userDTO.id, tokens.refreshToken);

    return { ...tokens, user: userDTO };
  }

  async logout(refreshToken: string) {
    return await this.tokenService.removeToken(refreshToken);
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('User not authorized');
    }
    const userData = await this.tokenService.validateRefreshToken(refreshToken);
    const tokenFromDB = await this.tokenService.findToken(refreshToken);
    if (!userData || !tokenFromDB) {
      throw new UnauthorizedException('User not authorized');
    }
    const user = await this.userService.getUserWithRoles(tokenFromDB.user_id);
    return await this.tokenService.newTokens(user);
  }
}
