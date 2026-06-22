import { prisma } from '../../config/database';

export const authRepository = {
  findUserByUsername(username: string) {
    return prisma.appUser.findUnique({ where: { username } });
  },

  createSession(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.appSession.create({
      data: { userId, tokenHash, expiresAt },
    });
  },

  findSessionByTokenHash(tokenHash: string) {
    return prisma.appSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
  },

  touchSession(sessionId: string) {
    return prisma.appSession.update({
      where: { id: sessionId },
      data: { lastUsedAt: new Date() },
    });
  },

  deleteSession(sessionId: string) {
    return prisma.appSession.delete({ where: { id: sessionId } });
  },

  deleteExpiredSessions() {
    return prisma.appSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  },

  createUser(data: {
    firstName: string;
    lastName: string;
    username: string;
    passwordHash: string;
    adminApiKeyEncrypted: string;
  }) {
    return prisma.appUser.create({ data });
  },
};
