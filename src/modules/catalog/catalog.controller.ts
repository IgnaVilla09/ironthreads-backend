import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendSuccessWithMeta } from '../../shared/utils/response';
import { catalogService } from './catalog.service';

export const catalogController = {
  async listPublicProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await catalogService.listPublicProducts(req.query as Record<string, unknown>);
      sendSuccessWithMeta(res, result.products, result.meta);
    } catch (error) {
      next(error);
    }
  },

  async getPublicProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await catalogService.getPublicProductById(
        req.params.id,
        req.query.pointOfSaleId as string | undefined
      );
      sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  },

  async createPublicOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await catalogService.createCatalogOrder(req.body);
      sendSuccess(res, order, 201);
    } catch (error) {
      next(error);
    }
  },

  async getPublicOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await catalogService.getPublicOrderById(req.params.id);
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  },

  async listOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await catalogService.listOrders(req.query as Record<string, unknown>);
      sendSuccessWithMeta(res, result.orders, result.meta);
    } catch (error) {
      next(error);
    }
  },

  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await catalogService.getOrderById(req.params.id);
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  },

  async reportPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await catalogService.markPaymentReported(req.params.id);
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  },

  async confirmOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await catalogService.confirmOrder(req.params.id);
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  },

  async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await catalogService.cancelOrder(req.params.id);
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  },

  async rejectOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await catalogService.rejectOrder(req.params.id);
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  },
};
