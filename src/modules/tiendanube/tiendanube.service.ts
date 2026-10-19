import { env } from '../../config/env';
import { AppError } from '../../shared/errors/app-error';

type TiendaNubeCustomer = {
  email: string | null;
  name: string | null;
  totalSpent: string | null;
  acceptsMarketing: boolean;
  unsubscribedAt: string | null;
};

type CustomersPage = { items: TiendaNubeCustomer[]; total: number; perPage: number };

async function request<T>(endpoint: string, adminApiKey?: string, options: { method?: 'GET' | 'POST'; body?: unknown } = {}): Promise<T> {
  const response = await fetch(new URL(endpoint, env.ABANDONED_API_URL), {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(adminApiKey ? { 'x-admin-api-key': adminApiKey } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
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
    const upstreamError = payload && typeof payload === 'object' && 'error' in payload
      ? (payload as { error?: unknown }).error
      : undefined;
    const message = typeof upstreamError === 'string'
      ? upstreamError
      : upstreamError && typeof upstreamError === 'object' && 'message' in upstreamError
        ? String((upstreamError as { message?: unknown }).message ?? '')
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

  createMobbexQr(adminApiKey: string, body: { total: number; reference: string; email: string }) {
    return request<unknown>('/admin/mobbex/qr', adminApiKey, { method: 'POST', body });
  },

  getCustomers(adminApiKey: string, query?: string) {
    return request(`/admin/customers${query ? `?${query}` : ''}`, adminApiKey);
  },

  async getMarketingCustomers(adminApiKey: string, minTotalSpent?: number) {
    const customers: TiendaNubeCustomer[] = [];
    let page = 1;
    let total = 0;
    const perPage = 100;

    do {
      const result = await request<CustomersPage>(`/admin/customers?page=${page}&perPage=${perPage}&acceptsMarketing=true`, adminApiKey);
      customers.push(...result.items);
      total = result.total;
      page += 1;
    } while (customers.length < total);

    return customers.filter((customer) => {
      const totalSpent = Number(customer.totalSpent ?? 0);
      return Boolean(customer.email) && customer.acceptsMarketing && !customer.unsubscribedAt && (!minTotalSpent || totalSpent >= minTotalSpent);
    });
  },

  syncCustomers(adminApiKey: string) {
    return request('/admin/jobs/sync-customers', adminApiKey, { method: 'POST' });
  },

  getCampaigns(adminApiKey: string) {
    return request('/admin/campaigns', adminApiKey);
  },

  getCampaign(adminApiKey: string, id: string) {
    return request(`/admin/campaigns/${id}`, adminApiKey);
  },

  getCampaignLogs(adminApiKey: string, id: string) {
    return request(`/admin/campaigns/${id}/logs`, adminApiKey);
  },

  getCampaignTemplates(adminApiKey: string) {
    return request('/admin/campaigns/templates', adminApiKey);
  },

  createCampaign(adminApiKey: string, body: unknown) {
    return request('/admin/campaigns', adminApiKey, { method: 'POST', body });
  },

  previewCampaignAudience(adminApiKey: string, body: unknown) {
    return request('/admin/campaigns/preview-audience', adminApiKey, { method: 'POST', body });
  },

  campaignAction(adminApiKey: string, id: string, action: 'send-test' | 'schedule' | 'pause' | 'cancel', body?: unknown) {
    return request(`/admin/campaigns/${id}/${action}`, adminApiKey, { method: 'POST', body });
  },
};
