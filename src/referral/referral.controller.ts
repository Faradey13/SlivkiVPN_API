import { Controller, Post, Body, BadRequestException, HttpException } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReferralService } from './referral.service';
import { ApplyReferralCodeDto } from './dto/referral.dto';

@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @ApiOperation({ summary: 'Применение реферального кода' })
  @ApiResponse({
    status: 200,
    description: 'Реферальный код успешно применен.',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный реферальный код или ошибка при обновлении данных.',
  })
  @Post('apply')
  async applyReferralCode(@Body() applyReferralCodeDto: ApplyReferralCodeDto) {
    const { userId, code } = applyReferralCodeDto;

    try {
      return await this.referralService.applyReferralCode(userId, code);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException({ message: 'Не удалось применить реферальный код', code: 'UNKNOWN_ERROR' });
    }
  }
}
