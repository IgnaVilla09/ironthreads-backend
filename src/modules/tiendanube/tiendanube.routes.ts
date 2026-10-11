import { Router } from 'express';
import { requireAuthSession } from '../auth/auth.middleware';
import { tiendaNubeController } from './tiendanube.controller';
import { validate } from '../../shared/middleware/validate';
import { z } from 'zod';

const router = Router();
const emailSchema = z.object({ email: z.string().trim().email(), reason: z.string().trim().max(500).optional() });
const bulkEmailSchema = z.object({ subject: z.string().trim().min(1).max(255), html: z.string().min(1), minTotalSpent: z.number().nonnegative().optional() });

router.get('/health', requireAuthSession, tiendaNubeController.health);
router.get('/checkouts', requireAuthSession, tiendaNubeController.checkouts);
router.get('/message-logs', requireAuthSession, tiendaNubeController.messageLogs);
router.get('/customers', requireAuthSession, tiendaNubeController.customers);
router.post('/customers/sync', requireAuthSession, tiendaNubeController.syncCustomers);
router.get('/email-suppressions', requireAuthSession, tiendaNubeController.emailSuppressions);
router.post('/email-suppressions', requireAuthSession, validate(emailSchema), tiendaNubeController.addEmailSuppression);
router.delete('/email-suppressions/:id', requireAuthSession, tiendaNubeController.removeEmailSuppression);
router.get('/email-history', requireAuthSession, tiendaNubeController.emailHistory);
router.post('/direct-email', requireAuthSession, validate(z.object({ to: z.string().trim().email(), subject: z.string().trim().min(1).max(255), html: z.string().min(1) })), tiendaNubeController.sendDirectEmail);
router.post('/bulk-email', requireAuthSession, validate(bulkEmailSchema), tiendaNubeController.sendBulkEmail);
router.get('/campaigns', requireAuthSession, tiendaNubeController.campaigns);
router.get('/campaigns/templates', requireAuthSession, tiendaNubeController.campaignTemplates);
router.post('/campaigns/preview-audience', requireAuthSession, tiendaNubeController.previewCampaignAudience);
router.post('/campaigns', requireAuthSession, tiendaNubeController.createCampaign);
router.get('/campaigns/:id/logs', requireAuthSession, tiendaNubeController.campaignLogs);
router.post('/campaigns/:id/:action', requireAuthSession, tiendaNubeController.campaignAction);
router.get('/campaigns/:id', requireAuthSession, tiendaNubeController.campaign);

export default router;
