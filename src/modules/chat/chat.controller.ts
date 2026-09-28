import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../shared/utils/response';
import { chatService } from './chat.service';

export const chatController = {
  async handleMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { message, conversationId } = req.body;

      if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const response = await chatService.handleMessage(
        String(message),
        conversationId ? String(conversationId) : undefined
      );

      sendSuccess(res, { response });
    } catch (error) {
      next(error);
    }
  },

  async clearMessageContext(req: Request, res: Response, next: NextFunction) {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        res.status(400).json({ error: 'conversationId is required' });
        return;
      }

      chatService.forgetConversation(String(conversationId));

      sendSuccess(res, { cleared: true });
    } catch (error) {
      next(error);
    }
  },
};