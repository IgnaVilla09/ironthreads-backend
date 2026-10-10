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

  async customers(req: Request, res: Response, next: NextFunction) {
    try {
      const queryIndex = req.originalUrl.indexOf('?');
      const query = queryIndex === -1 ? undefined : req.originalUrl.slice(queryIndex + 1);
      const result = await tiendaNubeService.getCustomers(req.authSession!.adminApiKey, query);
      sendSuccess(res, result);
    } catch (error) { next(error); }
  },

  async syncCustomers(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await tiendaNubeService.syncCustomers(req.authSession!.adminApiKey)); } catch (error) { next(error); }
  },

  async campaigns(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await tiendaNubeService.getCampaigns(req.authSession!.adminApiKey)); } catch (error) { next(error); }
  },

  async campaignTemplates(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await tiendaNubeService.getCampaignTemplates(req.authSession!.adminApiKey)); } catch (error) { next(error); }
  },

  async campaign(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await tiendaNubeService.getCampaign(req.authSession!.adminApiKey, req.params.id)); } catch (error) { next(error); }
  },

  async campaignLogs(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await tiendaNubeService.getCampaignLogs(req.authSession!.adminApiKey, req.params.id)); } catch (error) { next(error); }
  },

  async createCampaign(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await tiendaNubeService.createCampaign(req.authSession!.adminApiKey, req.body), 201); } catch (error) { next(error); }
  },

  async previewCampaignAudience(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await tiendaNubeService.previewCampaignAudience(req.authSession!.adminApiKey, req.body)); } catch (error) { next(error); }
  },

  async campaignAction(req: Request, res: Response, next: NextFunction) {
    try {
      const action = req.params.action;
      if (action !== 'send-test' && action !== 'schedule' && action !== 'pause' && action !== 'cancel') {
        throw new Error('Accion de campaña inválida');
      }
      sendSuccess(res, await tiendaNubeService.campaignAction(req.authSession!.adminApiKey, req.params.id, action, req.body));
    } catch (error) { next(error); }
  },
};
