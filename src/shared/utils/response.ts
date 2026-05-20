import { Response } from 'express';
import { ApiResponse } from '../../types/shared';

export function sendSuccess<T>(res: Response<ApiResponse<T>>, data: T, status = 200): void {
  res.status(status).json({ success: true, data });
}

export function sendSuccessWithMeta<T>(
  res: Response<ApiResponse<T>>,
  data: T,
  meta: ApiResponse['meta'],
  status = 200
): void {
  res.status(status).json({ success: true, data, meta });
}

export function sendDeleted(res: Response<ApiResponse>): void {
  res.status(204).end();
}
