import { cognitoService } from './cognitoService';
import type { CloudMapMeta, CloudMapFull, CreateMapPayload, UpdateMapPayload, CloudMapListResponse } from '../types/sync';
import type { ShareInfo, ShareStatus } from '../types/sharing';
import type { BrowseLibraryResponse, LibraryMapFull, PublishMapPayload, RateMapResponse, CategoriesResponse } from '../types/library';
import type { VersionListResponse, VersionFull } from '../types/versions';

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

async function publicRequest<T>(path: string): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(data?.error || `HTTP ${response.status}`, response.status, data);
  }
  return response.json();
}

// Plan status cache — deduplicates the 5+ independent getPlanStatus() calls per page load
type PlanStatusResponse = { plan: string; mapCount: number; mapLimit: number | null; hasStripeCustomer: boolean; monthlyPriceId: string; annualPriceId: string };
let planStatusCache: { data: PlanStatusResponse; timestamp: number } | null = null;
let planStatusInflight: Promise<PlanStatusResponse> | null = null;
const PLAN_STATUS_TTL = 60_000; // 60 seconds

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

  getPlanStatus: async (): Promise<PlanStatusResponse> => {
    if (planStatusCache && Date.now() - planStatusCache.timestamp < PLAN_STATUS_TTL) {
      return planStatusCache.data;
    }
    if (planStatusInflight) {
      return planStatusInflight;
    }
    planStatusInflight = request<PlanStatusResponse>({ method: 'GET', path: '/stripe/status' })
      .then((data) => {
        planStatusCache = { data, timestamp: Date.now() };
        planStatusInflight = null;
        return data;
      })
      .catch((err) => {
        planStatusInflight = null;
        throw err;
      });
    return planStatusInflight;
  },

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

  // Library (public)
  browseLibrary: (params: { page?: number; sort?: string; category?: string; search?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.sort) query.set('sort', params.sort);
    if (params.category) query.set('category', params.category);
    if (params.search) query.set('search', params.search);
    const qs = query.toString();
    return publicRequest<BrowseLibraryResponse>(`/library${qs ? `?${qs}` : ''}`);
  },

  getLibraryMap: (id: string) =>
    publicRequest<LibraryMapFull>(`/library/${id}`),

  getLibraryCategories: () =>
    publicRequest<CategoriesResponse>('/library/categories'),

  // Library (authenticated)
  publishMap: (payload: PublishMapPayload) =>
    request<LibraryMapFull>({ method: 'POST', path: '/library', body: payload }),

  updatePublishedMap: (id: string, payload: Partial<PublishMapPayload>) =>
    request<LibraryMapFull>({ method: 'PUT', path: `/library/${id}`, body: payload }),

  unpublishMap: (id: string) =>
    request<void>({ method: 'DELETE', path: `/library/${id}` }),

  forkMap: (id: string) =>
    request<CloudMapMeta>({ method: 'POST', path: `/library/${id}/fork` }),

  rateMap: (id: string, rating: number) =>
    request<RateMapResponse>({ method: 'POST', path: `/library/${id}/rate`, body: { rating } }),

  // Version history (Pro)
  getVersions: (mapId: string) =>
    request<VersionListResponse>({ method: 'GET', path: `/mindmaps/${mapId}/versions` }),

  getVersion: (mapId: string, versionId: string) =>
    request<VersionFull>({ method: 'GET', path: `/mindmaps/${mapId}/versions/${versionId}` }),

  restoreVersion: (mapId: string, versionId: string) =>
    request<CloudMapFull>({ method: 'POST', path: `/mindmaps/${mapId}/versions/${versionId}/restore` }),

  // Collaboration
  createCollabInvite: (mapId: string) =>
    request<{ id: string; map_id: string; invite_token: string; role: string; status: string; created_at: string; expires_at: string }>({
      method: 'POST',
      path: `/mindmaps/${mapId}/collab/invite`,
      body: {},
    }),

  getCollabInvites: (mapId: string) =>
    request<{ invites: Array<{ id: string; map_id: string; invite_token: string; invitee_email: string | null; invitee_id: string | null; role: string; status: string; created_at: string; expires_at: string }> }>({
      method: 'GET',
      path: `/mindmaps/${mapId}/collab/invites`,
    }),

  deleteCollabInvite: (mapId: string, inviteId: string) =>
    request<void>({
      method: 'DELETE',
      path: `/mindmaps/${mapId}/collab/invite/${inviteId}`,
    }),

  acceptCollabInvite: (token: string) =>
    request<{ invite: { id: string; map_id: string; role: string } }>({
      method: 'POST',
      path: `/mindmaps/collab/accept/${token}`,
    }),

  // Teams
  createTeam: (name: string) =>
    request<{ team: { id: string; name: string; owner_id: string; seat_count: number; created_at: string }; checkoutUrl?: string }>({
      method: 'POST',
      path: '/teams',
      body: { name },
    }),

  getTeam: (teamId: string) =>
    request<{ team: { id: string; name: string; owner_id: string; seat_count: number; created_at: string }; members: Array<{ id: string; username: string; email: string; team_role: string }> }>({
      method: 'GET',
      path: `/teams/${teamId}`,
    }),

  addTeamMember: (teamId: string, memberId: string) =>
    request<{ message: string; seatCount: number }>({
      method: 'POST',
      path: `/teams/${teamId}/members`,
      body: { memberId },
    }),

  removeTeamMember: (teamId: string, userId: string) =>
    request<{ message: string; seatCount: number }>({
      method: 'DELETE',
      path: `/teams/${teamId}/members/${userId}`,
    }),
};
