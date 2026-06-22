import { randomBytes } from 'crypto';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/app-error';
import { decryptText, encryptText, hashToken } from '../../shared/utils/crypto';
import { hashPassword, verifyPassword } from '../../shared/utils/password';
import { authRepository } from './auth.repository';
import { LoginInput } from './auth.validators';

type AuthUserPayload = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
};

export type AuthSessionPayload = {
  sessionId: string;
  user: AuthUserPayload;
  adminApiKey: string;
  expiresAt: string;
};

function addDays(base: Date, days: number) {
  const result = new Date(base);
  result.setDate(result.getDate() + days);
  return result;
}

export const authService = {
  async login(input: LoginInput) {
    await authRepository.deleteExpiredSessions();

    const user = await authRepository.findUserByUsername(input.username);

    if (!user || !user.isActive || !verifyPassword(input.password, user.passwordHash)) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Usuario o contraseña inválidos');
    }

    const plainToken = randomBytes(48).toString('base64url');
    const expiresAt = addDays(new Date(), env.SESSION_TTL_DAYS);

    await authRepository.createSession(user.id, hashToken(plainToken), expiresAt);

    return {
      sessionToken: plainToken,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
      },
    };
  },

  async getSessionByToken(sessionToken: string): Promise<AuthSessionPayload> {
    const session = await authRepository.findSessionByTokenHash(hashToken(sessionToken));

    if (!session || !session.user.isActive) {
      throw new AppError(401, 'INVALID_SESSION', 'Sesión inválida');
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await authRepository.deleteSession(session.id);
      throw new AppError(401, 'SESSION_EXPIRED', 'La sesión expiró');
    }

    await authRepository.touchSession(session.id);

    return {
      sessionId: session.id,
      expiresAt: session.expiresAt.toISOString(),
      adminApiKey: decryptText(session.user.adminApiKeyEncrypted),
      user: {
        id: session.user.id,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        username: session.user.username,
      },
    };
  },

  async logout(sessionToken: string) {
    const session = await authRepository.findSessionByTokenHash(hashToken(sessionToken));

    if (session) {
      await authRepository.deleteSession(session.id);
    }
  },

  async createUser(input: {
    firstName: string;
    lastName: string;
    username: string;
    password: string;
    adminApiKey: string;
  }) {
    return authRepository.createUser({
      firstName: input.firstName,
      lastName: input.lastName,
      username: input.username,
      passwordHash: hashPassword(input.password),
      adminApiKeyEncrypted: encryptText(input.adminApiKey),
    });
  },
};
