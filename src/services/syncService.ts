import { apiClient, ApiError } from './apiClient';
import { getDatabase } from './database';
import type { Node, Link, MapMetadata } from '../types/mindMap';
import type { NodeNote } from '../types/notes';
import type { CloudMapData, CloudMapMeta, SerializedNote } from '../types/sync';

// In-flight lock to prevent concurrent pushes of the same map
const inFlightPushes = new Set<string>();

/** Read notes for a map from IDB mapNotes store */
async function getNotesForMap(mapId: string): Promise<NodeNote[]> {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['mapNotes'], 'readonly');
    const store = tx.objectStore('mapNotes');
    const index = store.index('mapId');
    const request = index.getAll(mapId);
    request.onsuccess = () => resolve(request.result ?? []);
    request.onerror = () => reject(new Error('Failed to read notes'));
  });
}

/** Serialize notes for cloud storage (Date -> ISO string) */
function serializeNotes(notes: NodeNote[]): SerializedNote[] {
  return notes.map((n) => ({
    id: n.id,
    nodeId: n.nodeId,
    mapId: n.mapId,
    content: n.content,
    contentJson: n.contentJson,
    contentType: n.contentType,
    plainText: n.plainText,
    tags: n.tags,
    isPinned: n.isPinned,
    createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : String(n.createdAt),
    updatedAt: n.updatedAt instanceof Date ? n.updatedAt.toISOString() : String(n.updatedAt),
  }));
}

/** Build the JSONB data payload the server expects */
function buildCloudData(nodes: Node[], links: Link[], notes: NodeNote[]): CloudMapData {
  return {
    nodes,
    links,
    notes: serializeNotes(notes),
    lastModified: new Date().toISOString(),
  };
}

/** Update sync-related fields in IDB mapMetadata */
async function updateSyncMetadata(
  mapId: string,
  syncFields: { lastSyncedAt?: string; syncStatus?: 'local' | 'synced' | 'cloud-only' }
): Promise<void> {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['mapMetadata'], 'readwrite');
    const store = tx.objectStore('mapMetadata');
    const req = store.get(mapId);
    req.onsuccess = () => {
      const existing = req.result;
      if (existing) {
        store.put({ ...existing, ...syncFields });
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error('Failed to update sync metadata'));
  });
}

/** Push a single map to cloud. Creates if not yet synced, updates if already synced. */
export async function pushMapToCloud(mapId: string): Promise<CloudMapMeta> {
  if (inFlightPushes.has(mapId)) {
    throw new Error('Push already in progress');
  }
  inFlightPushes.add(mapId);

  try {
    const db = await getDatabase();

    // Read map data from IDB
    const mapData = await new Promise<{ nodes: Node[]; links: Link[] } | undefined>((resolve, reject) => {
      const tx = db.transaction(['mindmaps'], 'readonly');
      const store = tx.objectStore('mindmaps');
      const req = store.get(`map-${mapId}`);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(new Error('Failed to read map from IDB'));
    });

    if (!mapData || !mapData.nodes?.length) {
      throw new Error(`Map ${mapId} not found in local storage`);
    }

    // Read metadata for title
    const meta = await new Promise<MapMetadata | undefined>((resolve, reject) => {
      const tx = db.transaction(['mapMetadata'], 'readonly');
      const store = tx.objectStore('mapMetadata');
      const req = store.get(mapId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(new Error('Failed to read metadata'));
    });

    const title = meta?.title ?? 'Untitled Map';
    const notes = await getNotesForMap(mapId);
    const cloudData = buildCloudData(mapData.nodes, mapData.links, notes);

    // Try update first (PUT). If 404, create (POST).
    let result: CloudMapMeta;
    try {
      result = await apiClient.updateMap(mapId, { title, data: cloudData });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        result = await apiClient.createMap({ id: mapId, title, data: cloudData });
      } else {
        throw err;
      }
    }

    // Update local metadata with sync info
    await updateSyncMetadata(mapId, {
      lastSyncedAt: new Date().toISOString(),
      syncStatus: 'synced',
    });

    return result;
  } finally {
    inFlightPushes.delete(mapId);
  }
}

/** Fetch all cloud maps and return metadata array */
export async function pullCloudMapList(): Promise<CloudMapMeta[]> {
  return apiClient.getMaps();
}

/** Download a specific cloud map and write it into local IDB */
export async function pullMapFromCloud(mapId: string): Promise<void> {
  const cloudMap = await apiClient.getMap(mapId);
  const db = await getDatabase();

  await new Promise<void>((resolve, reject) => {
    const storeNames = ['mindmaps', 'mapMetadata', 'mapNotes'];
    const tx = db.transaction(storeNames, 'readwrite');

    // Write map data
    tx.objectStore('mindmaps').put(
      {
        nodes: cloudMap.data.nodes,
        links: cloudMap.data.links,
        lastModified: cloudMap.data.lastModified,
      },
      `map-${mapId}`
    );

    // Write metadata
    tx.objectStore('mapMetadata').put({
      id: mapId,
      title: cloudMap.title,
      createdAt: cloudMap.created_at,
      updatedAt: cloudMap.updated_at,
      nodeCount: cloudMap.node_count,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: 'synced' as const,
    });

    // Write notes if present
    if (cloudMap.data.notes?.length) {
      const notesStore = tx.objectStore('mapNotes');
      for (const note of cloudMap.data.notes) {
        notesStore.put({
          ...note,
          mapId,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        });
      }
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error('Failed to write cloud map to IDB'));
  });
}

/** Delete a map from cloud */
export async function deleteMapFromCloud(mapId: string): Promise<void> {
  try {
    await apiClient.deleteMap(mapId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return; // Already gone
    }
    throw err;
  }
}
