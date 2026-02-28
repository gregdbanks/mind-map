import React, { createContext, useContext } from 'react';
import { MindMapProvider, useMindMap } from './MindMapContext';
import { useCollaboration } from '../hooks/useCollaboration';
import type { MindMapAction } from './mindMapReducer';

interface CollabContextType {
  collabDispatch: React.Dispatch<MindMapAction>;
  isCollabActive: boolean;
}

const CollabContext = createContext<CollabContextType | null>(null);

interface CollabMindMapProviderProps {
  children: React.ReactNode;
  mapId: string;
  collabEnabled: boolean;
}

const CollabBridge: React.FC<{ mapId: string; collabEnabled: boolean; children: React.ReactNode }> = ({
  mapId,
  collabEnabled,
  children,
}) => {
  const { dispatch } = useMindMap();
  const { collabDispatch } = useCollaboration({
    mapId,
    dispatch,
    enabled: collabEnabled,
  });

  return (
    <CollabContext.Provider value={{ collabDispatch, isCollabActive: collabEnabled }}>
      {children}
    </CollabContext.Provider>
  );
};

export const CollabMindMapProvider: React.FC<CollabMindMapProviderProps> = ({
  children,
  mapId,
  collabEnabled,
}) => {
  return (
    <MindMapProvider>
      <CollabBridge mapId={mapId} collabEnabled={collabEnabled}>
        {children}
      </CollabBridge>
    </MindMapProvider>
  );
};

export function useCollabDispatch(): React.Dispatch<MindMapAction> {
  const context = useContext(CollabContext);
  if (context) {
    return context.collabDispatch;
  }
  // Fallback: not in collab context, return standard dispatch
  const { dispatch } = useMindMap();
  return dispatch;
}

export function useIsCollabActive(): boolean {
  const context = useContext(CollabContext);
  return context?.isCollabActive ?? false;
}
