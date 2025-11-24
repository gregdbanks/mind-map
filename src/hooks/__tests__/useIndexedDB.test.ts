import { renderHook, waitFor } from '@testing-library/react';
import { useIndexedDB } from '../useIndexedDB';
import { MindMap } from '../../types/mindMap';

// Mock IndexedDB
const mockIDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
};

const mockObjectStore = {
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

const mockTransaction = {
  objectStore: jest.fn(() => mockObjectStore),
};

const mockDB = {
  transaction: jest.fn(() => mockTransaction),
  createObjectStore: jest.fn(),
  close: jest.fn(),
  objectStoreNames: {
    contains: jest.fn(() => true),
  },
  version: 1,
};

// Setup global IndexedDB mock
(window as any).indexedDB = mockIDB;

describe('useIndexedDB', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock behavior
    mockIDB.open.mockReturnValue({
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: mockDB,
    });
  });

  it('should initialize with loading state', () => {
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

    mockIDB.open.mockImplementation(() => {
      const request = {
        onsuccess: null as any,
        onerror: null as any,
        onupgradeneeded: null as any,
        result: mockDB,
      };
      
      setTimeout(() => {
        if (request.onsuccess) request.onsuccess({ target: { result: mockDB } });
      }, 0);
      
      return request;
    });

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

    mockIDB.open.mockImplementation(() => {
      const request = {
        onsuccess: null as any,
        onerror: null as any,
        onupgradeneeded: null as any,
        result: mockDB,
      };
      
      setTimeout(() => {
        if (request.onsuccess) request.onsuccess({ target: { result: mockDB } });
      }, 0);
      
      return request;
    });

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

    await result.current.save(mockData);

    expect(mockObjectStore.put).toHaveBeenCalledWith(mockData, 'test-key');
  });

  it('should handle errors gracefully', async () => {
    const testError = new Error('IndexedDB error');
    
    mockIDB.open.mockImplementation(() => {
      const request = {
        onsuccess: null as any,
        onerror: null as any,
        onupgradeneeded: null as any,
        result: mockDB,
      };
      
      setTimeout(() => {
        if (request.onerror) request.onerror({ target: { error: testError } });
      }, 0);
      
      return request;
    });

    const { result } = renderHook(() => useIndexedDB<MindMap>('test-key'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Failed to open IndexedDB: IndexedDB error');
    expect(result.current.data).toBeNull();
  });

  it('should delete data from IndexedDB', async () => {
    mockIDB.open.mockImplementation(() => {
      const request = {
        onsuccess: null as any,
        onerror: null as any,
        onupgradeneeded: null as any,
        result: mockDB,
      };
      
      setTimeout(() => {
        if (request.onsuccess) request.onsuccess({ target: { result: mockDB } });
      }, 0);
      
      return request;
    });

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

    await result.current.remove();

    expect(mockObjectStore.delete).toHaveBeenCalledWith('test-key');
  });
});