import React, { createContext, useContext, useMemo } from 'react';
import * as Y from 'yjs';
import { MindMapProvider, useMindMap, MindMapContext } from './MindMapContext';
import { useCollaboration } from '../hooks/useCollaboration';
import type { Node, Point } from '../types/mindMap';

interface CollabMindMapProviderProps {
  children: React.ReactNode;
  mapId: string;
  collabEnabled: boolean;
  collabConnected: boolean;
}

const CollabDocContext = createContext<Y.Doc | null>(null);
export const useCollabDoc = () => useContext(CollabDocContext);

const CollabBridge: React.FC<{ mapId: string; collabEnabled: boolean; collabConnected: boolean; children: React.ReactNode }> = ({
  mapId,
  collabEnabled,
  collabConnected,
  children,
}) => {
  const ctx = useMindMap();
  const { collabDispatch, doc } = useCollaboration({
    mapId,
    dispatch: ctx.dispatch,
    enabled: collabEnabled,
    connected: collabConnected,
  });

  // Re-provide MindMapContext with collabDispatch replacing dispatch.
  // All consumers of useMindMap() will automatically route through Yjs.
  const overridden = useMemo(() => {
    const d = collabEnabled ? collabDispatch : ctx.dispatch;
    return {
      state: ctx.state,
      dispatch: d,
      addNode: (parentId: string | null, position: Point, text?: string) => {
        d({ type: 'ADD_NODE', payload: { parentId, position, text } });
      },
      updateNode: (id: string, updates: Partial<Node>) => {
        d({ type: 'UPDATE_NODE', payload: { id, updates } });
      },
      deleteNode: (id: string) => {
        d({ type: 'DELETE_NODE', payload: { id } });
      },
      selectNode: ctx.selectNode,
      startEditing: ctx.startEditing,
      stopEditing: ctx.stopEditing,
      markClean: ctx.markClean,
      markDirty: ctx.markDirty,
    };
  }, [ctx, collabDispatch, collabEnabled]);

  return (
    <CollabDocContext.Provider value={collabEnabled ? doc : null}>
      <MindMapContext.Provider value={overridden}>
        {children}
      </MindMapContext.Provider>
    </CollabDocContext.Provider>
  );
};

export const CollabMindMapProvider: React.FC<CollabMindMapProviderProps> = ({
  children,
  mapId,
  collabEnabled,
  collabConnected,
}) => {
  return (
    <MindMapProvider>
      <CollabBridge mapId={mapId} collabEnabled={collabEnabled} collabConnected={collabConnected}>
        {children}
      </CollabBridge>
    </MindMapProvider>
  );
};
