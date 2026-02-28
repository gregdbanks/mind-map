import { useState, useEffect, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import { useCollabDoc } from '../context/CollabMindMapContext';
import { useMapNotes, type UseMapNotesReturn } from './useMapNotes';
import type { NodeNote } from '../types';

function yMapToNote(yNote: Y.Map<unknown>): NodeNote {
  const contentJsonStr = yNote.get('contentJson') as string | undefined;
  let contentJson: unknown;
  if (contentJsonStr && typeof contentJsonStr === 'string') {
    try { contentJson = JSON.parse(contentJsonStr); } catch { contentJson = undefined; }
  } else {
    contentJson = contentJsonStr;
  }

  return {
    id: (yNote.get('id') as string) || '',
    nodeId: (yNote.get('nodeId') as string) || '',
    content: (yNote.get('content') as string) || '',
    contentJson,
    contentType: (yNote.get('contentType') as NodeNote['contentType']) || 'tiptap',
    plainText: yNote.get('plainText') as string | undefined,
    tags: (yNote.get('tags') as string[]) || [],
    isPinned: (yNote.get('isPinned') as boolean) || false,
    createdAt: new Date((yNote.get('createdAt') as string) || Date.now()),
    updatedAt: new Date((yNote.get('updatedAt') as string) || Date.now()),
  };
}

function writeNoteToYMap(yNote: Y.Map<unknown>, note: NodeNote) {
  yNote.set('id', note.id);
  yNote.set('nodeId', note.nodeId);
  yNote.set('content', note.content);
  yNote.set('contentJson', note.contentJson ? JSON.stringify(note.contentJson) : '');
  yNote.set('contentType', note.contentType);
  yNote.set('plainText', note.plainText || '');
  yNote.set('tags', note.tags || []);
  yNote.set('isPinned', note.isPinned);
  yNote.set('createdAt', note.createdAt instanceof Date ? note.createdAt.toISOString() : String(note.createdAt));
  yNote.set('updatedAt', note.updatedAt instanceof Date ? note.updatedAt.toISOString() : String(note.updatedAt));
}

export function useCollabNotes(mapId: string): UseMapNotesReturn {
  const yDoc = useCollabDoc();
  const localNotes = useMapNotes(mapId);
  const [collabNotes, setCollabNotes] = useState<Map<string, NodeNote>>(new Map());
  const [initialized, setInitialized] = useState(false);
  const isCollaborating = yDoc !== null;
  const localSaveRef = useRef(localNotes.saveNote);
  const localDeleteRef = useRef(localNotes.deleteNote);
  const seededRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { localSaveRef.current = localNotes.saveNote; }, [localNotes.saveNote]);
  useEffect(() => { localDeleteRef.current = localNotes.deleteNote; }, [localNotes.deleteNote]);

  // Initialize from Yjs doc and observe changes
  useEffect(() => {
    if (!yDoc) {
      setInitialized(false);
      seededRef.current = false;
      return;
    }

    const yNotes = yDoc.getMap('notes');

    // Load initial state from Yjs doc
    const initial = new Map<string, NodeNote>();
    yNotes.forEach((yNote, nodeId) => {
      if (yNote instanceof Y.Map) {
        initial.set(nodeId, yMapToNote(yNote));
      }
    });
    setCollabNotes(initial);
    setInitialized(true);

    // Cache initial notes to IndexedDB in background
    initial.forEach((note) => {
      localSaveRef.current(note).catch(() => {});
    });

    // Observe remote changes only — local saves already update collabNotes directly.
    // Firing on local changes causes double-renders that disrupt the TipTap editor.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const observer = (events: Y.YEvent<any>[], transaction: Y.Transaction) => {
      if (transaction.local) return;

      // Re-read the full notes map to stay in sync with Y.Doc
      const updated = new Map<string, NodeNote>();
      yNotes.forEach((yNote, nodeId) => {
        if (yNote instanceof Y.Map) {
          updated.set(nodeId, yMapToNote(yNote));
        }
      });
      setCollabNotes(updated);

      // Cache remote changes to IndexedDB
      for (const event of events) {
        if (event.target === yNotes && event instanceof Y.YMapEvent) {
          event.changes.keys.forEach((change, nodeId) => {
            if (change.action === 'add' || change.action === 'update') {
              const yNote = yNotes.get(nodeId);
              if (yNote instanceof Y.Map) {
                localSaveRef.current(yMapToNote(yNote)).catch(() => {});
              }
            } else if (change.action === 'delete') {
              localDeleteRef.current(nodeId).catch(() => {});
            }
          });
        }
      }
    };

    yNotes.observeDeep(observer);

    return () => {
      yNotes.unobserveDeep(observer);
    };
  }, [yDoc]);

  // Seed local IndexedDB notes into Yjs doc when they finish loading.
  // This ensures notes added after the last cloud save are broadcast to peers.
  useEffect(() => {
    if (!yDoc || localNotes.loading || seededRef.current) return;
    seededRef.current = true;

    const yNotes = yDoc.getMap('notes');
    const localMap = localNotes.notes;
    if (localMap.size === 0) return;

    let hasNewNotes = false;
    yDoc.transact(() => {
      localMap.forEach((note, nodeId) => {
        if (!yNotes.has(nodeId)) {
          const yNote = new Y.Map();
          writeNoteToYMap(yNote, note);
          yNotes.set(nodeId, yNote);
          hasNewNotes = true;
        }
      });
    });

    // If we seeded notes, update collabNotes to include them
    if (hasNewNotes) {
      setCollabNotes((prev) => {
        const next = new Map(prev);
        localMap.forEach((note, nodeId) => {
          if (!next.has(nodeId)) {
            next.set(nodeId, note);
          }
        });
        return next;
      });
    }
  }, [yDoc, localNotes.loading, localNotes.notes]);

  const saveNote = useCallback(
    async (note: NodeNote) => {
      if (!yDoc) {
        return localNotes.saveNote(note);
      }

      const yNotes = yDoc.getMap('notes');
      yDoc.transact(() => {
        let yNote = yNotes.get(note.nodeId);
        if (!yNote || !(yNote instanceof Y.Map)) {
          yNote = new Y.Map();
          yNotes.set(note.nodeId, yNote);
        }
        writeNoteToYMap(yNote as Y.Map<unknown>, note);
      });

      // Update local state immediately
      setCollabNotes((prev) => {
        const next = new Map(prev);
        next.set(note.nodeId, note);
        return next;
      });

      // Background: persist to IndexedDB
      localNotes.saveNote(note).catch((err) =>
        console.error('Failed to cache note to IndexedDB:', err)
      );
    },
    [yDoc, localNotes]
  );

  const deleteNote = useCallback(
    async (nodeId: string) => {
      if (!yDoc) {
        return localNotes.deleteNote(nodeId);
      }

      const yNotes = yDoc.getMap('notes');
      yDoc.transact(() => {
        yNotes.delete(nodeId);
      });

      setCollabNotes((prev) => {
        const next = new Map(prev);
        next.delete(nodeId);
        return next;
      });

      localNotes.deleteNote(nodeId).catch((err) =>
        console.error('Failed to delete note from IndexedDB:', err)
      );
    },
    [yDoc, localNotes]
  );

  const getNote = useCallback(
    (nodeId: string): NodeNote | undefined => {
      if (!isCollaborating) {
        return localNotes.getNote(nodeId);
      }
      // Fall back to local notes while Yjs sync is in progress
      return collabNotes.get(nodeId) || localNotes.getNote(nodeId);
    },
    [isCollaborating, localNotes, collabNotes]
  );

  if (!isCollaborating) {
    return localNotes;
  }

  return {
    notes: collabNotes,
    loading: !initialized,
    error: null,
    saveNote,
    deleteNote,
    getNote,
    clearAllNotes: localNotes.clearAllNotes,
  };
}
