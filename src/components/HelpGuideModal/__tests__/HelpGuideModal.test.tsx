import { render, screen, fireEvent } from '@testing-library/react';
import { HelpGuideModal } from '../HelpGuideModal';

// Mock ReactDOM.createPortal
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: any) => node,
}));

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const renderModal = (props: Partial<HelpGuideModalProps> = {}) => {
  return render(
    <HelpGuideModal isOpen={true} onClose={jest.fn()} {...props} />
  );
};

describe('HelpGuideModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    renderModal({ isOpen: false });

    expect(screen.queryByText('ThoughtNet Help Guide')).not.toBeInTheDocument();
  });

  it('renders modal when isOpen is true', () => {
    renderModal({ isOpen: true });

    expect(screen.getByText('ThoughtNet Help Guide')).toBeInTheDocument();
  });

  it('displays keyboard shortcuts section', () => {
    renderModal();

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Ctrl + S')).toBeInTheDocument();
    expect(screen.getByText('Export mind map as JSON')).toBeInTheDocument();
    expect(screen.getByText('Ctrl + Z')).toBeInTheDocument();
    expect(screen.getByText('Undo last action')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Delete selected node and children')).toBeInTheDocument();
    expect(screen.getByText('Tab')).toBeInTheDocument();
    expect(screen.getByText('Add sibling to selected node')).toBeInTheDocument();
  });

  it('displays mouse actions section', () => {
    renderModal();

    expect(screen.getByText('Mouse Actions')).toBeInTheDocument();
    expect(screen.getByText('Click node')).toBeInTheDocument();
    expect(screen.getByText('Select and highlight node tree')).toBeInTheDocument();
    expect(screen.getByText('Double-click node')).toBeInTheDocument();
    expect(screen.getByText('Edit node text and colors')).toBeInTheDocument();
    expect(screen.getByText('Scroll wheel')).toBeInTheDocument();
    expect(screen.getByText('Zoom in/out')).toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', () => {
    const mockOnClose = jest.fn();
    renderModal({ onClose: mockOnClose });

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const mockOnClose = jest.fn();
    renderModal({ onClose: mockOnClose });

    const overlay = screen.getByTestId('help-guide-overlay');
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    renderModal({ onClose: mockOnClose });

    const closeButton = screen.getByTitle('Close (Esc)');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
