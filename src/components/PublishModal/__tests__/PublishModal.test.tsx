import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PublishModal } from '../PublishModal';
import { LIBRARY_CATEGORIES } from '../../../types/library';

// Mock apiClient
const mockPublishMap = jest.fn();

jest.mock('../../../services/apiClient', () => ({
  apiClient: {
    publishMap: (...args: unknown[]) => mockPublishMap(...args),
  },
}));

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
  });

  it('renders "Publish to Library" heading', () => {
    renderModal();

    expect(screen.getByText('Publish to Library')).toBeInTheDocument();
  });

  it('pre-fills title from mapTitle prop', () => {
    renderModal();

    const titleInput = screen.getByDisplayValue('My Test Map');
    expect(titleInput).toBeInTheDocument();
  });

  it('title field is required — shows error when empty', async () => {
    renderModal();

    // Clear the pre-filled title
    const titleInput = screen.getByDisplayValue('My Test Map');
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

  it('category dropdown renders all LIBRARY_CATEGORIES options', () => {
    renderModal();

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    LIBRARY_CATEGORIES.forEach((cat) => {
      expect(screen.getByText(cat.label)).toBeInTheDocument();
    });
  });

  it('tag input: add tag via Enter key', () => {
    renderModal();

    const tagInput = screen.getByPlaceholderText('Add a tag and press Enter');
    fireEvent.change(tagInput, { target: { value: 'react' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    expect(screen.getByText('react')).toBeInTheDocument();
  });

  it('tag input: add tag via Add button', () => {
    renderModal();

    const tagInput = screen.getByPlaceholderText('Add a tag and press Enter');
    fireEvent.change(tagInput, { target: { value: 'javascript' } });

    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);

    expect(screen.getByText('javascript')).toBeInTheDocument();
  });

  it('tags limited to 10 max', () => {
    renderModal();

    const tagInput = screen.getByPlaceholderText('Add a tag and press Enter');

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

  it('duplicate tags prevented', () => {
    renderModal();

    const tagInput = screen.getByPlaceholderText('Add a tag and press Enter');

    fireEvent.change(tagInput, { target: { value: 'react' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    // Try adding the same tag again
    fireEvent.change(tagInput, { target: { value: 'react' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    // Should only appear once (one text node + one remove button)
    const reactTags = screen.getAllByText('react');
    expect(reactTags).toHaveLength(1);
  });

  it('remove tag button works', () => {
    renderModal();

    const tagInput = screen.getByPlaceholderText('Add a tag and press Enter');

    fireEvent.change(tagInput, { target: { value: 'removeme' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    expect(screen.getByText('removeme')).toBeInTheDocument();

    // The remove button is the \u00D7 next to the tag
    const tagSpan = screen.getByText('removeme').closest('span')!;
    const removeButton = tagSpan.querySelector('button')!;
    fireEvent.click(removeButton);

    expect(screen.queryByText('removeme')).not.toBeInTheDocument();
  });

  it('publish button calls pushMapToCloud then apiClient.publishMap with correct data', async () => {
    renderModal();

    // Add a tag
    const tagInput = screen.getByPlaceholderText('Add a tag and press Enter');
    fireEvent.change(tagInput, { target: { value: 'testtag' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    // Fill in description
    const descInput = screen.getByPlaceholderText('What is this mind map about?');
    fireEvent.change(descInput, { target: { value: 'A test description' } });

    // Click publish
    const publishButton = screen.getByText('Publish');
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(mockPushMapToCloud).toHaveBeenCalledWith(mapId, true);
    });

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
    // Make pushMapToCloud hang so we can see the publishing state
    mockPushMapToCloud.mockReturnValue(new Promise(() => {}));

    renderModal();

    const publishButton = screen.getByText('Publish');
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(screen.getByText('Publishing...')).toBeInTheDocument();
    });
  });

  it('calls onPublished and onClose on success', async () => {
    renderModal();

    const publishButton = screen.getByText('Publish');
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(mockOnPublished).toHaveBeenCalledTimes(1);
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows error message on failure', async () => {
    mockPushMapToCloud.mockRejectedValue(new Error('Network error'));

    renderModal();

    const publishButton = screen.getByText('Publish');
    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // onPublished should not be called on failure
    expect(mockOnPublished).not.toHaveBeenCalled();
  });

  it('close button and overlay click call onClose', () => {
    renderModal();

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

    const overlay = container2.firstChild as HTMLElement;
    fireEvent.click(overlay);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
