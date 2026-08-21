import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import productRoutes from './modules/products/product.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import settingsRoutes from './modules/settings/settings.routes';
import ventasRoutes from './modules/ventas/ventas.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import authRoutes from './modules/auth/auth.routes';
import tiendaNubeRoutes from './modules/tiendanube/tiendanube.routes';
import catalogRoutes from './modules/catalog/catalog.routes';
import { errorHandler } from './shared/middleware/error-handler';
import { notFoundHandler } from './shared/middleware/not-found';
import { prisma } from './config/database';

const app = express();

const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
console.log('[CORS] Allowed origins:', allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10kb' }));

app.get('/api/v1/health', async (_req, res) => {
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      data: {
        status: 'ok',
        database: 'up',
        timestamp,
        environment: env.NODE_ENV,
      },
    });
  } catch {
    res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database connection failed',
      },
      data: {
        status: 'degraded',
        database: 'down',
        timestamp,
        environment: env.NODE_ENV,
      },
    });
  }
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/ventas', ventasRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/tiendanube', tiendaNubeRoutes);
app.use('/api/v1/catalog', catalogRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
