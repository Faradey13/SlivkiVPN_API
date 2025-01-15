import { ApiTags } from '@nestjs/swagger';
import { Controller } from '@nestjs/common';

@ApiTags('Авторизация через телеграм')
@Controller('tgAuth')
export class TelegramAuthController {}
