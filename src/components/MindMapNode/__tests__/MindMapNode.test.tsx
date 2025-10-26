import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MindMapNode } from '../MindMapNode';
import { Node } from '../../../types/mindMap';

describe('MindMapNode', () => {
  const defaultNode: Node = {
    id: 'node-1',
    text: 'Test Node',
    x: 100,
    y: 200,
    collapsed: false,
    parent: null,
  };

  const defaultProps = {
    node: defaultNode,
    isSelected: false,
    isEditing: false,
    onSelect: jest.fn(),
    onStartEdit: jest.fn(),
    onTextChange: jest.fn(),
    onToggleCollapse: jest.fn(),
    onDelete: jest.fn(),
    hasChildren: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render node with text', () => {
    render(
      <svg>
        <MindMapNode {...defaultProps} />
      </svg>
    );

    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  it('should position node at correct coordinates', () => {
    const { container } = render(
      <svg>
        <MindMapNode {...defaultProps} />
      </svg>
    );

    const nodeGroup = container.querySelector('g[transform]');
    expect(nodeGroup).toHaveAttribute('transform', 'translate(100, 200)');
  });

  it('should call onSelect when clicked', () => {
    render(
      <svg>
        <MindMapNode {...defaultProps} />
      </svg>
    );

    const node = screen.getByRole('button', { name: /Test Node/i });
    fireEvent.click(node);

    expect(defaultProps.onSelect).toHaveBeenCalledWith('node-1');
  });

  it('should call onStartEdit when double-clicked', () => {
    render(
      <svg>
        <MindMapNode {...defaultProps} />
      </svg>
    );

    const node = screen.getByRole('button', { name: /Test Node/i });
    fireEvent.doubleClick(node);

    expect(defaultProps.onStartEdit).toHaveBeenCalledWith('node-1');
  });

  it('should show selected state', () => {
    const { container } = render(
      <svg>
        <MindMapNode {...defaultProps} isSelected={true} />
      </svg>
    );

    const circle = container.querySelector('circle');
    expect(circle).toHaveClass('selected');
  });

  it('should show editing state with input', async () => {
    render(
      <svg>
        <MindMapNode {...defaultProps} isEditing={true} />
      </svg>
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('Test Node');
    expect(input).toHaveFocus();
  });

  it('should update text on Enter key', async () => {
    const user = userEvent.setup();
    render(
      <svg>
        <MindMapNode {...defaultProps} isEditing={true} />
      </svg>
    );

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'Updated Text');
    await user.keyboard('{Enter}');

    expect(defaultProps.onTextChange).toHaveBeenCalledWith('node-1', 'Updated Text');
  });

  it('should cancel edit on Escape key', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <svg>
        <MindMapNode {...defaultProps} isEditing={true} />
      </svg>
    );

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'Changed Text');
    await user.keyboard('{Escape}');

    // Should not call onTextChange
    expect(defaultProps.onTextChange).not.toHaveBeenCalled();

    // When re-rendered without editing, should show original text
    rerender(
      <svg>
        <MindMapNode {...defaultProps} isEditing={false} />
      </svg>
    );
    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  it('should show collapse button when node has children', () => {
    render(
      <svg>
        <MindMapNode {...defaultProps} hasChildren={true} />
      </svg>
    );

    const collapseButton = screen.getByRole('button', { name: /collapse/i });
    expect(collapseButton).toBeInTheDocument();
  });

  it('should toggle collapse state when button clicked', () => {
    render(
      <svg>
        <MindMapNode {...defaultProps} hasChildren={true} />
      </svg>
    );

    const collapseButton = screen.getByRole('button', { name: /collapse/i });
    fireEvent.click(collapseButton);

    expect(defaultProps.onToggleCollapse).toHaveBeenCalledWith('node-1');
  });

  it('should show different icon when collapsed', () => {
    render(
      <svg>
        <MindMapNode {...defaultProps} node={{ ...defaultNode, collapsed: true }} hasChildren={true} />
      </svg>
    );

    // Check for plus icon when collapsed (you can adjust this based on your icon implementation)
    const collapseButton = screen.getByRole('button', { name: /expand/i });
    expect(collapseButton).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <svg>
        <MindMapNode {...defaultProps} />
      </svg>
    );

    const node = screen.getByRole('button', { name: /Test Node/i });
    expect(node).toHaveAttribute('tabindex', '0');
    expect(node).toHaveAttribute('aria-label', 'Test Node');
  });

  it('should prevent event bubbling on collapse button click', () => {
    render(
      <svg>
        <MindMapNode {...defaultProps} hasChildren={true} />
      </svg>
    );

    const collapseButton = screen.getByRole('button', { name: /collapse/i });
    fireEvent.click(collapseButton);

    // onSelect should not be called when clicking collapse button
    expect(defaultProps.onSelect).not.toHaveBeenCalled();
    expect(defaultProps.onToggleCollapse).toHaveBeenCalled();
  });

  it('should handle blur event when editing', async () => {
    const user = userEvent.setup();
    render(
      <svg>
        <MindMapNode {...defaultProps} isEditing={true} />
      </svg>
    );

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'New Text');
    
    // Blur the input
    fireEvent.blur(input);

    expect(defaultProps.onTextChange).toHaveBeenCalledWith('node-1', 'New Text');
  });

  it('should not save empty text', async () => {
    const user = userEvent.setup();
    render(
      <svg>
        <MindMapNode {...defaultProps} isEditing={true} />
      </svg>
    );

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.keyboard('{Enter}');

    // Should not save empty text
    expect(defaultProps.onTextChange).not.toHaveBeenCalled();
  });
});