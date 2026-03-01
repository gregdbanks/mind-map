import { useState, useEffect, useRef, useCallback, type Dispatch } from 'react';
import * as Y from 'yjs';
import { SocketIOYjsProvider } from '../services/yjsProvider';
import type { MindMapAction } from '../context/mindMapReducer';
import type { Node, Link, Point } from '../types/mindMap';

interface UseCollaborationOptions {
  mapId: string;
  dispatch: Dispatch<MindMapAction>;
  enabled: boolean;
  connected: boolean;
}

export function useCollaboration({ mapId, dispatch, enabled, connected }: UseCollaborationOptions) {
  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<SocketIOYjsProvider | null>(null);
  const isRemoteChangeRef = useRef(false);
  const initialSyncDoneRef = useRef(false);

  // Initialize Yjs doc and provider when socket is connected
  useEffect(() => {
    if (!enabled || !connected) return;

    initialSyncDoneRef.current = false;

    const doc = new Y.Doc();
    docRef.current = doc;
    setDoc(doc);

    const provider = new SocketIOYjsProvider(doc);
    providerRef.current = provider;

    const yNodes = doc.getMap('nodes');
    const yLinks = doc.getArray('links');

    // Observe deep changes on nodes map
    yNodes.observeDeep((events) => {
      // Skip if this change originated from our local dispatch
      if (!isRemoteChangeRef.current) return;

      // On initial sync, replace the entire state (clears the default root-node).
      // After that, apply incremental ADD/DELETE/UPDATE for live edits.
      if (!initialSyncDoneRef.current) {
        initialSyncDoneRef.current = true;
        const nodes: Node[] = [];
        yNodes.forEach((val) => {
          if (val instanceof Y.Map) {
            nodes.push(yMapToNode(val));
          }
        });
        const links: Link[] = [];
        for (let i = 0; i < yLinks.length; i++) {
          const link = yLinks.get(i) as Record<string, unknown>;
          if (link && typeof link === 'object' && 'source' in link && 'target' in link) {
            links.push({ source: link.source as string, target: link.target as string });
          }
        }
        dispatch({ type: 'LOAD_MINDMAP', payload: { nodes, links } });
        return;
      }

      for (const event of events) {
        if (event.target === yNodes && event instanceof Y.YMapEvent) {
          // Top-level node additions/deletions
          event.changes.keys.forEach((change, key) => {
            if (change.action === 'add') {
              const yNode = yNodes.get(key);
              if (yNode instanceof Y.Map) {
                const node = yMapToNode(yNode);
                // ADD_NODE creates the node structure and parent link
                dispatch({
                  type: 'ADD_NODE',
                  payload: {
                    id: node.id,
                    parentId: node.parent,
                    position: { x: node.x || 0, y: node.y || 0 },
                    text: node.text,
                  },
                });
                // UPDATE_NODE applies all Yjs properties that ADD_NODE doesn't
                // carry (color, textColor, size, hasNote, noteExpanded, etc.).
                // Without this, initial sync strips node styling and notes.
                dispatch({
                  type: 'UPDATE_NODE',
                  payload: { id: node.id, updates: node },
                });
              }
            } else if (change.action === 'delete') {
              dispatch({ type: 'DELETE_NODE', payload: { id: key } });
            }
          });
        } else if (event.target instanceof Y.Map && event.target !== yNodes) {
          // Property updates within a node's Y.Map
          const yNode = event.target as Y.Map<unknown>;
          const nodeId = yNode.get('id') as string;
          if (!nodeId) return;

          const updates: Partial<Node> = {};
          if (event instanceof Y.YMapEvent) {
            event.changes.keys.forEach((_change, key) => {
              if (_change.action === 'add' || _change.action === 'update') {
                (updates as Record<string, unknown>)[key] = yNode.get(key);
              }
            });
          }

          if (Object.keys(updates).length > 0) {
            dispatch({ type: 'UPDATE_NODE', payload: { id: nodeId, updates } });
          }
        }
      }
    });

    // Observe link changes — only update links, not the entire node map
    yLinks.observe(() => {
      if (!isRemoteChangeRef.current) return;

      const links: Link[] = [];
      for (let i = 0; i < yLinks.length; i++) {
        const link = yLinks.get(i) as Record<string, unknown>;
        if (link && typeof link === 'object' && 'source' in link && 'target' in link) {
          links.push({ source: link.source as string, target: link.target as string });
        }
      }
      dispatch({ type: 'SET_LINKS', payload: { links } });
    });

    // Set the remote change flag for incoming updates
    doc.on('beforeTransaction', (tr: Y.Transaction) => {
      if (tr.origin === 'remote') {
        isRemoteChangeRef.current = true;
      }
    });
    doc.on('afterTransaction', (tr: Y.Transaction) => {
      if (tr.origin === 'remote') {
        isRemoteChangeRef.current = false;
      }
    });

    provider.connect();

    return () => {
      provider.destroy();
      doc.destroy();
      docRef.current = null;
      providerRef.current = null;
      setDoc(null);
    };
  }, [mapId, enabled, connected, dispatch]);

  // Wrap dispatch to apply changes to Yjs doc
  const collabDispatch = useCallback(
    (action: MindMapAction) => {
      const doc = docRef.current;
      if (!doc || !enabled) {
        dispatch(action);
        return;
      }

      const yNodes = doc.getMap('nodes');
      const yLinks = doc.getArray('links');

      switch (action.type) {
        case 'ADD_NODE': {
          const { parentId, position, text = 'New Node', id } = action.payload;
          const nodeId = id || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          doc.transact(() => {
            const yNode = new Y.Map();
            yNode.set('id', nodeId);
            yNode.set('text', text);
            yNode.set('x', position.x);
            yNode.set('y', position.y);
            yNode.set('collapsed', false);
            yNode.set('parent', parentId);
            yNodes.set(nodeId, yNode);

            if (parentId) {
              yLinks.push([{ source: parentId, target: nodeId }]);
            }
          });

          // Also dispatch locally
          dispatch({ ...action, payload: { ...action.payload, id: nodeId } });
          break;
        }

        case 'UPDATE_NODE': {
          const { id: nodeId, updates } = action.payload;
          const yNode = yNodes.get(nodeId);
          if (yNode instanceof Y.Map) {
            doc.transact(() => {
              for (const [key, value] of Object.entries(updates)) {
                if (value === undefined) continue;
                yNode.set(key, value);
              }
            });
          }
          dispatch(action);
          break;
        }

        case 'DELETE_NODE': {
          const { id: nodeId } = action.payload;
          // Find all descendant nodes to delete
          const toDelete = new Set<string>([nodeId]);
          const findDescendants = (parentId: string) => {
            yNodes.forEach((yNode, id) => {
              if (yNode instanceof Y.Map && yNode.get('parent') === parentId) {
                toDelete.add(id);
                findDescendants(id);
              }
            });
          };
          findDescendants(nodeId);

          doc.transact(() => {
            toDelete.forEach((id) => yNodes.delete(id));

            // Remove links involving deleted nodes
            const indicesToDelete: number[] = [];
            for (let i = 0; i < yLinks.length; i++) {
              const link = yLinks.get(i) as Record<string, unknown>;
              if (link && (toDelete.has(link.source as string) || toDelete.has(link.target as string))) {
                indicesToDelete.push(i);
              }
            }
            // Delete in reverse order to preserve indices
            for (let i = indicesToDelete.length - 1; i >= 0; i--) {
              yLinks.delete(indicesToDelete[i], 1);
            }
          });

          dispatch(action);
          break;
        }

        case 'UPDATE_POSITIONS': {
          const { positions } = action.payload;
          doc.transact(() => {
            positions.forEach((position: Point, nodeId: string) => {
              const yNode = yNodes.get(nodeId);
              if (yNode instanceof Y.Map) {
                yNode.set('x', position.x);
                yNode.set('y', position.y);
              }
            });
          });
          dispatch(action);
          break;
        }

        default:
          // For SELECT_NODE, START_EDITING, STOP_EDITING, LOAD_MINDMAP, etc.
          // These are local-only actions, don't broadcast
          dispatch(action);
          break;
      }
    },
    [dispatch, enabled]
  );

  return {
    collabDispatch: enabled ? collabDispatch : dispatch,
    doc,
  };
}

function yMapToNode(yNode: Y.Map<unknown>): Node {
  return {
    id: (yNode.get('id') as string) || '',
    text: (yNode.get('text') as string) || '',
    x: yNode.get('x') as number | undefined,
    y: yNode.get('y') as number | undefined,
    vx: yNode.get('vx') as number | undefined,
    vy: yNode.get('vy') as number | undefined,
    fx: yNode.get('fx') as number | null | undefined,
    fy: yNode.get('fy') as number | null | undefined,
    collapsed: (yNode.get('collapsed') as boolean) || false,
    parent: (yNode.get('parent') as string | null) || null,
    color: yNode.get('color') as string | undefined,
    textColor: yNode.get('textColor') as string | undefined,
    noteId: yNode.get('noteId') as string | undefined,
    hasNote: yNode.get('hasNote') as boolean | undefined,
    noteExpanded: yNode.get('noteExpanded') as boolean | undefined,
    noteWidth: yNode.get('noteWidth') as number | undefined,
    noteHeight: yNode.get('noteHeight') as number | undefined,
    size: yNode.get('size') as Node['size'],
  };
}
