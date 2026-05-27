import { Request, Response, NextFunction } from 'express';
import { inventoryService } from './inventory.service';
import { sendSuccess, sendSuccessWithMeta } from '../../shared/utils/response';

export const inventoryController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const inventory = await inventoryService.listInventory(req.query as Record<string, unknown>);
      sendSuccess(res, inventory);
    } catch (error) {
      next(error);
    }
  },

  async getByVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const inventory = await inventoryService.getInventoryByVariant(req.params.variantId as string);
      sendSuccess(res, inventory);
    } catch (error) {
      next(error);
    }
  },

  async transfer(req: Request, res: Response, next: NextFunction) {
    try {
      const transfer = await inventoryService.transferStock(req.body);
      sendSuccess(res, transfer, 201);
    } catch (error) {
      next(error);
    }
  },

  async listTransfers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.listTransfers(req.query as Record<string, unknown>);
      sendSuccessWithMeta(res, result.transfers, result.meta);
    } catch (error) {
      next(error);
    }
  },

  async setVariantInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const inventory = await inventoryService.setVariantInventory(
        req.params.variantId,
        req.body.items
      );
      sendSuccess(res, inventory);
    } catch (error) {
      next(error);
    }
  },
};
