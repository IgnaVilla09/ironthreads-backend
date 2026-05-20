import { Server } from 'http';
import app from './app';
import { env } from './config/env';
import { logger } from './shared/utils/logger';
import { prisma } from './config/database';

let server: Server;

async function main() {
  try {
    await prisma.$connect();
    logger.info('Connected to database');

    server = app.listen(env.PORT, () => {
      logger.info(`Server running on http://localhost:${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${env.PORT}/api/v1/health`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

main();

async function shutdown(signal: string) {
  logger.info(`${signal} received. Shutting down gracefully...`);

  if (server) {
    server.close();
  }

  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
