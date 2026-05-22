import { Request, Response, NextFunction } from 'express';
import { ventasService } from './ventas.service';
import { sendSuccess, sendSuccessWithMeta } from '../../shared/utils/response';
import { getPaginationMeta, getPaginationParams } from '../../shared/utils/pagination';

export const ventasController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const sale = await ventasService.createSale(req.body);
      sendSuccess(res, sale, 201);
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPaginationParams(req.query as { page?: string; limit?: string });
      const { sales, total } = await ventasService.listSales(page, limit);
      const meta = getPaginationMeta(total, { page, limit });
      sendSuccessWithMeta(res, sales, meta);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const sale = await ventasService.getSaleById(req.params.id as string);
      sendSuccess(res, sale);
    } catch (error) {
      next(error);
    }
  },

  async verifyStock(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ventasService.verifyStock(req.body.items);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },
};
