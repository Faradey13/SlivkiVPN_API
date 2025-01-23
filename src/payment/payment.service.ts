import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReferralService } from '../referral/referral.service';
import { ICreatePayment, YooCheckout } from '@a2seven/yoo-checkout';
import * as process from 'node:process';
import { PromoService } from '../promo/promo.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentService {
  private checkout: YooCheckout;
  constructor(
    private readonly prisma: PrismaService,
    private readonly ReferralService: ReferralService,
    private readonly PromoService: PromoService,
  ) {
    this.checkout = new YooCheckout({ shopId: process.env.KASSA_SHOP_ID, secretKey: process.env.KASSA_SECRET_KEY });
  }
  async createPayment(): Promise<void> {
    const idempotenceKey = uuidv4();

    const createPayload: ICreatePayment = {
      amount: {
        value: '2.00',
        currency: 'RUB',
      },
      payment_method_data: {
        type: 'bank_card',
      },
      description: '',
      confirmation: {
        type: 'redirect',
        return_url: 'https://yourwebsite.com/return-url',
      },
      metadata: {
        user_id: '',
        payment_id: '',
      },
    };

    try {
      const payment = await this.checkout.createPayment(createPayload, idempotenceKey);
      console.log(payment);
      // Здесь можно сохранять информацию о платеже в базу данных, если это необходимо
    } catch (error) {
      console.error(error);
      // Обработка ошибки
    }
  }
}