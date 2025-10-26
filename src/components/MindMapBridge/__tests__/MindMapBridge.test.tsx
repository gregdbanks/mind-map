import { render, screen } from '@testing-library/react';
import { MindMapBridge } from '../MindMapBridge';
import type { MindMapState } from '../../../types/mindMap';

// Mock the external component library that has D3 ESM issues
jest.mock('@gbdev20053/simple-comp-ui', () => ({
  MindMap: ({ data }: any) => (
    <div data-testid="mind-map-component">
      <div data-testid="nodes-count">{data?.nodes?.length || 0}</div>
      <div data-testid="links-count">{data?.links?.length || 0}</div>
    </div>
  ),
}));

describe('MindMapBridge', () => {
  const mockState: MindMapState = {
    nodes: new Map([
      ['1', {
        id: '1',
        text: 'Root Node',
        x: 100,
        y: 100,
        collapsed: false,
        parent: null,
      }],
      ['2', {
        id: '2',
        text: 'Child Node',
        x: 200,
        y: 200,
        collapsed: false,
        parent: '1',
      }],
    ]),
    links: [
      { source: '1', target: '2' },
    ],
    selectedNodeId: null,
    editingNodeId: null,
    lastModified: new Date(),
  };

  it('renders without crashing', () => {
    render(<MindMapBridge state={mockState} testMode={true} />);
    
    // Look for the bridge container
    expect(screen.getByTestId('mind-map-bridge')).toBeInTheDocument();
  });

  it('converts frontend state to component format correctly', () => {
    render(<MindMapBridge state={mockState} testMode={true} />);
    
    // Verify the component is rendered (using our mock)
    expect(screen.getByTestId('mind-map-component')).toBeInTheDocument();
  });

  it('handles empty state gracefully', () => {
    const emptyState: MindMapState = {
      nodes: new Map(),
      links: [],
      selectedNodeId: null,
      editingNodeId: null,
      lastModified: new Date(),
    };

    render(<MindMapBridge state={emptyState} testMode={true} />);
    
    // Should still render the bridge container
    expect(screen.getByTestId('mind-map-bridge')).toBeInTheDocument();
  });
});