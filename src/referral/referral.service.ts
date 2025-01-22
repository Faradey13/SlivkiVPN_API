import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReferralService {
  constructor(private readonly prisma: PrismaService) {}
  async getUsersRefCode(userId: number) {
    const refCode = await this.prisma.promo_codes.findFirst({
      where: {
        referral_code_out: {
          some: {
            user_id: userId,
          },
        },
      },
    });
    return refCode.code;
  }

  private async applyReferralCode(userId: number, code: string) {
    const codeData = await this.prisma.promo_codes.findUnique({ where: { code: code } });
    await this.prisma.referral_user.update({ where: { user_id: userId }, data: { code_in_id: codeData.id } });
  }
}
