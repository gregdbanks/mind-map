import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EditorHeader } from '../EditorHeader';

// --- Mocks ---

const mockNavigate = jest.fn();
const mockRename = jest.fn().mockResolvedValue(undefined);
let mockIsAuthenticated = true;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../hooks/useMapTitle', () => ({
  useMapTitle: () => ({
    title: 'Test Map Title',
    loading: false,
    rename: mockRename,
  }),
}));

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
  }),
}));

jest.mock('../../ShareModal/ShareModal', () => ({
  ShareModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="share-modal">
      <button onClick={onClose}>Close Share</button>
    </div>
  ),
}));

jest.mock('../../UpgradeModal', () => ({
  UpgradeModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="upgrade-modal">
      <button onClick={onClose}>Close Upgrade</button>
    </div>
  ),
}));

jest.mock('../../PublishModal', () => ({
  PublishModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="publish-modal">
      <button onClick={onClose}>Close Publish</button>
    </div>
  ),
}));

// --- Helpers ---

const renderHeader = (overrides = {}) =>
  render(
    <MemoryRouter>
      <EditorHeader mapId="test-map-1" saveStatus="idle" {...overrides} />
    </MemoryRouter>
  );

// --- Tests ---

describe('EditorHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated = true;
  });

  // ============================
  // Back button
  // ============================

  describe('Back button', () => {
    it('navigates to "/" when clicked', () => {
      renderHeader();
      fireEvent.click(screen.getByLabelText('Back to Dashboard'));
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  // ============================
  // Title display & editing
  // ============================

  describe('Title', () => {
    it('renders the map title', () => {
      renderHeader();
      expect(screen.getByText('Test Map Title')).toBeInTheDocument();
    });

    it('enters edit mode when title is clicked', () => {
      renderHeader();
      fireEvent.click(screen.getByText('Test Map Title'));
      const input = screen.getByDisplayValue('Test Map Title');
      expect(input).toBeInTheDocument();
      expect(input).toHaveFocus();
    });

    it('saves on Enter key', async () => {
      renderHeader();
      fireEvent.click(screen.getByText('Test Map Title'));
      const input = screen.getByDisplayValue('Test Map Title');

      fireEvent.change(input, { target: { value: 'New Title' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(mockRename).toHaveBeenCalledWith('New Title');
      });
      // Should exit edit mode (async save completes then sets isEditing to false)
      await waitFor(() => {
        expect(screen.queryByDisplayValue('New Title')).not.toBeInTheDocument();
      });
    });

    it('cancels on Escape key without saving', () => {
      renderHeader();
      fireEvent.click(screen.getByText('Test Map Title'));
      const input = screen.getByDisplayValue('Test Map Title');

      fireEvent.change(input, { target: { value: 'Cancelled Title' } });
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

      expect(mockRename).not.toHaveBeenCalled();
      // Should exit edit mode and show original title
      expect(screen.getByText('Test Map Title')).toBeInTheDocument();
    });

    it('saves on blur', async () => {
      renderHeader();
      fireEvent.click(screen.getByText('Test Map Title'));
      const input = screen.getByDisplayValue('Test Map Title');

      fireEvent.change(input, { target: { value: 'Blur Title' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(mockRename).toHaveBeenCalledWith('Blur Title');
      });
    });

    it('does not call rename if title is unchanged', async () => {
      renderHeader();
      fireEvent.click(screen.getByText('Test Map Title'));
      const input = screen.getByDisplayValue('Test Map Title');

      // Press Enter without changing value
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Test Map Title')).toBeInTheDocument();
      });
      expect(mockRename).not.toHaveBeenCalled();
    });
  });

  // ============================
  // Save status indicators
  // ============================

  describe('Save status', () => {
    it('shows "Saving..." when saveStatus is saving', () => {
      renderHeader({ saveStatus: 'saving' });
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('shows "Saved locally" when saveStatus is saved', () => {
      renderHeader({ saveStatus: 'saved' });
      expect(screen.getByText('Saved locally')).toBeInTheDocument();
    });

    it('shows "Syncing..." when saveStatus is syncing', () => {
      renderHeader({ saveStatus: 'syncing' });
      expect(screen.getByText('Syncing...')).toBeInTheDocument();
    });

    it('shows "Synced" when saveStatus is synced', () => {
      renderHeader({ saveStatus: 'synced' });
      expect(screen.getByText('Synced')).toBeInTheDocument();
    });

    it('shows "Cloud sync failed" when saveStatus is sync-error', () => {
      renderHeader({ saveStatus: 'sync-error' });
      expect(screen.getByText('Cloud sync failed')).toBeInTheDocument();
    });

    it('shows "Offline — saved locally" when saveStatus is offline', () => {
      renderHeader({ saveStatus: 'offline' });
      expect(screen.getByText('Offline — saved locally')).toBeInTheDocument();
    });
  });

  // ============================
  // "Saved locally" click behavior
  // ============================

  describe('Saved locally click behavior', () => {
    it('redirects to /login when not authenticated', () => {
      mockIsAuthenticated = false;
      renderHeader({ saveStatus: 'saved' });

      fireEvent.click(screen.getByText('Saved locally'));
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('shows upgrade modal when authenticated, at cloud limit, and not pro', () => {
      mockIsAuthenticated = true;
      renderHeader({ saveStatus: 'saved', isAtCloudLimit: true, isPro: false });

      fireEvent.click(screen.getByText('Saved locally'));
      expect(screen.getByTestId('upgrade-modal')).toBeInTheDocument();
    });

    it('does not navigate or show modal when authenticated and not at cloud limit', () => {
      mockIsAuthenticated = true;
      renderHeader({ saveStatus: 'saved', isAtCloudLimit: false, isPro: false });

      fireEvent.click(screen.getByText('Saved locally'));
      expect(mockNavigate).not.toHaveBeenCalledWith('/login');
      expect(screen.queryByTestId('upgrade-modal')).not.toBeInTheDocument();
    });

    it('has role="button" when not authenticated', () => {
      mockIsAuthenticated = false;
      renderHeader({ saveStatus: 'saved' });

      const statusEl = screen.getByText('Saved locally').closest('[role="button"]');
      expect(statusEl).toBeInTheDocument();
    });

    it('has role="button" when at cloud limit and not pro', () => {
      mockIsAuthenticated = true;
      renderHeader({ saveStatus: 'saved', isAtCloudLimit: true, isPro: false });

      const statusEl = screen.getByText('Saved locally').closest('[role="button"]');
      expect(statusEl).toBeInTheDocument();
    });
  });

  // ============================
  // Action buttons visibility
  // ============================

  describe('Action buttons visibility', () => {
    it('shows action buttons when authenticated', () => {
      mockIsAuthenticated = true;
      renderHeader();

      expect(screen.getByLabelText('Share mind map')).toBeInTheDocument();
      expect(screen.getByLabelText('Publish to library')).toBeInTheDocument();
      expect(screen.getByLabelText('Version history')).toBeInTheDocument();
    });

    it('hides action buttons when not authenticated', () => {
      mockIsAuthenticated = false;
      renderHeader();

      expect(screen.queryByLabelText('Share mind map')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Publish to library')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Version history')).not.toBeInTheDocument();
    });
  });

  // ============================
  // Share button
  // ============================

  describe('Share button', () => {
    it('shows UpgradeModal when NOT Pro', () => {
      renderHeader({ isPro: false });
      fireEvent.click(screen.getByLabelText('Share mind map'));

      expect(screen.getByTestId('upgrade-modal')).toBeInTheDocument();
      expect(screen.queryByTestId('share-modal')).not.toBeInTheDocument();
    });

    it('shows ShareModal when Pro', () => {
      renderHeader({ isPro: true });
      fireEvent.click(screen.getByLabelText('Share mind map'));

      expect(screen.getByTestId('share-modal')).toBeInTheDocument();
      expect(screen.queryByTestId('upgrade-modal')).not.toBeInTheDocument();
    });

    it('closes ShareModal via its close button', () => {
      renderHeader({ isPro: true });
      fireEvent.click(screen.getByLabelText('Share mind map'));

      expect(screen.getByTestId('share-modal')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Close Share'));
      expect(screen.queryByTestId('share-modal')).not.toBeInTheDocument();
    });

    it('closes UpgradeModal via its close button', () => {
      renderHeader({ isPro: false });
      fireEvent.click(screen.getByLabelText('Share mind map'));

      expect(screen.getByTestId('upgrade-modal')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Close Upgrade'));
      expect(screen.queryByTestId('upgrade-modal')).not.toBeInTheDocument();
    });
  });

  // ============================
  // Publish button
  // ============================

  describe('Publish button', () => {
    it('opens PublishModal when clicked', () => {
      renderHeader();
      fireEvent.click(screen.getByLabelText('Publish to library'));

      expect(screen.getByTestId('publish-modal')).toBeInTheDocument();
    });

    it('closes PublishModal via its close button', () => {
      renderHeader();
      fireEvent.click(screen.getByLabelText('Publish to library'));

      expect(screen.getByTestId('publish-modal')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Close Publish'));
      expect(screen.queryByTestId('publish-modal')).not.toBeInTheDocument();
    });
  });

  // ============================
  // History button
  // ============================

  describe('History button', () => {
    it('shows "Pro" badge when NOT Pro', () => {
      renderHeader({ isPro: false });
      const historyButton = screen.getByLabelText('Version history');

      expect(historyButton).toHaveTextContent('Pro');
    });

    it('does not show "Pro" badge when Pro', () => {
      renderHeader({ isPro: true });
      const historyButton = screen.getByLabelText('Version history');

      expect(historyButton).not.toHaveTextContent('Pro');
    });

    it('shows UpgradeModal when NOT Pro', () => {
      renderHeader({ isPro: false });
      fireEvent.click(screen.getByLabelText('Version history'));

      expect(screen.getByTestId('upgrade-modal')).toBeInTheDocument();
    });

    it('calls onToggleHistory when Pro', () => {
      const mockToggle = jest.fn();
      renderHeader({ isPro: true, onToggleHistory: mockToggle });

      fireEvent.click(screen.getByLabelText('Version history'));
      expect(mockToggle).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId('upgrade-modal')).not.toBeInTheDocument();
    });

    it('does not throw when Pro and onToggleHistory is not provided', () => {
      renderHeader({ isPro: true });

      expect(() => {
        fireEvent.click(screen.getByLabelText('Version history'));
      }).not.toThrow();
    });
  });
});
