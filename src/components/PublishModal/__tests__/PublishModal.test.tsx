import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PublishModal } from '../PublishModal';
import { ApiError } from '../../../services/apiClient';
import { LIBRARY_CATEGORIES } from '../../../types/library';

// Mock apiClient
const mockPublishMap = jest.fn();
const mockGetMap = jest.fn();
const mockUnpublishMap = jest.fn();

jest.mock('../../../services/apiClient', () => {
  class ApiErrorMock extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  }
  return {
    apiClient: {
      publishMap: (...args: unknown[]) => mockPublishMap(...args),
      getMap: (...args: unknown[]) => mockGetMap(...args),
      unpublishMap: (...args: unknown[]) => mockUnpublishMap(...args),
    },
    ApiError: ApiErrorMock,
  };
});

// Mock syncService
const mockPushMapToCloud = jest.fn();

jest.mock('../../../services/syncService', () => ({
  pushMapToCloud: (...args: unknown[]) => mockPushMapToCloud(...args),
}));

describe('PublishModal', () => {
  const mockOnClose = jest.fn();
  const mockOnPublished = jest.fn();
  const mapId = 'test-map-id';
  const mapTitle = 'My Test Map';

  const renderModal = (overrides: Record<string, unknown> = {}) =>
    render(
      <PublishModal
        mapId={mapId}
        mapTitle={mapTitle}
        onClose={mockOnClose}
        onPublished={mockOnPublished}
        {...overrides}
      />
    );

  beforeEach(() => {
    jest.clearAllMocks();
    mockPushMapToCloud.mockResolvedValue(undefined);
    mockPublishMap.mockResolvedValue({});
    mockGetMap.mockResolvedValue({ id: mapId, data: {} });
    mockUnpublishMap.mockResolvedValue(undefined);
  });

  it('renders "Publish to Library" heading', () => {
    renderModal();

    expect(screen.getByText('Publish to Library')).toBeInTheDocument();
  });

  it('pre-fills title from mapTitle prop', async () => {
    renderModal();

    const titleInput = await screen.findByDisplayValue('My Test Map');
    expect(titleInput).toBeInTheDocument();
  });

  it('title field is required — shows error when empty', async () => {
    renderModal();

    // Clear the pre-filled title
    const titleInput = await screen.findByDisplayValue('My Test Map');
    fireEvent.change(titleInput, { target: { value: '' } });

    // Click publish
    const publishButton = screen.getByText('Publish');
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });

    // publishMap should not have been called
    expect(mockPublishMap).not.toHaveBeenCalled();
  });

  it('category dropdown renders all LIBRARY_CATEGORIES options', async () => {
    renderModal();

    const select = await screen.findByRole('combobox');
    expect(select).toBeInTheDocument();

    LIBRARY_CATEGORIES.forEach((cat) => {
      expect(screen.getByText(cat.label)).toBeInTheDocument();
    });
  });

  it('tag input: add tag via Enter key', async () => {
    renderModal();

    const tagInput = await screen.findByPlaceholderText('Add a tag and press Enter');
    fireEvent.change(tagInput, { target: { value: 'react' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    expect(screen.getByText('react')).toBeInTheDocument();
  });

  it('tag input: add tag via Add button', async () => {
    renderModal();

    const tagInput = await screen.findByPlaceholderText('Add a tag and press Enter');
    fireEvent.change(tagInput, { target: { value: 'javascript' } });

    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);

    expect(screen.getByText('javascript')).toBeInTheDocument();
  });

  it('tags limited to 10 max', async () => {
    renderModal();

    const tagInput = await screen.findByPlaceholderText('Add a tag and press Enter');

    // Add 10 tags
    for (let i = 1; i <= 10; i++) {
      fireEvent.change(tagInput, { target: { value: `tag${i}` } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });
    }

    // All 10 tags should be present
    for (let i = 1; i <= 10; i++) {
      expect(screen.getByText(`tag${i}`)).toBeInTheDocument();
    }

    // Try adding an 11th tag — should not appear
    fireEvent.change(tagInput, { target: { value: 'tag11' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    expect(screen.queryByText('tag11')).not.toBeInTheDocument();
  });

  it('duplicate tags prevented', async () => {
    renderModal();

    const tagInput = await screen.findByPlaceholderText('Add a tag and press Enter');

    fireEvent.change(tagInput, { target: { value: 'react' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    // Try adding the same tag again
    fireEvent.change(tagInput, { target: { value: 'react' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    // Should only appear once (one text node + one remove button)
    const reactTags = screen.getAllByText('react');
    expect(reactTags).toHaveLength(1);
  });

  it('remove tag button works', async () => {
    renderModal();

    const tagInput = await screen.findByPlaceholderText('Add a tag and press Enter');

    fireEvent.change(tagInput, { target: { value: 'removeme' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    expect(screen.getByText('removeme')).toBeInTheDocument();

    // The remove button is the \u00D7 next to the tag
    const tagSpan = screen.getByText('removeme').closest('span')!;
    const removeButton = tagSpan.querySelector('button')!;
    fireEvent.click(removeButton);

    expect(screen.queryByText('removeme')).not.toBeInTheDocument();
  });

  it('publish button calls apiClient.publishMap with correct data', async () => {
    renderModal();

    // Wait for cloud check to resolve
    const tagInput = await screen.findByPlaceholderText('Add a tag and press Enter');

    // Add a tag
    fireEvent.change(tagInput, { target: { value: 'testtag' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    // Fill in description
    const descInput = screen.getByPlaceholderText('What is this mind map about?');
    fireEvent.change(descInput, { target: { value: 'A test description' } });

    // Click publish
    const publishButton = screen.getByText('Publish');
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(mockPublishMap).toHaveBeenCalledWith({
        mapId,
        title: 'My Test Map',
        description: 'A test description',
        category: 'other',
        tags: ['testtag'],
      });
    });
  });

  it('shows "Publishing..." during submission', async () => {
    // Make publishMap hang so we can see the publishing state
    mockPublishMap.mockReturnValue(new Promise(() => {}));

    renderModal();

    const publishButton = await screen.findByText('Publish');
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(screen.getByText('Publishing...')).toBeInTheDocument();
    });
  });

  it('calls onPublished and onClose on success', async () => {
    renderModal();

    const publishButton = await screen.findByText('Publish');
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(mockOnPublished).toHaveBeenCalledTimes(1);
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows error message on failure', async () => {
    mockPublishMap.mockRejectedValue(new Error('Network error'));

    renderModal();

    const publishButton = await screen.findByText('Publish');
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // onPublished should not be called on failure
    expect(mockOnPublished).not.toHaveBeenCalled();
  });

  it('close button and overlay click call onClose', async () => {
    renderModal();

    // Wait for cloud check to complete
    await screen.findByDisplayValue('My Test Map');

    // Close button (\u00D7)
    const closeButton = screen.getByText('\u00D7');
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    mockOnClose.mockClear();

    // Re-render to test overlay click
    const { container: container2 } = render(
      <PublishModal
        mapId={mapId}
        mapTitle={mapTitle}
        onClose={mockOnClose}
        onPublished={mockOnPublished}
      />
    );

    // Wait for cloud check
    await screen.findAllByDisplayValue('My Test Map');

    const overlay = container2.firstChild as HTMLElement;
    fireEvent.click(overlay);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows cloud sync prompt when map is not in cloud', async () => {
    mockGetMap.mockRejectedValue(new ApiError('Not found', 404));

    renderModal();

    await waitFor(() => {
      expect(screen.getByText(/needs to be saved to the cloud/)).toBeInTheDocument();
    });

    expect(screen.getByText('Save to Cloud & Continue')).toBeInTheDocument();
    // Publish form should not be visible
    expect(screen.queryByPlaceholderText('Add a tag and press Enter')).not.toBeInTheDocument();
  });

  it('syncs to cloud and shows publish form after successful sync', async () => {
    mockGetMap.mockRejectedValue(new ApiError('Not found', 404));

    renderModal();

    const syncButton = await screen.findByText('Save to Cloud & Continue');
    fireEvent.click(syncButton);

    await waitFor(() => {
      expect(mockPushMapToCloud).toHaveBeenCalledWith(mapId, true);
    });

    // After sync, publish form should appear
    await waitFor(() => {
      expect(screen.getByDisplayValue('My Test Map')).toBeInTheDocument();
    });
  });

  it('shows "Already Published" state with unpublish option', async () => {
    renderModal({ publishedMapId: 'pub-123' });

    expect(screen.getByText('Already Published')).toBeInTheDocument();
    expect(screen.getByText('Unpublish')).toBeInTheDocument();
  });

  it('calls unpublishMap when unpublish is clicked', async () => {
    renderModal({ publishedMapId: 'pub-123' });

    fireEvent.click(screen.getByText('Unpublish'));

    await waitFor(() => {
      expect(mockUnpublishMap).toHaveBeenCalledWith('pub-123');
    });
    expect(mockOnClose).toHaveBeenCalled();
  });
});
