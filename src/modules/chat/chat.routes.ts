import { Router } from 'express';
import { chatController } from './chat.controller';

const router = Router();

router.post('/message', chatController.handleMessage);
router.delete('/messages/:conversationId', chatController.clearMessageContext);

export default router;