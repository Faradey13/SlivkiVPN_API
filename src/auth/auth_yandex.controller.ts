import { Controller} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Controller('auth')
export class AuthYandexController {
  constructor(
    private readonly httpService: HttpService,
  ) {
  }

}