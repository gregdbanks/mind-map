import * as d3 from 'd3';
import type { Node, Link } from '../types/mindMap';
import type { LayoutType } from '../components/LayoutSelector';
import { createImprovedClusterLayout } from './improvedClusterLayout';
import { createHierarchicalLayout } from './hierarchicalLayout';
import { createHybridTreeLayout } from './hybridTreeLayout';
import { createClusteredLayout } from './clusterLayout';
import { createForceDirectedLayout, type ForceNode, type ForceLink } from './forceDirectedLayout';

export interface LayoutManager {
  applyLayout: (
    layoutType: LayoutType,
    nodes: Map<string, Node>,
    links: Link[],
    width: number,
    height: number,
    onUpdate?: (positions: Map<string, { x: number; y: number }>) => void
  ) => d3.Simulation<ForceNode, ForceLink> | null;
  
  getStaticLayout: (
    layoutType: LayoutType,
    nodes: Map<string, Node>,
    width: number,
    height: number
  ) => Map<string, { x: number; y: number }>;
  
  isAnimatedLayout: (layoutType: LayoutType) => boolean;
  
  stopSimulation: (simulation: d3.Simulation<ForceNode, ForceLink>) => void;
}

class LayoutManagerImpl implements LayoutManager {
  applyLayout(
    layoutType: LayoutType,
    nodes: Map<string, Node>,
    links: Link[],
    width: number,
    height: number,
    onUpdate?: (positions: Map<string, { x: number; y: number }>) => void
  ): d3.Simulation<ForceNode, ForceLink> | null {
    
    if (layoutType === 'force-directed') {
      // Only force-directed layout returns a simulation
      return createForceDirectedLayout(nodes, links, width, height, onUpdate);
    }
    
    // All other layouts are static - calculate positions immediately
    const positions = this.getStaticLayout(layoutType, nodes, width, height);
    
    if (onUpdate) {
      // Apply positions immediately for static layouts
      onUpdate(positions);
    }
    
    return null; // No simulation for static layouts
  }
  
  getStaticLayout(
    layoutType: LayoutType,
    nodes: Map<string, Node>,
    width: number,
    height: number
  ): Map<string, { x: number; y: number }> {
    
    switch (layoutType) {
      case 'improved-cluster':
        return createImprovedClusterLayout(nodes, width, height);
        
      case 'hierarchical':
        return createHierarchicalLayout(nodes, width, height);
        
      case 'hybrid-tree':
        return createHybridTreeLayout(nodes, width, height);
        
      case 'cluster':
        return createClusteredLayout(nodes, width, height);
        
      case 'force-directed':
        // Force-directed is animated, but we can return initial random positions
        const positions = new Map<string, { x: number; y: number }>();
        const centerX = width / 2;
        const centerY = height / 2;
        
        Array.from(nodes.values()).forEach(node => {
          positions.set(node.id, {
            x: centerX + (Math.random() - 0.5) * 200,
            y: centerY + (Math.random() - 0.5) * 200
          });
        });
        return positions;
        
      default:
        // Fallback to improved cluster
        return createImprovedClusterLayout(nodes, width, height);
    }
  }
  
  isAnimatedLayout(layoutType: LayoutType): boolean {
    return layoutType === 'force-directed';
  }
  
  stopSimulation(simulation: d3.Simulation<ForceNode, ForceLink>): void {
    simulation.stop();
  }
}

export const layoutManager = new LayoutManagerImpl();

// Layout persistence helpers
const LAYOUT_STORAGE_KEY = 'thoughtnet-preferred-layout';

export function savePreferredLayout(layoutType: LayoutType): void {
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, layoutType);
  } catch (error) {
    console.warn('Could not save layout preference:', error);
  }
}

export function loadPreferredLayout(): LayoutType {
  try {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (saved && isValidLayoutType(saved)) {
      return saved as LayoutType;
    }
  } catch (error) {
    console.warn('Could not load layout preference:', error);
  }
  return 'improved-cluster'; // Default fallback
}

function isValidLayoutType(value: string): boolean {
  const validTypes: LayoutType[] = [
    'improved-cluster',
    'hierarchical', 
    'hybrid-tree',
    'cluster',
    'force-directed'
  ];
  return validTypes.includes(value as LayoutType);
}