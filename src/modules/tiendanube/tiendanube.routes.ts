import { Router } from 'express';
import { requireAuthSession } from '../auth/auth.middleware';
import { tiendaNubeController } from './tiendanube.controller';

const router = Router();

router.get('/health', requireAuthSession, tiendaNubeController.health);
router.get('/checkouts', requireAuthSession, tiendaNubeController.checkouts);
router.get('/message-logs', requireAuthSession, tiendaNubeController.messageLogs);
router.get('/customers', requireAuthSession, tiendaNubeController.customers);
router.post('/customers/sync', requireAuthSession, tiendaNubeController.syncCustomers);
router.get('/campaigns', requireAuthSession, tiendaNubeController.campaigns);
router.get('/campaigns/templates', requireAuthSession, tiendaNubeController.campaignTemplates);
router.post('/campaigns/preview-audience', requireAuthSession, tiendaNubeController.previewCampaignAudience);
router.post('/campaigns', requireAuthSession, tiendaNubeController.createCampaign);
router.get('/campaigns/:id/logs', requireAuthSession, tiendaNubeController.campaignLogs);
router.post('/campaigns/:id/:action', requireAuthSession, tiendaNubeController.campaignAction);
router.get('/campaigns/:id', requireAuthSession, tiendaNubeController.campaign);

export default router;
