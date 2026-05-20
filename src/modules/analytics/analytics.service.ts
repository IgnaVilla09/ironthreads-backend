import { analyticsRepository } from './analytics.repository';

export const analyticsService = {
  async getBySize() {
    return analyticsRepository.countBySize();
  },

  async getByColor() {
    return analyticsRepository.countByColor();
  },

  async getLowStock(threshold?: number) {
    return analyticsRepository.findLowStock(threshold ?? 3);
  },

  async getGeneralStats() {
    return analyticsRepository.getGeneralStats();
  },
};
