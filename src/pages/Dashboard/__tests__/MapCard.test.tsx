import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MapCard } from '../MapCard';
import type { MapMetadata } from '../../../types/mindMap';

describe('MapCard', () => {
  const mockOnOpen = jest.fn();
  const mockOnRename = jest.fn().mockResolvedValue(undefined);
  const mockOnDelete = jest.fn().mockResolvedValue(undefined);

  const defaultMap: MapMetadata = {
    id: 'map-1',
    title: 'My Test Map',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodeCount: 12,
  };

  const renderCard = (props: Partial<React.ComponentProps<typeof MapCard>> = {}) =>
    render(
      <MapCard
        map={defaultMap}
        onOpen={mockOnOpen}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
        {...props}
      />
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders map title', () => {
    renderCard();

    expect(screen.getByText('My Test Map')).toBeInTheDocument();
  });

  it('renders node count', () => {
    renderCard();

    expect(screen.getByText('12 nodes')).toBeInTheDocument();
  });

  it('clicking the card calls onOpen with map id', () => {
    renderCard();

    // The card div has role="button" but there are also action buttons inside it.
    // Target the card specifically by its text content.
    const card = screen.getByText('My Test Map').closest('[role="button"]') as HTMLElement;
    fireEvent.click(card);

    expect(mockOnOpen).toHaveBeenCalledTimes(1);
    expect(mockOnOpen).toHaveBeenCalledWith('map-1');
  });

  describe('delete confirmation pattern', () => {
    it('first click on delete shows confirm state, second click calls onDelete', async () => {
      renderCard();

      const deleteButton = screen.getByTitle('Delete');
      // First click: enters confirm state
      fireEvent.click(deleteButton);

      expect(mockOnDelete).not.toHaveBeenCalled();
      // Button title changes to indicate confirmation needed
      expect(screen.getByTitle('Click again to confirm')).toBeInTheDocument();

      // Second click: actually deletes
      const confirmButton = screen.getByTitle('Click again to confirm');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledTimes(1);
        expect(mockOnDelete).toHaveBeenCalledWith('map-1');
      });
    });
  });

  describe('sync status indicators', () => {
    it('shows "Synced" badge when syncStatus is synced', () => {
      const syncedMap: MapMetadata = { ...defaultMap, syncStatus: 'synced' };
      renderCard({ map: syncedMap });

      expect(screen.getByText('Synced')).toBeInTheDocument();
    });

    it('shows "Cloud" badge when syncStatus is cloud-only', () => {
      const cloudMap: MapMetadata = { ...defaultMap, syncStatus: 'cloud-only' };
      renderCard({ map: cloudMap });

      expect(screen.getByText('Cloud')).toBeInTheDocument();
    });

    it('shows "Local" badge when syncStatus is local and isAuthenticated', () => {
      const localMap: MapMetadata = { ...defaultMap, syncStatus: 'local' };
      renderCard({ map: localMap, isAuthenticated: true });

      expect(screen.getByText('Local')).toBeInTheDocument();
    });

    it('does not show "Local" badge when not authenticated', () => {
      const localMap: MapMetadata = { ...defaultMap, syncStatus: 'local' };
      renderCard({ map: localMap, isAuthenticated: false });

      expect(screen.queryByText('Local')).not.toBeInTheDocument();
    });

    it('shows "Shared" text when isPublic is true', () => {
      const publicMap: MapMetadata = { ...defaultMap, isPublic: true };
      renderCard({ map: publicMap });

      expect(screen.getByText(/Shared/)).toBeInTheDocument();
    });
  });
});
