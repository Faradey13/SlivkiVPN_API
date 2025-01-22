import { Injectable } from '@nestjs/common';

@Injectable()
export class PromoService {
  generatePromoCode(length: number, start: string) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    let promoCode = start;
    for (let i = 0; i < length; i++) {
      const randomChar = characters.charAt(Math.floor(Math.random() * characters.length));
      promoCode += randomChar;
    }

    return promoCode;
  }
}
