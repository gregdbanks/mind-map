import { useEffect, useRef } from 'react';
import { useMindMap } from '../context/MindMapContext';
import type { MindMap, Node } from '../types/mindMap';
import { demoNodes, demoLinks } from '../data/demoMindMap';

const AUTOSAVE_DELAY = 500;
const LOCALSTORAGE_KEY = 'mindmap-data';

export function useSimplePersistence() {
  const { state, dispatch } = useMindMap();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedRef = useRef(false);
  
  // Load data on mount
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    
    try {
      const saved = localStorage.getItem(LOCALSTORAGE_KEY);
      if (saved) {
        const data: MindMap = JSON.parse(saved);
        if (data.nodes && data.nodes.length > 0) {
          dispatch({
            type: 'LOAD_MINDMAP',
            payload: { nodes: data.nodes, links: data.links }
          });
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
    }
    
    // No saved data, load demo
    dispatch({
      type: 'LOAD_MINDMAP',
      payload: { nodes: demoNodes, links: demoLinks }
    });
  }, [dispatch]);

  // Auto-save when state changes
  useEffect(() => {
    if (state.nodes.size === 0) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const nodes: Node[] = Array.from(state.nodes.values());
      const mindMapData: MindMap = {
        nodes,
        links: state.links,
        lastModified: new Date()
      };

      try {
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(mindMapData));
      } catch (err) {
        console.error('Failed to save mind map:', err);
      }
    }, AUTOSAVE_DELAY);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state.nodes, state.links]);

  return {
    loading: false,
    error: null
  };
}