import type { Node, Link } from './mindMap';

/** Server response shape from GET /mindmaps (list) */
export interface CloudMapMeta {
  id: string;
  title: string;
  node_count: number;
  created_at: string;
  updated_at: string;
}

/** Note format serialized for cloud storage (dates as ISO strings) */
export interface SerializedNote {
  id: string;
  nodeId: string;
  mapId?: string;
  content: string;
  contentJson?: unknown;
  contentType: string;
  plainText?: string;
  tags?: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

/** JSONB data payload stored in the server's maps.data column */
export interface CloudMapData {
  nodes: Node[];
  links: Link[];
  notes: SerializedNote[];
  lastModified: string;
}

/** Server response shape from GET /mindmaps/:id */
export interface CloudMapFull extends CloudMapMeta {
  data: CloudMapData;
}

/** Request body for POST /mindmaps */
export interface CreateMapPayload {
  id: string;
  title: string;
  data: CloudMapData;
}

/** Request body for PUT /mindmaps/:id */
export interface UpdateMapPayload {
  title?: string;
  data?: CloudMapData;
}

export type SyncStatus = 'local' | 'synced' | 'cloud-only';

export type CloudSyncState = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';
