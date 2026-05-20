import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';
import { sendSuccess } from '../../shared/utils/response';

export const analyticsController = {
  async getBySize(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getBySize();
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  },

  async getByColor(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getByColor();
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  },

  async getLowStock(req: Request, res: Response, next: NextFunction) {
    try {
      const threshold = req.query.threshold
        ? parseInt(req.query.threshold as string, 10)
        : undefined;
      const data = await analyticsService.getLowStock(
        threshold && !isNaN(threshold) ? threshold : undefined
      );
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  },

  async getGeneralStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.getGeneralStats();
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  },
};
