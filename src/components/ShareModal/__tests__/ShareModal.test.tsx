import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareModal } from '../ShareModal';

// Mock apiClient
const mockGetShareStatus = jest.fn();
const mockShareMap = jest.fn();
const mockUnshareMap = jest.fn();

jest.mock('../../../services/apiClient', () => ({
  apiClient: {
    getShareStatus: (...args: unknown[]) => mockGetShareStatus(...args),
    shareMap: (...args: unknown[]) => mockShareMap(...args),
    unshareMap: (...args: unknown[]) => mockUnshareMap(...args),
  },
}));

// Mock navigator.clipboard
const mockWriteText = jest.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: { writeText: mockWriteText },
});

describe('ShareModal', () => {
  const mockOnClose = jest.fn();
  const mapId = 'test-map-123';

  const renderModal = () =>
    render(<ShareModal mapId={mapId} onClose={mockOnClose} />);

  // Helper to locate the toggle button.
  // DOM: div.toggleRow > [ div > [div.toggleLabel("Public sharing"), ...], button.toggle ]
  const getToggleButton = () => {
    const label = screen.getByText('Public sharing');
    const toggleRow = label.parentElement!.parentElement!;
    return toggleRow.querySelector(':scope > button') as HTMLButtonElement;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetShareStatus.mockResolvedValue({
      is_public: false,
      share_token: null,
      shared_at: null,
    });
  });

  it('renders modal with "Share" heading', async () => {
    renderModal();

    expect(screen.getByText('Share Mind Map')).toBeInTheDocument();
    await waitFor(() => expect(mockGetShareStatus).toHaveBeenCalledWith(mapId));
  });

  it('shows loading state initially', () => {
    // Make getShareStatus hang to keep loading state visible
    mockGetShareStatus.mockReturnValue(new Promise(() => {}));
    renderModal();

    const toggleButton = getToggleButton();
    expect(toggleButton).toBeDisabled();
  });

  it('after loading, shows toggle for public sharing', async () => {
    renderModal();

    await waitFor(() => {
      expect(screen.getByText('Public sharing')).toBeInTheDocument();
    });

    // Toggle should now be enabled after loading resolves
    await waitFor(() => {
      const toggleButton = getToggleButton();
      expect(toggleButton).not.toBeDisabled();
    });
  });

  it('toggle on calls shareMap and shows share URL', async () => {
    mockShareMap.mockResolvedValue({
      share_token: 'abc123',
      shared_at: '2025-01-01T00:00:00Z',
    });

    renderModal();

    // Wait for loading to finish
    await waitFor(() => {
      const toggleButton = getToggleButton();
      expect(toggleButton).not.toBeDisabled();
    });

    fireEvent.click(getToggleButton());

    await waitFor(() => {
      expect(mockShareMap).toHaveBeenCalledWith(mapId);
    });

    // The share URL input should contain the share link
    await waitFor(() => {
      const urlInput = screen.getByDisplayValue(/\/shared\/abc123/);
      expect(urlInput).toBeInTheDocument();
    });
  });

  it('copy button copies URL to clipboard', async () => {
    mockGetShareStatus.mockResolvedValue({
      is_public: true,
      share_token: 'token456',
      shared_at: '2025-01-01T00:00:00Z',
    });

    renderModal();

    await waitFor(() => {
      expect(screen.getByText('Copy')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Copy'));

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('/shared/token456')
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('toggle off calls unshareMap', async () => {
    mockGetShareStatus.mockResolvedValue({
      is_public: true,
      share_token: 'token789',
      shared_at: '2025-01-01T00:00:00Z',
    });
    mockUnshareMap.mockResolvedValue(undefined);

    renderModal();

    // Wait for loading to finish
    await waitFor(() => {
      const toggleButton = getToggleButton();
      expect(toggleButton).not.toBeDisabled();
    });

    fireEvent.click(getToggleButton());

    await waitFor(() => {
      expect(mockUnshareMap).toHaveBeenCalledWith(mapId);
    });
  });

  it('close button calls onClose', async () => {
    renderModal();

    // The close button renders &times; (\u00D7)
    const closeButton = screen.getByText('\u00D7');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('overlay click calls onClose', async () => {
    const { container } = renderModal();

    // The overlay is the outermost div
    const overlay = container.firstChild as HTMLElement;
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
