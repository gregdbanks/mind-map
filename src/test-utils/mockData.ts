export const createMockNode = (overrides?: Partial<Node>) => ({
  id: 'node-1',
  text: 'Test Node',
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  collapsed: false,
  parent: null,
  ...overrides,
});

export const createMockLink = (source: string, target: string) => ({
  source,
  target,
});

export const createMockMindMap = () => ({
  nodes: [
    createMockNode({ id: 'root', text: 'Root Node' }),
    createMockNode({ id: 'child-1', text: 'Child 1', parent: 'root' }),
    createMockNode({ id: 'child-2', text: 'Child 2', parent: 'root' }),
  ],
  links: [
    createMockLink('root', 'child-1'),
    createMockLink('root', 'child-2'),
  ],
  lastModified: new Date(),
});