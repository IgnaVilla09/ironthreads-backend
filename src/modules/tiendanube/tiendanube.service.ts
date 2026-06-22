import { env } from '../../config/env';
import { AppError } from '../../shared/errors/app-error';

async function request<T>(endpoint: string, adminApiKey?: string): Promise<T> {
  const response = await fetch(new URL(endpoint, env.ABANDONED_API_URL), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(adminApiKey ? { 'x-admin-api-key': adminApiKey } : {}),
    },
  });

  const rawText = await response.text();
  let payload: unknown = null;

  if (rawText) {
    try {
      payload = JSON.parse(rawText) as unknown;
    } catch {
      payload = rawText;
    }
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? (payload as { error?: { message?: string } }).error?.message
        : undefined;

    throw new AppError(response.status, 'UPSTREAM_ERROR', message || 'Error al consultar la API de Tienda Nube');
  }

  return payload as T;
}

export const tiendaNubeService = {
  getHealth() {
    return request('/health');
  },

  getCheckouts(adminApiKey: string) {
    return request('/admin/checkouts', adminApiKey);
  },

  getMessageLogs(adminApiKey: string) {
    return request('/admin/message-logs', adminApiKey);
  },
};
