import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { MindMapState, Point, Node } from '../types/mindMap';
import { mindMapReducer, initialState } from './mindMapReducer';
import type { MindMapAction } from './mindMapReducer';

interface MindMapContextType {
  state: MindMapState;
  dispatch: React.Dispatch<MindMapAction>;
  
  // Helper methods
  addNode: (parentId: string | null, position: Point, text?: string) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  deleteNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  startEditing: (id: string) => void;
  stopEditing: () => void;
}

const MindMapContext = createContext<MindMapContextType | undefined>(undefined);

interface MindMapProviderProps {
  children: ReactNode;
}

export const MindMapProvider: React.FC<MindMapProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(mindMapReducer, initialState);
  
  // Helper methods for cleaner component code
  const addNode = (parentId: string | null, position: Point, text?: string) => {
    dispatch({ type: 'ADD_NODE', payload: { parentId, position, text } });
  };
  
  const updateNode = (id: string, updates: Partial<Node>) => {
    dispatch({ type: 'UPDATE_NODE', payload: { id, updates } });
  };
  
  const deleteNode = (id: string) => {
    dispatch({ type: 'DELETE_NODE', payload: { id } });
  };
  
  const selectNode = (id: string | null) => {
    dispatch({ type: 'SELECT_NODE', payload: { id } });
  };
  
  const startEditing = (id: string) => {
    dispatch({ type: 'START_EDITING', payload: { id } });
  };
  
  const stopEditing = () => {
    dispatch({ type: 'STOP_EDITING' });
  };
  
  const value: MindMapContextType = {
    state,
    dispatch,
    addNode,
    updateNode,
    deleteNode,
    selectNode,
    startEditing,
    stopEditing,
  };
  
  return (
    <MindMapContext.Provider value={value}>
      {children}
    </MindMapContext.Provider>
  );
};

export const useMindMap = (): MindMapContextType => {
  const context = useContext(MindMapContext);
  if (!context) {
    throw new Error('useMindMap must be used within a MindMapProvider');
  }
  return context;
};