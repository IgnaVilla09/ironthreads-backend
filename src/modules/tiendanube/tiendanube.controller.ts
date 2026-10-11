import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/response';
import { sendDirectEmail } from '../../shared/email';
import { sendBulkEmails } from '../../shared/email';
import { AppError } from '../../shared/errors/app-error';
import { emailSuppressionService } from './email-suppression.service';
import { emailHistoryService } from './email-history.service';
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

  async sendDirectEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await sendDirectEmail(req.body);
      await emailHistoryService.create({ type: 'single', recipient: req.body.to, recipientCount: 1, suppressedCount: 0, subject: req.body.subject, providerId: result.id, sentById: req.authSession!.userId });
      sendSuccess(res, result, 201);
    } catch (error) { next(error); }
  },

  async sendBulkEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const customers = await tiendaNubeService.getMarketingCustomers(req.authSession!.adminApiKey, req.body.minTotalSpent);
      const recipients = new Map<string, string | null>();
      for (const customer of customers) {
        const email = customer.email!.trim().toLowerCase();
        if (!recipients.has(email)) recipients.set(email, customer.name);
      }
      const suppressed = await emailSuppressionService.findEmails([...recipients.keys()]);
      const messages = [...recipients].filter(([email]) => !suppressed.has(email)).map(([to, name]) => ({
        to,
        subject: req.body.subject,
        html: req.body.html.replaceAll('{{name}}', name || ''),
      }));

      if (!messages.length) throw new AppError(400, 'NO_RECIPIENTS', 'No hay destinatarios elegibles para este envío');
      await sendBulkEmails(messages);
      await emailHistoryService.create({ type: 'bulk', recipient: null, recipientCount: messages.length, suppressedCount: suppressed.size, subject: req.body.subject, providerId: null, sentById: req.authSession!.userId });
      sendSuccess(res, { sent: messages.length, suppressed: suppressed.size, totalEligible: recipients.size }, 201);
    } catch (error) { next(error); }
  },

  async emailSuppressions(_req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await emailSuppressionService.list()); } catch (error) { next(error); }
  },

  async addEmailSuppression(req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await emailSuppressionService.add(req.body.email, req.body.reason, req.authSession!.userId), 201); } catch (error) { next(error); }
  },

  async removeEmailSuppression(req: Request, res: Response, next: NextFunction) {
    try { await emailSuppressionService.remove(req.params.id); res.status(204).end(); } catch (error) { next(error); }
  },

  async emailHistory(_req: Request, res: Response, next: NextFunction) {
    try { sendSuccess(res, await emailHistoryService.list()); } catch (error) { next(error); }
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
