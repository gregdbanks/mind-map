import type {
  MindMap,
  Node,
  CanvasState,
  CreateMindMapDto,
  UpdateMindMapDto,
  CreateNodeDto,
  UpdateNodeDto,
  UpdateCanvasDto,
  BatchUpdateNode,
} from '../types'

// Get API base URL - in tests this will be undefined so we use relative paths
const getApiUrl = (path: string) => {
  if (import.meta.env?.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL}${path}`
  }
  // In tests or when no env var is set, use relative path
  return `/api${path}`
}

// Helper function for fetch requests
async function fetchApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = getApiUrl(path)
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

// MindMap API
export const mindMapApi = {
  getAll: async (page?: number, limit?: number) => {
    const params = new URLSearchParams()
    if (page !== undefined && limit !== undefined) {
      params.append('page', page.toString())
      params.append('limit', limit.toString())
    }
    const query = params.toString() ? `?${params}` : ''
    return fetchApi<MindMap[] | { data: MindMap[]; total: number; page: number; limit: number }>(
      `/mindmaps${query}`
    )
  },

  getById: async (id: string, include?: string[]) => {
    const params = new URLSearchParams()
    if (include?.length) {
      params.append('include', include.join(','))
    }
    const query = params.toString() ? `?${params}` : ''
    return fetchApi<MindMap>(`/mindmaps/${id}${query}`)
  },

  create: async (data: CreateMindMapDto) => {
    return fetchApi<MindMap>('/mindmaps', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: UpdateMindMapDto) => {
    return fetchApi<MindMap>(`/mindmaps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete: async (id: string) => {
    return fetchApi<void>(`/mindmaps/${id}`, {
      method: 'DELETE',
    })
  },
}

// Node API
export const nodeApi = {
  getAll: async (mindMapId: string, hierarchical = false) => {
    const params = new URLSearchParams()
    if (hierarchical) {
      params.append('hierarchical', 'true')
    }
    const query = params.toString() ? `?${params}` : ''
    return fetchApi<Node[]>(`/mindmaps/${mindMapId}/nodes${query}`)
  },

  create: async (mindMapId: string, data: CreateNodeDto) => {
    return fetchApi<Node>(`/mindmaps/${mindMapId}/nodes`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: UpdateNodeDto) => {
    return fetchApi<Node>(`/nodes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete: async (id: string) => {
    return fetchApi<void>(`/nodes/${id}`, {
      method: 'DELETE',
    })
  },

  batchUpdate: async (mindMapId: string, updates: BatchUpdateNode[]) => {
    return fetchApi<Node[]>(`/mindmaps/${mindMapId}/nodes/batch-update`, {
      method: 'POST',
      body: JSON.stringify({ updates }),
    })
  },
}

// Canvas API
export const canvasApi = {
  get: async (mindMapId: string) => {
    return fetchApi<CanvasState>(`/mindmaps/${mindMapId}/canvas`)
  },

  update: async (mindMapId: string, data: UpdateCanvasDto) => {
    return fetchApi<CanvasState>(`/mindmaps/${mindMapId}/canvas`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  reset: async (mindMapId: string, centerOnNodes = false) => {
    return fetchApi<CanvasState>(`/mindmaps/${mindMapId}/canvas/reset`, {
      method: 'POST',
      body: JSON.stringify({ centerOnNodes }),
    })
  },
}