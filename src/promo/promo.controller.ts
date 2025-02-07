import { Controller, Post, Body, Delete, BadRequestException, Patch, HttpException } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PromoService } from './promo.service';
import {
  createPromoDto,
  delPromoDto,
  editPromoDto,
  setActivePromoDto,
  UserCodePromoDto,
} from './dto/promo.dto';
import { PinoLogger } from 'nestjs-pino';

@Controller('promo_codes')
export class PromoController {
  constructor(
    private readonly promoCodesService: PromoService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PromoController.name);
  }

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
    this.logger.info('Запрос на создание нового промокода', { dto });
    try {
      const newPromoCode = await this.promoCodesService.CreateNewPromo(dto);
      this.logger.info('Промокод успешно создан', { promoCode: newPromoCode });
      return { message: 'Промокод успешно создан', promoCode: newPromoCode };
    } catch (error) {
      this.logger.error('Ошибка при создании промокода', { error: error.message });
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
    this.logger.info(`Запрос на редактирование промокода: ${dto.code}`);
    try {
      const result = await this.promoCodesService.changePromoCode(dto);
      if (result instanceof Error) {
        this.logger.warn('Ошибка при редактировании промокода', { error: result.message });
        throw new BadRequestException(result.message);
      }
      this.logger.info('Промокод успешно отредактирован');
      return { message: 'Промокод успешно отредактирован' };
    } catch (error) {
      this.logger.error('Ошибка при редактировании промокода', { error: error.message });
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
    this.logger.info(`Запрос на удаление промокода: ${dto.code}`);
    try {
      const result = await this.promoCodesService.delPromoCode(dto);
      if (result instanceof Error) {
        this.logger.warn('Ошибка при удалении промокода', { error: result.message });
        throw new BadRequestException(result.message);
      }
      this.logger.info('Промокод успешно удален');
      return { message: 'Промокод успешно удален' };
    } catch (error) {
      this.logger.error('Ошибка при удалении промокода', { error: error.message });
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
    this.logger.info(`Запрос на установку активного промокода ${dto.promoId} пользователю: ${dto.userId}`);
    try {
      await this.promoCodesService.setActivePromoCode(dto);
      this.logger.info('Промокод успешно установлен как активный');
    } catch (error) {
      this.logger.error('Ошибка при установке активного промокода', { error: error.message });
      throw new BadRequestException(`Ошибка при установке активного промокода: ${error.message}`);
    }
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
    this.logger.info(`Запрос на применение промо кода:${code} пользователю: ${userId}`);
    try {
      const result = await this.promoCodesService.defineAndApplyCode({ code, userId });
      this.logger.info(`Промо код ${code} успешно применен пользователю: ${userId}`);
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        this.logger.error('Ошибка при применении промо кода', { error: error.message });
        throw error;
      }
      this.logger.error('Не удалось применить промо код', { error: error.message });
      throw new BadRequestException({
        message: 'Не удалось применить промо код',
        code: 'UNKNOWN_ERROR',
      });
    }
  }
}
