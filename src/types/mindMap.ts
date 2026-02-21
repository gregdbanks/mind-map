export interface Point {
  x: number;
  y: number;
}

export interface Node {
  id: string;
  text: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null; // Fixed x position (for dragging)
  fy?: number | null; // Fixed y position (for dragging)
  collapsed: boolean;
  parent: string | null;
  color?: string; // Optional background color (hex, rgb, or CSS color name)
  textColor?: string; // Optional text color (hex, rgb, or CSS color name)
  noteId?: string; // Reference to associated note
  hasNote?: boolean; // Quick flag to check if node has a note
}

export interface Link {
  source: string;
  target: string;
}

export interface MindMap {
  nodes: Node[];
  links: Link[];
  lastModified: Date;
}

export interface MindMapState {
  nodes: Map<string, Node>;
  links: Link[];
  selectedNodeId: string | null;
  editingNodeId: string | null;
  lastModified: Date;
  isDirty: boolean; // Tracks if there are unsaved changes
}

export interface MapMetadata {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
  lastSyncedAt?: string;
  syncStatus?: 'local' | 'synced' | 'cloud-only';
}

export interface StoredMindMap {
  id: string;
  nodes: Node[];
  links: Link[];
  lastModified: string;
}