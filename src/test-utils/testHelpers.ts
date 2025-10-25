import { MindMapState } from '../types/mindMap';

export const createEmptyState = (): MindMapState => ({
  nodes: new Map(),
  links: [],
  selectedNodeId: null,
  editingNodeId: null,
  lastModified: new Date(),
});

export const mockForceSimulation = {
  dragStart: jest.fn(),
  drag: jest.fn(),
  dragEnd: jest.fn(),
  restart: jest.fn(),
  stop: jest.fn(),
  getPositions: jest.fn().mockReturnValue(new Map()),
};