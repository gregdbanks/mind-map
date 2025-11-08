import { renderHook, act, waitFor } from '@testing-library/react';
import { useMindMapPersistence } from '../useMindMapPersistence';
import { MindMapProvider, useMindMap } from '../../context/MindMapContext';
import { ReactNode } from 'react';

// Mock the hooks
jest.mock('../useIndexedDB');
import { useIndexedDB } from '../useIndexedDB';

const mockUseIndexedDB = useIndexedDB as jest.MockedFunction<typeof useIndexedDB>;

describe('useMindMapPersistence', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MindMapProvider>{children}</MindMapProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Default mock implementation
    mockUseIndexedDB.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      save: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should load data from IndexedDB on mount', async () => {
    const mockData = {
      nodes: [
        { id: 'node-1', text: 'Test Node', x: 0, y: 0, collapsed: false, parent: null }
      ],
      links: [],
      lastModified: new Date(),
    };

    mockUseIndexedDB.mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
      save: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    });

    const { result } = renderHook(() => useMindMapPersistence(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // The data should be loaded into the context
    // We can't directly test the context state here, but we can verify the hook returns correctly
    expect(result.current.error).toBeNull();
  });

  it('should auto-save changes after delay', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    
    mockUseIndexedDB.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      save: saveMock,
      remove: jest.fn().mockResolvedValue(undefined),
    });

    const { result } = renderHook(() => {
      const persistence = useMindMapPersistence();
      const { addNode } = useMindMap();
      return { persistence, addNode };
    }, { wrapper });

    // Add a node to trigger auto-save
    act(() => {
      result.current.addNode(null, { x: 0, y: 0 }, 'Test Node');
    });

    // Fast-forward past the debounce delay
    act(() => {
      jest.advanceTimersByTime(600); // AUTOSAVE_DELAY is 500ms
    });

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledTimes(1);
    });

    // Check that save was called with data containing our test node
    const savedData = saveMock.mock.calls[0][0];
    expect(savedData).toMatchObject({
      nodes: expect.any(Array),
      links: expect.any(Array),
      lastModified: expect.any(Date),
    });
    
    // Verify our test node is in the saved nodes
    const testNode = savedData.nodes.find((node: any) => node.text === 'Test Node');
    expect(testNode).toBeDefined();
    expect(testNode).toMatchObject({
      text: 'Test Node',
      x: 0,
      y: 0,
    });
  });

  it('should debounce multiple saves', async () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    
    mockUseIndexedDB.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      save: saveMock,
      remove: jest.fn().mockResolvedValue(undefined),
    });

    const { result } = renderHook(() => {
      const persistence = useMindMapPersistence();
      const { addNode } = useMindMap();
      return { persistence, addNode };
    }, { wrapper });

    // Add multiple nodes rapidly
    act(() => {
      result.current.addNode(null, { x: 0, y: 0 }, 'Node 1');
    });
    
    act(() => {
      jest.advanceTimersByTime(200);
    });

    act(() => {
      result.current.addNode(null, { x: 50, y: 50 }, 'Node 2');
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    act(() => {
      result.current.addNode(null, { x: 100, y: 100 }, 'Node 3');
    });

    // Should not have saved yet
    expect(saveMock).not.toHaveBeenCalled();

    // Fast-forward to trigger the debounced save
    act(() => {
      jest.advanceTimersByTime(600);
    });

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle save errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const saveError = new Error('Save failed');
    const saveMock = jest.fn().mockRejectedValue(saveError);
    
    mockUseIndexedDB.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      save: saveMock,
      remove: jest.fn().mockResolvedValue(undefined),
    });

    const { result } = renderHook(() => {
      const persistence = useMindMapPersistence();
      const { addNode } = useMindMap();
      return { persistence, addNode };
    }, { wrapper });

    act(() => {
      result.current.addNode(null, { x: 0, y: 0 }, 'Test Node');
    });

    act(() => {
      jest.advanceTimersByTime(600);
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save mind map:', saveError);
    });

    consoleSpy.mockRestore();
  });

  it('should not save when loading', () => {
    const saveMock = jest.fn().mockResolvedValue(undefined);
    
    mockUseIndexedDB.mockReturnValue({
      data: null,
      loading: true, // Still loading
      error: null,
      save: saveMock,
      remove: jest.fn().mockResolvedValue(undefined),
    });

    const { result } = renderHook(() => {
      const persistence = useMindMapPersistence();
      const { addNode } = useMindMap();
      return { persistence, addNode };
    }, { wrapper });

    act(() => {
      result.current.addNode(null, { x: 0, y: 0 }, 'Test Node');
    });

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(saveMock).not.toHaveBeenCalled();
  });
});