import { Controller, Post, Body, Delete, BadRequestException, Patch, HttpException } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PromoService } from './promo.service';
import { createPromoDto, delPromoDto, editPromoDto, setActivePromoDto, UserCodePromoDto } from './dto/promo.dto';

@Controller('promo_codes')
export class PromoController {
  constructor(private readonly promoCodesService: PromoService) {}

  @ApiOperation({ summary: 'Создание нового промокода' })
  @ApiResponse({
    status: 200,
    description: 'Промокод успешно создан.',
    type: String,
  })
  @ApiResponse({
    status: 500,
    description: 'Ошибка при создании промокода.',
  })
  @Post('create')
  async createNewPromo(@Body() dto: createPromoDto) {
    try {
      const newPromoCode = await this.promoCodesService.CreateNewPromo(dto);
      return { message: 'Промокод успешно создан', promoCode: newPromoCode };
    } catch (error) {
      throw new BadRequestException(`Ошибка при создании промокода: ${error.message}`);
    }
  }

  @ApiOperation({ summary: 'Редактирование существующего промокода' })
  @ApiResponse({
    status: 200,
    description: 'Промокод успешно отредактирован.',
  })
  @ApiResponse({
    status: 400,
    description: 'Промокод не найден.',
  })
  @ApiResponse({
    status: 500,
    description: 'Ошибка при редактировании промокода.',
  })
  @Patch('edit')
  async changePromoCode(@Body() dto: editPromoDto) {
    try {
      const result = await this.promoCodesService.changePromoCode(dto);
      if (result instanceof Error) {
        throw new BadRequestException(result.message);
      }
      return { message: 'Промокод успешно отредактирован' };
    } catch (error) {
      throw new BadRequestException(`Ошибка при редактировании промокода: ${error.message}`);
    }
  }

  @ApiOperation({ summary: 'Удаление промокода' })
  @ApiResponse({
    status: 200,
    description: 'Промокод успешно удален.',
  })
  @ApiResponse({
    status: 400,
    description: 'Промокод не найден.',
  })
  @ApiResponse({
    status: 500,
    description: 'Ошибка при удалении промокода.',
  })
  @Delete('delete')
  async delPromoCode(@Body() dto: delPromoDto) {
    try {
      const result = await this.promoCodesService.delPromoCode(dto);
      if (result instanceof Error) {
        throw new BadRequestException(result.message);
      }
      return { message: 'Промокод успешно удален' };
    } catch (error) {
      throw new BadRequestException(`Ошибка при удалении промокода: ${error.message}`);
    }
  }

  @ApiOperation({ summary: 'Установка активного промокода для пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Промокод успешно отредактирован.',
  })
  @ApiResponse({
    status: 400,
    description: 'Промокод или пользователь не найден.',
  })
  @ApiResponse({
    status: 500,
    description: 'Ошибка при редактировании промокода.',
  })
  @Patch('set-active')
  async setActive(@Body() dto: setActivePromoDto) {
    await this.promoCodesService.setActivePromoCode(dto);
  }

  @ApiOperation({ summary: 'Применение промо кода' })
  @ApiResponse({
    status: 200,
    description: 'промо код успешно применен.',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный промо код или ошибка при обновлении данных.',
  })
  @Post('apply_code')
  async applyReferralCode(@Body() applyCodeDto: UserCodePromoDto) {
    const { userId, code } = applyCodeDto;

    try {
      return await this.promoCodesService.defineAndApplyCode({ code: code, userId: userId });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException({ message: 'Не удалось применить промо код', code: 'UNKNOWN_ERROR' });
    }
  }
}
