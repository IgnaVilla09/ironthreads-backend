import { Request, Response, NextFunction } from 'express';
import { productService } from './product.service';
import { sendSuccess, sendSuccessWithMeta } from '../../shared/utils/response';

export const productController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productService.listProducts(req.query as Record<string, unknown>);
      sendSuccessWithMeta(res, result.products, result.meta);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.getProductById(req.params.id as string);
      sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.createProduct(req.body);
      sendSuccess(res, product, 201);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.updateProduct(
        req.params.id as string,
        req.body
      );
      sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await productService.deleteProduct(req.params.id as string);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },

  // ── Variants ──────────────────────────────────────

  async listVariants(req: Request, res: Response, next: NextFunction) {
    try {
      const variants = await productService.listVariants(req.params.id as string);
      sendSuccess(res, variants);
    } catch (error) {
      next(error);
    }
  },

  async getVariantById(req: Request, res: Response, next: NextFunction) {
    try {
      const variant = await productService.getVariantById(
        req.params.variantId as string
      );
      sendSuccess(res, variant);
    } catch (error) {
      next(error);
    }
  },

  async createVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const variant = await productService.createVariant(
        req.params.id as string,
        req.body
      );
      sendSuccess(res, variant, 201);
    } catch (error) {
      next(error);
    }
  },

  async updateVariant(req: Request, res: Response, next: NextFunction) {
    try {
      const variant = await productService.updateVariant(
        req.params.variantId as string,
        req.body
      );
      sendSuccess(res, variant);
    } catch (error) {
      next(error);
    }
  },

  async deleteVariant(req: Request, res: Response, next: NextFunction) {
    try {
      await productService.deleteVariant(req.params.variantId as string);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
};
