import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/response';
import { tiendaNubeService } from './tiendanube.service';

export const tiendaNubeController = {
  async health(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tiendaNubeService.getHealth();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async checkouts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tiendaNubeService.getCheckouts(req.authSession!.adminApiKey);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async messageLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tiendaNubeService.getMessageLogs(req.authSession!.adminApiKey);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },
};
