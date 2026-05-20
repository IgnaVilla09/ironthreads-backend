import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/app-error';
import { ApiResponse } from '../../types/shared';
import { logger } from '../utils/logger';
import { env } from '../../config/env';

const PRISMA_ERROR_CODES: Record<string, { status: number; code: string; message: string }> = {
  P2002: { status: 409, code: 'CONFLICT', message: 'El registro ya existe' },
  P2025: { status: 404, code: 'NOT_FOUND', message: 'Registro no encontrado' },
  P2003: { status: 400, code: 'FOREIGN_KEY_ERROR', message: 'Error de clave foránea' },
};

function handlePrismaError(err: Prisma.PrismaClientKnownRequestError): AppError {
  const mapping = PRISMA_ERROR_CODES[err.code];
  if (mapping) {
    return new AppError(mapping.status, mapping.code, mapping.message, {
      prismaCode: err.code,
      meta: err.meta,
    });
  }
  return AppError.internal('Error de base de datos');
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.warn(`AppError: ${err.code} - ${err.message}`, {
      statusCode: err.statusCode,
      details: err.details,
    });

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));

    logger.warn('Validation error', details);

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Error de validación',
        details,
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const appError = handlePrismaError(err);
    logger.error(`Prisma error: ${err.code}`, { meta: err.meta });

    res.status(appError.statusCode).json({
      success: false,
      error: {
        code: appError.code,
        message: appError.message,
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.error('Prisma validation error', { message: err.message });

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Error de validación de datos',
      },
    });
    return;
  }

  logger.error(`Unhandled error: ${err.message}`, {
    stack: err.stack,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production'
        ? 'Error interno del servidor'
        : err.message,
    },
  });
}
