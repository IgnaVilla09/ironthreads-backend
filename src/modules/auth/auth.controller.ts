import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/errors/app-error';
import { sendSuccess } from '../../shared/utils/response';
import { authService } from './auth.service';
import { loginSchema } from './auth.validators';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(loginSchema.parse(req.body));
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.authSession) {
        throw AppError.unauthorized('Sesión no disponible');
      }

      sendSuccess(res, {
        user: {
          id: req.authSession.userId,
          username: req.authSession.username,
          firstName: req.authSession.firstName,
          lastName: req.authSession.lastName,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.header('authorization')?.replace(/^Bearer\s+/i, '').trim();

      if (token) {
        await authService.logout(token);
      }

      sendSuccess(res, { ok: true });
    } catch (error) {
      next(error);
    }
  },
};
