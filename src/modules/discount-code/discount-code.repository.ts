import { DiscountCode } from '@prisma/client';
import { prisma } from '../../config/database';

export const discountCodeRepository = {
  async listActiveCodes(): Promise<DiscountCode[]> {
    try {
      return prisma.discountCode.findMany({
        where: {
          isActive: true,
        },
      });
    } catch {
      return [];
    }
  },

  async validateCode(code: string): Promise<DiscountCode | null> {
    try {
      return prisma.discountCode.findFirst({
        where: {
          code,
          isActive: true,
        },
      });
    } catch {
      return null;
    }
  },
};