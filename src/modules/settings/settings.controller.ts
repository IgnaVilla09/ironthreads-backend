import { Request, Response, NextFunction } from 'express';
import { settingsService } from './settings.service';
import { sendSuccess } from '../../shared/utils/response';

export const settingsController = {
  // ── Categories ──────────────────────────────────

  async listCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await settingsService.listCategories();
      sendSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  },

  async getCategoryById(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await settingsService.getCategoryById(req.params.id as string);
      sendSuccess(res, category);
    } catch (error) {
      next(error);
    }
  },

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await settingsService.createCategory(req.body);
      sendSuccess(res, category, 201);
    } catch (error) {
      next(error);
    }
  },

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await settingsService.updateCategory(
        req.params.id as string,
        req.body
      );
      sendSuccess(res, category);
    } catch (error) {
      next(error);
    }
  },

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      await settingsService.deleteCategory(req.params.id as string);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },

  // ── Colors ──────────────────────────────────────

  async listColors(_req: Request, res: Response, next: NextFunction) {
    try {
      const colors = await settingsService.listColors();
      sendSuccess(res, colors);
    } catch (error) {
      next(error);
    }
  },

  async getColorById(req: Request, res: Response, next: NextFunction) {
    try {
      const color = await settingsService.getColorById(req.params.id as string);
      sendSuccess(res, color);
    } catch (error) {
      next(error);
    }
  },

  async createColor(req: Request, res: Response, next: NextFunction) {
    try {
      const color = await settingsService.createColor(req.body);
      sendSuccess(res, color, 201);
    } catch (error) {
      next(error);
    }
  },

  async updateColor(req: Request, res: Response, next: NextFunction) {
    try {
      const color = await settingsService.updateColor(
        req.params.id as string,
        req.body
      );
      sendSuccess(res, color);
    } catch (error) {
      next(error);
    }
  },

  async deleteColor(req: Request, res: Response, next: NextFunction) {
    try {
      await settingsService.deleteColor(req.params.id as string);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },

  // ── Sizes ───────────────────────────────────────

  async listSizes(_req: Request, res: Response, next: NextFunction) {
    try {
      const sizes = await settingsService.listSizes();
      sendSuccess(res, sizes);
    } catch (error) {
      next(error);
    }
  },

  async getSizeById(req: Request, res: Response, next: NextFunction) {
    try {
      const size = await settingsService.getSizeById(req.params.id as string);
      sendSuccess(res, size);
    } catch (error) {
      next(error);
    }
  },

  async createSize(req: Request, res: Response, next: NextFunction) {
    try {
      const size = await settingsService.createSize(req.body);
      sendSuccess(res, size, 201);
    } catch (error) {
      next(error);
    }
  },

  async updateSize(req: Request, res: Response, next: NextFunction) {
    try {
      const size = await settingsService.updateSize(
        req.params.id as string,
        req.body
      );
      sendSuccess(res, size);
    } catch (error) {
      next(error);
    }
  },

  async deleteSize(req: Request, res: Response, next: NextFunction) {
    try {
      await settingsService.deleteSize(req.params.id as string);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
};
