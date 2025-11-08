import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotesModal } from '../NotesModal';
import type { NodeNote } from '../../../types';

// Mock the RichTextEditor component
jest.mock('../../RichTextEditor', () => ({
  RichTextEditor: ({ onChange, content, contentType }: any) => {
    // Simulate how the RichTextEditor handles content
    const textValue = contentType === 'tiptap' && typeof content === 'object' 
      ? content?.content?.[0]?.content?.[0]?.text || ''
      : content || '';
      
    return (
      <div data-testid="rich-text-editor">
        <textarea
          data-testid="editor-textarea"
          value={textValue}
          onChange={(e) => onChange({}, e.target.value, e.target.value)}
        />
      </div>
    );
  },
}));

// Mock ReactDOM.createPortal
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: any) => node,
}));

describe('NotesModal', () => {
  const mockOnSave = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnClose = jest.fn();

  const defaultProps = {
    isOpen: true,
    nodeId: 'test-node',
    nodeText: 'Test Node',
    onSave: mockOnSave,
    onClose: mockOnClose,
  };

  const mockExistingNote: NodeNote = {
    id: 'note-1',
    nodeId: 'test-node',
    content: '<p>Existing note content</p>',
    contentJson: { type: 'doc', content: [] },
    contentType: 'tiptap',
    plainText: 'Existing note content',
    tags: [],
    isPinned: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render when open', () => {
      render(<NotesModal {...defaultProps} />);
      
      expect(screen.getByText('Note for "Test Node"')).toBeInTheDocument();
      expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
      expect(screen.getByText('Save Note')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<NotesModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Note for "Test Node"')).not.toBeInTheDocument();
    });

    it('should render with existing note', () => {
      render(
        <NotesModal
          {...defaultProps}
          existingNote={mockExistingNote}
          onDelete={mockOnDelete}
        />
      );
      
      expect(screen.getByText('Delete Note')).toBeInTheDocument();
      expect(screen.getByTestId('editor-textarea')).toHaveValue(mockExistingNote.content);
    });
  });

  describe('User Interactions', () => {
    it('should save note when Save button is clicked', async () => {
      const user = userEvent.setup();
      render(<NotesModal {...defaultProps} />);
      
      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, 'New note content');
      
      const saveButton = screen.getByText('Save Note');
      await user.click(saveButton);
      
      expect(mockOnSave).toHaveBeenCalledWith(
        'New note content',
        {},
        'New note content'
      );
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not save empty notes', async () => {
      const user = userEvent.setup();
      render(<NotesModal {...defaultProps} />);
      
      const saveButton = screen.getByText('Save Note');
      expect(saveButton).toBeDisabled();
      
      await user.click(saveButton);
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should close when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<NotesModal {...defaultProps} />);
      
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should show confirmation when closing with unsaved changes', async () => {
      const user = userEvent.setup();
      window.confirm = jest.fn(() => true);
      
      render(<NotesModal {...defaultProps} />);
      
      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, 'Unsaved content');
      
      const closeButton = screen.getByTitle('Close (Esc)');
      await user.click(closeButton);
      
      expect(window.confirm).toHaveBeenCalledWith(
        'You have unsaved changes. Are you sure you want to close?'
      );
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should delete note when Delete button is clicked', async () => {
      const user = userEvent.setup();
      window.confirm = jest.fn(() => true);
      
      render(
        <NotesModal
          {...defaultProps}
          existingNote={mockExistingNote}
          onDelete={mockOnDelete}
        />
      );
      
      const deleteButton = screen.getByText('Delete Note');
      await user.click(deleteButton);
      
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this note?'
      );
      expect(mockOnDelete).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should close on Escape key', async () => {
      render(<NotesModal {...defaultProps} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should save on Ctrl+S', async () => {
      const user = userEvent.setup();
      render(<NotesModal {...defaultProps} />);
      
      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, 'Content to save');
      
      fireEvent.keyDown(document, { key: 's', ctrlKey: true });
      
      expect(mockOnSave).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should save on Cmd+S (Mac)', async () => {
      const user = userEvent.setup();
      render(<NotesModal {...defaultProps} />);
      
      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, 'Content to save');
      
      fireEvent.keyDown(document, { key: 's', metaKey: true });
      
      expect(mockOnSave).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should update content when existingNote changes', () => {
      const { rerender } = render(<NotesModal {...defaultProps} />);
      
      const newNote: NodeNote = {
        ...mockExistingNote,
        content: '<p>Updated content</p>',
      };
      
      rerender(
        <NotesModal
          {...defaultProps}
          existingNote={newNote}
          nodeId="different-node"
        />
      );
      
      expect(screen.getByTestId('editor-textarea')).toHaveValue(newNote.content);
    });

    it('should track changes state correctly', async () => {
      const user = userEvent.setup();
      render(<NotesModal {...defaultProps} existingNote={mockExistingNote} />);
      
      const saveButton = screen.getByText('Save Note');
      expect(saveButton).not.toBeDisabled();
      
      const textarea = screen.getByTestId('editor-textarea');
      await user.clear(textarea);
      await user.type(textarea, 'Modified content');
      
      // Verify hasChanges is true by checking if confirmation appears
      window.confirm = jest.fn(() => false);
      const closeButton = screen.getByTitle('Close (Esc)');
      await user.click(closeButton);
      
      expect(window.confirm).toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled(); // Because confirm returned false
    });
  });
});