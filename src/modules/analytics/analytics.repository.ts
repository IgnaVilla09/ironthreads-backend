import { productRepository } from '../products/product.repository';

export const analyticsRepository = {
  countBySize: productRepository.countBySize,
  countByColor: productRepository.countByColor,
  findLowStock: productRepository.findLowStockVariants,
  bestSellingSizes: productRepository.findBestSellingSizes,
  getGeneralStats: productRepository.getStats,
};
