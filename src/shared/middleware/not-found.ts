import { Request, Response } from 'express';
import { ApiResponse } from '../../types/shared';

export function notFoundHandler(_req: Request, res: Response<ApiResponse>): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
  });
}
