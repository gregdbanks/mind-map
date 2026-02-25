import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '../SearchBar';
import type { Node } from '../../../types/mindMap';
import type { NodeNote } from '../../../types/notes';

// Helper to create mock nodes
const createNode = (overrides: Partial<Node> & { id: string; text: string }): Node => ({
  collapsed: false,
  parent: null,
  ...overrides,
});

const mockNodes: Node[] = [
  createNode({ id: 'n1', text: 'Project Planning' }),
  createNode({ id: 'n2', text: 'Design System', parent: 'n1' }),
  createNode({ id: 'n3', text: 'Backend API', parent: 'n1' }),
  createNode({ id: 'n4', text: 'User Authentication', parent: 'n3' }),
  createNode({ id: 'n5', text: 'Database Schema', parent: 'n3' }),
  createNode({ id: 'n6', text: 'Testing Strategy', parent: 'n1' }),
  createNode({ id: 'n7', text: 'Deployment Pipeline', parent: 'n1' }),
  createNode({ id: 'n8', text: 'Performance Metrics', parent: 'n1' }),
  createNode({ id: 'n9', text: 'Monitoring Tools', parent: 'n8' }),
  createNode({ id: 'n10', text: 'Alert Configuration', parent: 'n8' }),
  createNode({ id: 'n11', text: 'Budget Planning', parent: 'n1' }),
  createNode({ id: 'n12', text: 'Resource Allocation', parent: 'n11' }),
];

const createNote = (nodeId: string, plainText: string): NodeNote => ({
  id: `note-${nodeId}`,
  nodeId,
  content: `<p>${plainText}</p>`,
  contentType: 'html',
  plainText,
  isPinned: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const mockNotes = new Map<string, NodeNote>([
  ['n5', createNote('n5', 'Use PostgreSQL with normalized tables for user data')],
  ['n7', createNote('n7', 'CI/CD pipeline uses GitHub Actions for automated deploys')],
  ['n10', createNote('n10', 'Set up PagerDuty integration for critical alerts')],
]);

const defaultProps = {
  nodes: mockNodes,
  onNodeSelect: jest.fn(),
  isVisible: true,
  notes: mockNotes,
};

describe('SearchBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search input with placeholder', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search nodes & notes... (Ctrl+F)');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('returns null when isVisible is false', () => {
    const { container } = render(<SearchBar {...defaultProps} isVisible={false} />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByPlaceholderText('Search nodes & notes... (Ctrl+F)')).not.toBeInTheDocument();
  });

  it('shows results in dropdown when typing a term that matches a node title', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search nodes & notes... (Ctrl+F)');
    fireEvent.change(input, { target: { value: 'Design' } });

    // The dropdown should show results containing "Design"
    const items = document.querySelectorAll('[class*="dropdownItem"]');
    expect(items.length).toBeGreaterThanOrEqual(1);

    // The node text "Design System" should appear in the first result
    const nodeText = items[0]?.querySelector('[class*="nodeText"]')?.textContent;
    expect(nodeText).toBe('Design System');
  });

  it('shows result with note snippet when search term matches only note content', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search nodes & notes... (Ctrl+F)');
    // "PostgreSQL" appears only in the note for n5 (Database Schema), not in any title
    fireEvent.change(input, { target: { value: 'PostgreSQL' } });

    // The node title (Database Schema) should appear
    expect(screen.getByText('Database Schema')).toBeInTheDocument();
    // The note snippet should contain the matched text
    expect(screen.getByText(/PostgreSQL/)).toBeInTheDocument();
  });

  it('calls onNodeSelect with the node id when clicking a result', () => {
    const onNodeSelect = jest.fn();
    render(<SearchBar {...defaultProps} onNodeSelect={onNodeSelect} />);

    const input = screen.getByPlaceholderText('Search nodes & notes... (Ctrl+F)');
    fireEvent.change(input, { target: { value: 'Backend' } });

    // Click the dropdown item
    const items = document.querySelectorAll('[class*="dropdownItem"]');
    expect(items.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(items[0]);

    expect(onNodeSelect).toHaveBeenCalledWith('n3');
  });

  it('closes the dropdown when pressing Escape', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search nodes & notes... (Ctrl+F)');
    fireEvent.change(input, { target: { value: 'Design' } });

    // Dropdown should be open
    let items = document.querySelectorAll('[class*="dropdownItem"]');
    expect(items.length).toBeGreaterThanOrEqual(1);

    // Press Escape
    fireEvent.keyDown(input, { key: 'Escape' });

    // Dropdown items should disappear (the dropdown closes)
    items = document.querySelectorAll('[class*="dropdownItem"]');
    expect(items.length).toBe(0);
  });

  it('resets search when clear (X) button is clicked', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search nodes & notes... (Ctrl+F)');
    fireEvent.change(input, { target: { value: 'Design' } });

    // Input should have the value
    expect(input).toHaveValue('Design');

    // Click the clear button
    const clearButton = screen.getByTitle('Clear search');
    fireEvent.click(clearButton);

    // Input should be empty
    expect(input).toHaveValue('');

    // Dropdown should be closed
    const items = document.querySelectorAll('[class*="dropdownItem"]');
    expect(items.length).toBe(0);
  });

  it('shows title matches before note matches in results', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Search nodes & notes... (Ctrl+F)');
    // Search for "user" which matches "User Authentication" title AND n5's note about "user data"
    fireEvent.change(input, { target: { value: 'user' } });

    const allItems = document.querySelectorAll('[class*="dropdownItem"]');
    expect(allItems.length).toBeGreaterThanOrEqual(2);

    // First result should be the title match (User Authentication)
    const firstItemText = allItems[0]?.querySelector('[class*="nodeText"]')?.textContent;
    expect(firstItemText).toBe('User Authentication');

    // Second result should be the note match (Database Schema, which has "user data" in its note)
    const secondItemText = allItems[1]?.querySelector('[class*="nodeText"]')?.textContent;
    expect(secondItemText).toBe('Database Schema');
  });

  it('limits results to a maximum of 10', () => {
    // Create many nodes that all match
    const manyNodes: Node[] = Array.from({ length: 15 }, (_, i) =>
      createNode({ id: `many-${i}`, text: `Item ${i} test node` })
    );

    render(
      <SearchBar
        nodes={manyNodes}
        onNodeSelect={jest.fn()}
        isVisible={true}
      />
    );

    const input = screen.getByPlaceholderText('Search nodes & notes... (Ctrl+F)');
    fireEvent.change(input, { target: { value: 'test' } });

    const results = document.querySelectorAll('[class*="dropdownItem"]');
    expect(results.length).toBeLessThanOrEqual(10);
  });

  it('defaults isVisible to true when not provided', () => {
    render(<SearchBar nodes={mockNodes} onNodeSelect={jest.fn()} />);

    expect(screen.getByPlaceholderText('Search nodes & notes... (Ctrl+F)')).toBeInTheDocument();
  });
});
