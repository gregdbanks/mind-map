import { renderHook, waitFor, act } from '@testing-library/react';
import { useIndexedDB } from '../useIndexedDB';
import { MindMap } from '../../types/mindMap';

// Mock the shared database service
const mockObjectStore = {
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

const mockTransaction = {
  objectStore: jest.fn(() => mockObjectStore),
  onerror: null as any,
};

const mockDB = {
  transaction: jest.fn(() => mockTransaction),
  objectStoreNames: {
    contains: jest.fn(() => true),
  },
};

jest.mock('../../services/database', () => ({
  getDatabase: jest.fn(),
}));

import { getDatabase } from '../../services/database';
const mockGetDatabase = getDatabase as jest.MockedFunction<typeof getDatabase>;

describe('useIndexedDB', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDatabase.mockResolvedValue(mockDB as any);
  });

  it('should initialize with loading state', () => {
    // Don't resolve getDatabase yet
    mockGetDatabase.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useIndexedDB<MindMap>('test-key'));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should load data from IndexedDB on mount', async () => {
    const mockData: MindMap = {
      nodes: [{ id: 'test', text: 'Test', x: 0, y: 0, collapsed: false, parent: null }],
      links: [],
      lastModified: new Date(),
    };

    mockObjectStore.get.mockImplementation(() => {
      const request = {
        onsuccess: null as any,
        onerror: null as any,
        result: mockData,
      };

      setTimeout(() => {
        if (request.onsuccess) request.onsuccess({ target: { result: mockData } });
      }, 0);

      return request;
    });

    const { result } = renderHook(() => useIndexedDB<MindMap>('test-key'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it('should save data to IndexedDB', async () => {
    const mockData: MindMap = {
      nodes: [{ id: 'test', text: 'Test', x: 0, y: 0, collapsed: false, parent: null }],
      links: [],
      lastModified: new Date(),
    };

    mockObjectStore.get.mockImplementation(() => {
      const request = {
        onsuccess: null as any,
        onerror: null as any,
        result: null,
      };

      setTimeout(() => {
        if (request.onsuccess) request.onsuccess({ target: { result: null } });
      }, 0);

      return request;
    });

    mockObjectStore.put.mockImplementation(() => {
      const request = {
        onsuccess: null as any,
        onerror: null as any,
      };

      setTimeout(() => {
        if (request.onsuccess) request.onsuccess({});
      }, 0);

      return request;
    });

    const { result } = renderHook(() => useIndexedDB<MindMap>('test-key'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.save(mockData);
    });

    expect(mockObjectStore.put).toHaveBeenCalledWith(mockData, 'test-key');
  });

  it('should handle errors gracefully', async () => {
    const testError = new Error('DB connection failed');
    mockGetDatabase.mockRejectedValue(testError);

    const { result } = renderHook(() => useIndexedDB<MindMap>('test-key'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('DB connection failed');
    expect(result.current.data).toBeNull();
  });

  it('should delete data from IndexedDB', async () => {
    mockObjectStore.get.mockImplementation(() => {
      const request = {
        onsuccess: null as any,
        onerror: null as any,
        result: null,
      };

      setTimeout(() => {
        if (request.onsuccess) request.onsuccess({ target: { result: null } });
      }, 0);

      return request;
    });

    mockObjectStore.delete.mockImplementation(() => {
      const request = {
        onsuccess: null as any,
        onerror: null as any,
      };

      setTimeout(() => {
        if (request.onsuccess) request.onsuccess({});
      }, 0);

      return request;
    });

    const { result } = renderHook(() => useIndexedDB<MindMap>('test-key'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.remove();
    });

    expect(mockObjectStore.delete).toHaveBeenCalledWith('test-key');
  });
});
