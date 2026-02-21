import { cognitoService } from './cognitoService';
import type { CloudMapMeta, CloudMapFull, CreateMapPayload, UpdateMapPayload, CloudMapListResponse } from '../types/sync';
import type { ShareInfo, ShareStatus } from '../types/sharing';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  status: number;
  body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function getAccessToken(): Promise<string | null> {
  try {
    const session = await cognitoService.getSession();
    if (session && session.isValid()) {
      return session.getAccessToken().getJwtToken();
    }
  } catch {
    // Session retrieval failed
  }
  return null;
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
}

async function request<T>(options: RequestOptions): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError('Not authenticated', 401);
  }

  const url = `${API_BASE_URL}${options.path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const fetchOptions: RequestInit = {
    method: options.method,
    headers,
  };

  if (options.body !== undefined) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  // One retry on 5xx or network error
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);

      if (response.status === 204) {
        return undefined as T;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.error || `HTTP ${response.status}`,
          response.status,
          data
        );
      }

      return data as T;
    } catch (err) {
      if (err instanceof ApiError && err.status < 500) {
        throw err;
      }
      lastError = err;
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  throw lastError;
}

export const apiClient = {
  getMaps: () =>
    request<CloudMapListResponse>({ method: 'GET', path: '/mindmaps' }),

  getMap: (id: string) =>
    request<CloudMapFull>({ method: 'GET', path: `/mindmaps/${id}` }),

  createMap: (payload: CreateMapPayload) =>
    request<CloudMapMeta>({ method: 'POST', path: '/mindmaps', body: payload }),

  updateMap: (id: string, payload: UpdateMapPayload) =>
    request<CloudMapMeta>({ method: 'PUT', path: `/mindmaps/${id}`, body: payload }),

  deleteMap: (id: string) =>
    request<void>({ method: 'DELETE', path: `/mindmaps/${id}` }),

  // Sharing
  getShareStatus: (id: string) =>
    request<ShareStatus>({ method: 'GET', path: `/mindmaps/${id}/share` }),

  shareMap: (id: string) =>
    request<ShareInfo>({ method: 'POST', path: `/mindmaps/${id}/share` }),

  unshareMap: (id: string) =>
    request<void>({ method: 'DELETE', path: `/mindmaps/${id}/share` }),

  // Stripe / Plan
  createCheckout: (priceId: string) =>
    request<{ url: string }>({ method: 'POST', path: '/stripe/create-checkout', body: { priceId } }),

  createPortal: () =>
    request<{ url: string }>({ method: 'POST', path: '/stripe/create-portal' }),

  getPlanStatus: () =>
    request<{ plan: string; mapCount: number; mapLimit: number | null; hasStripeCustomer: boolean; monthlyPriceId: string; annualPriceId: string }>({ method: 'GET', path: '/stripe/status' }),

  // Public map (no auth required)
  getPublicMap: async (shareToken: string) => {
    const url = `${API_BASE_URL}/public/maps/${shareToken}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new ApiError(
        `HTTP ${response.status}`,
        response.status,
        await response.json().catch(() => null)
      );
    }
    return response.json();
  },
};
