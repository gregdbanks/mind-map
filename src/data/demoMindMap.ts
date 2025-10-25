import type { Node, Link } from '../types/mindMap';

export const demoNodes: Node[] = [
  // Level 0 - Root
  { id: 'root', text: 'My Project', x: 700, y: 400, parent: null, collapsed: false },
  
  // Level 1 - Main branches (spread out more)
  { id: 'n1', text: 'Planning', x: 400, y: 150, parent: 'root', collapsed: false },
  { id: 'n2', text: 'Development', x: 1000, y: 150, parent: 'root', collapsed: false },
  { id: 'n3', text: 'Testing', x: 400, y: 650, parent: 'root', collapsed: false },
  { id: 'n4', text: 'Deployment', x: 1000, y: 650, parent: 'root', collapsed: false },
  
  // Level 2 - Planning children (more vertical space)
  { id: 'n1-1', text: 'Requirements', x: 200, y: 50, parent: 'n1', collapsed: false },
  { id: 'n1-2', text: 'Timeline', x: 200, y: 150, parent: 'n1', collapsed: false },
  { id: 'n1-3', text: 'Resources', x: 200, y: 250, parent: 'n1', collapsed: false },
  
  // Level 2 - Development children (more vertical space)
  { id: 'n2-1', text: 'Frontend', x: 1200, y: 50, parent: 'n2', collapsed: false },
  { id: 'n2-2', text: 'Backend', x: 1200, y: 150, parent: 'n2', collapsed: false },
  { id: 'n2-3', text: 'Database', x: 1200, y: 250, parent: 'n2', collapsed: false },
  
  // Level 3 - Frontend children
  { id: 'n2-1-1', text: 'React Components', x: 1400, y: 0, parent: 'n2-1', collapsed: false },
  { id: 'n2-1-2', text: 'State Management', x: 1400, y: 100, parent: 'n2-1', collapsed: false },
  
  // Level 3 - Backend children  
  { id: 'n2-2-1', text: 'API Routes', x: 1400, y: 150, parent: 'n2-2', collapsed: false },
  { id: 'n2-2-2', text: 'Authentication', x: 1400, y: 250, parent: 'n2-2', collapsed: false },
  
  // Level 2 - Testing children
  { id: 'n3-1', text: 'Unit Tests', x: 200, y: 550, parent: 'n3', collapsed: false },
  { id: 'n3-2', text: 'Integration', x: 200, y: 650, parent: 'n3', collapsed: false },
  { id: 'n3-3', text: 'E2E Tests', x: 200, y: 750, parent: 'n3', collapsed: false },
  
  // Level 3 - Unit Tests children
  { id: 'n3-1-1', text: 'Component Tests', x: 50, y: 500, parent: 'n3-1', collapsed: false },
  { id: 'n3-1-2', text: 'Service Tests', x: 50, y: 600, parent: 'n3-1', collapsed: false },
  
  // Level 4 - Component Tests children (5th level)
  { id: 'n3-1-1-1', text: 'Props Testing', x: -150, y: 450, parent: 'n3-1-1', collapsed: false },
  { id: 'n3-1-1-2', text: 'Event Testing', x: -150, y: 550, parent: 'n3-1-1', collapsed: false },
];

export const demoLinks: Link[] = [
  // Root connections
  { source: 'root', target: 'n1' },
  { source: 'root', target: 'n2' },
  { source: 'root', target: 'n3' },
  { source: 'root', target: 'n4' },
  
  // Planning connections
  { source: 'n1', target: 'n1-1' },
  { source: 'n1', target: 'n1-2' },
  { source: 'n1', target: 'n1-3' },
  
  // Development connections
  { source: 'n2', target: 'n2-1' },
  { source: 'n2', target: 'n2-2' },
  { source: 'n2', target: 'n2-3' },
  
  // Frontend connections
  { source: 'n2-1', target: 'n2-1-1' },
  { source: 'n2-1', target: 'n2-1-2' },
  
  // Backend connections
  { source: 'n2-2', target: 'n2-2-1' },
  { source: 'n2-2', target: 'n2-2-2' },
  
  // Testing connections
  { source: 'n3', target: 'n3-1' },
  { source: 'n3', target: 'n3-2' },
  { source: 'n3', target: 'n3-3' },
  
  // Unit Tests connections
  { source: 'n3-1', target: 'n3-1-1' },
  { source: 'n3-1', target: 'n3-1-2' },
  
  // Component Tests connections (5th level)
  { source: 'n3-1-1', target: 'n3-1-1-1' },
  { source: 'n3-1-1', target: 'n3-1-1-2' },
];