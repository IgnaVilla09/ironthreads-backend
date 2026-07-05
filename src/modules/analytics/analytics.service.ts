import { analyticsRepository } from './analytics.repository';

export const analyticsService = {
  async getBySize() {
    return analyticsRepository.countBySize();
  },

  async getByColor() {
    return analyticsRepository.countByColor();
  },

  async getLowStock(threshold?: number) {
    return analyticsRepository.findLowStock(threshold ?? 5);
  },

  async getBestSellingSizes(limit?: number) {
    return analyticsRepository.bestSellingSizes(limit ?? 10);
  },

  async getGeneralStats() {
    return analyticsRepository.getGeneralStats();
  },
};
