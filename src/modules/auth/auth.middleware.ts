import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/errors/app-error';
import { authService } from './auth.service';

function extractBearerToken(req: Request) {
  const authHeader = req.header('authorization');
  if (!authHeader) {
    return null;
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export async function requireAuthSession(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      throw new AppError(401, 'AUTH_REQUIRED', 'Debes iniciar sesión');
    }

    const session = await authService.getSessionByToken(token);

    req.authSession = {
      sessionId: session.sessionId,
      userId: session.user.id,
      username: session.user.username,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      adminApiKey: session.adminApiKey,
    };

    next();
  } catch (error) {
    next(error);
  }
}
