import { Request, Response, NextFunction } from 'express';
import { ventasService } from './ventas.service';
import { sendSuccess, sendSuccessWithMeta } from '../../shared/utils/response';

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
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await ventasService.listSales(page, limit);
      sendSuccessWithMeta(res, result.sales, {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      });
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
      const result = await ventasService.verifyStock(
        req.body.items,
        req.body.pointOfSaleId,
        req.body.depositoId
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async exportExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to } = req.query;
      const result = await ventasService.exportSalesToExcel(
        from ? new Date(from as string) : undefined,
        to ? new Date(to as string) : undefined
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },
};
