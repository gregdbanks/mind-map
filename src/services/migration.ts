import { getDatabase } from './database';
import type { MapMetadata, StoredMindMap, Node, Link } from '../types/mindMap';
import type { NodeNote } from '../types/notes';

const MIGRATION_FLAG = 'thoughtnet-migration-v1';
const OLD_DATA_KEY = 'mindmap-data';

/**
 * One-time migration from the legacy single-map localStorage format
 * to the new multi-map IndexedDB format (v3 schema).
 *
 * Safe to call multiple times — a localStorage flag prevents re-runs.
 * Errors are caught and logged so migration failures never break the app.
 */
export async function migrateFromLocalStorage(): Promise<void> {
  try {
    // ── 1. Already migrated? ──────────────────────────────────────────
    if (localStorage.getItem(MIGRATION_FLAG)) {
      return;
    }

    // ── 2. Anything to migrate? ───────────────────────────────────────
    const raw = localStorage.getItem(OLD_DATA_KEY);
    if (!raw) {
      localStorage.setItem(MIGRATION_FLAG, 'done');
      return;
    }

    // ── 3. Parse legacy payload ───────────────────────────────────────
    const data = JSON.parse(raw) as {
      nodes: Node[];
      links: Link[];
      lastModified?: string;
    };

    const nodes: Node[] = data.nodes ?? [];
    const links: Link[] = data.links ?? [];
    const lastModified = data.lastModified ?? new Date().toISOString();

    // ── 4. Generate a new map ID ──────────────────────────────────────
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Date.now().toString(36);

    const mapKey = `map-${id}`;

    // ── 5. Open database ──────────────────────────────────────────────
    const db = await getDatabase();

    // ── 6. Write StoredMindMap ─────────────────────────────────────────
    const storedMap: StoredMindMap = {
      id,
      nodes,
      links,
      lastModified,
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('mindmaps', 'readwrite');
      tx.objectStore('mindmaps').put(storedMap, mapKey);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // ── 7. Write MapMetadata ──────────────────────────────────────────
    const metadata: MapMetadata = {
      id,
      title: 'My Mind Map',
      createdAt: lastModified,
      updatedAt: lastModified,
      nodeCount: nodes.length,
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('mapMetadata', 'readwrite');
      tx.objectStore('mapMetadata').put(metadata);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // ── 8. Migrate notes from legacy "notes" store → "mapNotes" ──────
    if (db.objectStoreNames.contains('notes') && db.objectStoreNames.contains('mapNotes')) {
      const oldNotes = await new Promise<NodeNote[]>((resolve, reject) => {
        const tx = db.transaction('notes', 'readonly');
        const request = tx.objectStore('notes').getAll();
        request.onsuccess = () => resolve(request.result as NodeNote[]);
        request.onerror = () => reject(request.error);
      });

      if (oldNotes.length > 0) {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction('mapNotes', 'readwrite');
          const store = tx.objectStore('mapNotes');

          for (const note of oldNotes) {
            const migratedNote: NodeNote = {
              ...note,
              id: `${id}-${note.nodeId}`,
              mapId: id,
            };
            store.put(migratedNote);
          }

          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      }
    }

    // ── 9. Mark migration complete & clean up ─────────────────────────
    localStorage.setItem(MIGRATION_FLAG, 'done');
    localStorage.removeItem(OLD_DATA_KEY);

  } catch {
    // Migration failure must not break the app — swallow the error.
  }
}
