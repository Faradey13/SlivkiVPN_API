import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../token/token.service';
import { UserService } from '../user/user.service';
import { createUserDto } from '../user/dto/createUser.dto';
import * as nodemailer from 'nodemailer';
import * as process from 'node:process';
import * as uuid from 'uuid';
import { AuthResponseDto } from '../token/dto/tokenDto';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger();
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
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
                <div><a href="http://localhost:${process.env.PORT}/auth/activation/${link}">
                Авторизоваться на SlivkiVPN</a></div>
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
  async authorization(userDto: createUserDto) {
    const activationCode = await this.generateActivationCode();
    let candidate = await this.userService.getUserByEmail(userDto.email);
    if (!candidate) {
      candidate = await this.userService.createUser({
        ...userDto,
      });
    }
    await this.sendEmailActivationLink(userDto.email, activationCode);
    await this.prisma.activation_codes.upsert({
      where: { user_id: candidate.id },
      update: { activation_code: activationCode },
      create: {
        activation_code: activationCode,
        user_id: candidate.id,
      },
    });

    return 'Authorization link sent to email';
  }
  async activate(activationCode: string): Promise<AuthResponseDto | string> {
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
      await this.prisma.activation_codes.delete({
        where: {
          activation_code: activationCode,
        },
      });
      return await this.tokenService.newTokens(result.user);
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
