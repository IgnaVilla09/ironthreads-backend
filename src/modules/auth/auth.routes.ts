import { Router } from 'express';
import { authController } from './auth.controller';
import { requireAuthSession } from './auth.middleware';

const router = Router();

router.post('/login', authController.login);
router.get('/session', requireAuthSession, authController.getSession);
router.post('/logout', requireAuthSession, authController.logout);

export default router;
