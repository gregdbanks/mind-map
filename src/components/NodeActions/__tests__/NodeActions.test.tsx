import { render, fireEvent } from '@testing-library/react';
import { NodeActions } from '../NodeActions';

// Mock window.confirm
const mockConfirm = jest.fn();
window.confirm = mockConfirm;

describe('NodeActions', () => {
  const mockOnAdd = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  
  const defaultProps = {
    nodeId: 'test-node-1',
    onAdd: mockOnAdd,
    onEdit: mockOnEdit,
    onDelete: mockOnDelete,
    x: 100,
    y: 100,
    nodeRadius: 20,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  it('renders all three action buttons', () => {
    const { container } = render(
      <svg>
        <NodeActions {...defaultProps} />
      </svg>
    );
    
    const buttons = container.querySelectorAll('.actionButton');
    expect(buttons).toHaveLength(3);
  });

  it('positions buttons in a circle around the node', () => {
    const { container } = render(
      <svg>
        <NodeActions {...defaultProps} />
      </svg>
    );
    
    const actionGroups = container.querySelectorAll('.nodeActions g');
    
    // Add button should be at top (angle -90)
    const addTransform = actionGroups[0].getAttribute('transform');
    expect(addTransform).toMatch(/translate\([^,]+,\s*-45\)/);
    
    // Edit button should be at right (angle 0)  
    const editTransform = actionGroups[1].getAttribute('transform');
    expect(editTransform).toMatch(/translate\(45,\s*[^)]+\)/);
    
    // Delete button should be at bottom (angle 90)
    const deleteTransform = actionGroups[2].getAttribute('transform');
    expect(deleteTransform).toMatch(/translate\([^,]+,\s*45\)/);
  });

  it('calls onAdd when add button is clicked', () => {
    const { container } = render(
      <svg>
        <NodeActions {...defaultProps} />
      </svg>
    );
    
    const addButton = container.querySelector('.nodeActions g:first-child circle');
    fireEvent.click(addButton!);
    
    expect(mockOnAdd).toHaveBeenCalledWith('test-node-1');
  });

  it('calls onEdit when edit button is clicked', () => {
    const { container } = render(
      <svg>
        <NodeActions {...defaultProps} />
      </svg>
    );
    
    const editButton = container.querySelector('.nodeActions g:nth-child(2) circle');
    fireEvent.click(editButton!);
    
    expect(mockOnEdit).toHaveBeenCalledWith('test-node-1');
  });

  it('shows confirmation dialog before deleting', () => {
    const { container } = render(
      <svg>
        <NodeActions {...defaultProps} />
      </svg>
    );
    
    const deleteButton = container.querySelector('.nodeActions g:nth-child(3) circle');
    fireEvent.click(deleteButton!);
    
    expect(mockConfirm).toHaveBeenCalledWith('Delete this node and all its children?');
    expect(mockOnDelete).toHaveBeenCalledWith('test-node-1');
  });

  it('does not delete when user cancels confirmation', () => {
    mockConfirm.mockReturnValue(false);
    
    const { container } = render(
      <svg>
        <NodeActions {...defaultProps} />
      </svg>
    );
    
    const deleteButton = container.querySelector('.nodeActions g:nth-child(3) circle');
    fireEvent.click(deleteButton!);
    
    expect(mockConfirm).toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('stops event propagation on button clicks', () => {
    const { container } = render(
      <svg>
        <NodeActions {...defaultProps} />
      </svg>
    );
    
    const addButton = container.querySelector('.nodeActions g:first-child circle');
    const event = new MouseEvent('click', { bubbles: true });
    const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');
    
    fireEvent(addButton!, event);
    
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('displays correct icons for each button', () => {
    const { container } = render(
      <svg>
        <NodeActions {...defaultProps} />
      </svg>
    );
    
    const icons = container.querySelectorAll('.actionIcon');
    expect(icons[0]).toHaveTextContent('+');
    expect(icons[1]).toHaveTextContent('✎');
    expect(icons[2]).toHaveTextContent('×');
  });

  it('has correct titles for accessibility', () => {
    const { container } = render(
      <svg>
        <NodeActions {...defaultProps} />
      </svg>
    );
    
    const titles = container.querySelectorAll('title');
    expect(titles[0]).toHaveTextContent('Add child node');
    expect(titles[1]).toHaveTextContent('Edit node');
    expect(titles[2]).toHaveTextContent('Delete node');
  });
});