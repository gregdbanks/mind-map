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
}