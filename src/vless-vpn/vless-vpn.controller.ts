import { Body, Controller, Get, HttpException, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { VlessVpnService } from './vless-vpn.service';
import { ClientDataDto } from './dto/vlessDto';
import { Response, Request } from 'express';

@Controller('vless-vpn')
export class VlessVpnController {
  constructor(private readonly vlessVpnService: VlessVpnService) {}

  @Post('/add')
  async addClient(@Body() clientData: any, @Req() req: Request) {
    const cookie = req.headers.cookie;
    if (!cookie) {
      throw new HttpException('No cookies found', HttpStatus.UNAUTHORIZED);
    }
    const sessionId = cookie
      ?.split('; ')
      .find((c) => c.startsWith('3x-ui'))
      ?.split('=')[1];
    console.log(sessionId);
    if (!sessionId) {
      throw new HttpException('Session ID not found', HttpStatus.UNAUTHORIZED);
    }

    return this.vlessVpnService.addClient(sessionId, clientData);
  }

  @Post('login')
  async login(@Res() res: Response) {
    const sessionId = await this.vlessVpnService.login('uUiVBJjYZ5', 's0Z7mnNZM0');
    console.log(sessionId);
    res.cookie('3x-ui', sessionId, { httpOnly: true, secure: true, maxAge: 3600000 });
    return res.status(HttpStatus.OK).send({ message: 'Login successful' });
  }

  @Post('del')
  async del(@Req() req: Request) {
    const cookie = req.headers.cookie;
    if (!cookie) {
      throw new HttpException('No cookies found', HttpStatus.UNAUTHORIZED);
    }
    const sessionId = cookie
      ?.split('; ')
      .find((c) => c.startsWith('3x-ui'))
      ?.split('=')[1];
    if (!sessionId) {
      throw new HttpException('Session ID not found', HttpStatus.UNAUTHORIZED);
    }
    await this.vlessVpnService.delClient(sessionId);
  }

  @Get('stat')
  async getStat(@Req() req: Request) {
    const cookie = req.headers.cookie;
    console.log(cookie, 'coo');
    if (!cookie) {
      throw new HttpException('No cookies found', HttpStatus.UNAUTHORIZED);
    }
    const sessionId = cookie
      ?.split('; ')
      .find((c) => c.startsWith('3x-ui'))
      ?.split('=')[1];
    if (!sessionId) {
      throw new HttpException('Session ID not found', HttpStatus.UNAUTHORIZED);
    }
    console.log(sessionId, 'id id');
    return this.vlessVpnService.getStats(sessionId);
  }
}
