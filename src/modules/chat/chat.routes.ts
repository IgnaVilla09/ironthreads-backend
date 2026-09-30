import { Router } from 'express';
import { chatController } from './chat.controller';
import { requireAuthSession } from '../auth/auth.middleware';

const router = Router();
router.use(requireAuthSession);

router.post('/message', chatController.handleMessage);
router.delete('/messages/:conversationId', chatController.clearMessageContext);

export default router;
