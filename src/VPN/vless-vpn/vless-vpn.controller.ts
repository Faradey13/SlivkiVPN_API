import { Body, Controller, Get, HttpException, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { VlessVpnService } from './vless-vpn.service';
import { Request, Response } from 'express';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PinoLogger } from 'nestjs-pino';
import { server_vless } from '@prisma/client';
import { CreateVlessServerDto } from './dto/vlessDto';

@Controller('vless-vpn')
export class VlessVpnController {
  constructor(
    private readonly vlessVpnService: VlessVpnService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(VlessVpnController.name);
  }

  // @Post('/add')
  // async addClient(@Body() clientData: any, @Req() req: Request) {
  //   const cookie = req.headers.cookie;
  //   if (!cookie) {
  //     throw new HttpException('No cookies found', HttpStatus.UNAUTHORIZED);
  //   }
  //   const sessionId = cookie
  //     ?.split('; ')
  //     .find((c) => c.startsWith('3x-ui'))
  //     ?.split('=')[1];
  //   console.log(sessionId);
  //   if (!sessionId) {
  //     throw new HttpException('Session ID not found', HttpStatus.UNAUTHORIZED);
  //   }
  //
  //   return this.vlessVpnService.addClient(sessionId, clientData);
  // }
  @Post('login')
  async login(@Res() res: Response) {
    const sessionId = await this.vlessVpnService.login(
      'uUiVBJjYZ5',
      's0Z7mnNZM0',
      'http://138.124.115.185:12144/R35c0HVMFQSS5g8',
    );
    console.log(sessionId);
    res.cookie('3x-ui', sessionId, { httpOnly: true, secure: true, maxAge: 3600000 });
    return res.status(HttpStatus.OK).send({ message: 'Login successful' });
  }

  @Get('stat')
  async getStat() {
    return this.vlessVpnService.getInbounds();
  }

  @Post('new_server')
  @ApiOperation({
    summary: 'Создание нового VLESS сервера',
    description: 'Создает новый сервер VLESS с указанными параметрами.',
  })
  @ApiResponse({
    status: 201,
    description: 'VLESS сервер успешно создан',
  })
  @ApiResponse({
    status: 400,
    description: 'Ошибка при создании VLESS сервера',
  })
  @ApiBody({
    description: 'Данные для создания нового VLESS сервера',
    type: CreateVlessServerDto,
  })
  async createVlessServer(@Body() dto: CreateVlessServerDto): Promise<server_vless> {
    try {
      this.logger.info(`Создание нового VLESS сервера для региона ID ${dto.regionName}...`);

      const newServer = await this.vlessVpnService.createVlessServer(dto);

      this.logger.info(`VLESS сервер успешно создан ID: ${newServer.id}`);
      return newServer;
    } catch (error) {
      this.logger.error(`Ошибка при создании VLESS сервера: ${error.message}`);
      throw new Error('Не удалось создать VLESS сервер');
    }
  }
}
