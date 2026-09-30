import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../shared/utils/response';
import { chatService } from './chat.service';
import { z } from 'zod';

const conversationIdSchema = z.string().trim().min(1).max(128);
const messageSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  conversationId: conversationIdSchema,
});

export const chatController = {
  async handleMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { message, conversationId } = messageSchema.parse(req.body);
      const response = await chatService.handleMessage(message, req.authSession!.userId, conversationId);

      sendSuccess(res, { response });
    } catch (error) {
      next(error);
    }
  },

  async clearMessageContext(req: Request, res: Response, next: NextFunction) {
    try {
      const conversationId = conversationIdSchema.parse(req.params.conversationId);
      await chatService.forgetConversation(req.authSession!.userId, conversationId);

      sendSuccess(res, { cleared: true });
    } catch (error) {
      next(error);
    }
  },
};
