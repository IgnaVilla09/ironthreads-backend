import { Router } from 'express';
import { requireAuthSession } from '../auth/auth.middleware';
import { tiendaNubeController } from './tiendanube.controller';

const router = Router();

router.get('/health', requireAuthSession, tiendaNubeController.health);
router.get('/checkouts', requireAuthSession, tiendaNubeController.checkouts);
router.get('/message-logs', requireAuthSession, tiendaNubeController.messageLogs);

export default router;
