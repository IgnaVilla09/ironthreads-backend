import 'express';

declare global {
  namespace Express {
    interface Request {
      authSession?: {
        sessionId: string;
        userId: string;
        username: string;
        firstName: string;
        lastName: string;
        adminApiKey: string;
      };
    }
  }
}

export {};
