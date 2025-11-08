import { renderHook, act, waitFor } from '@testing-library/react';
import { useIndexedDBNotes } from '../useIndexedDBNotes';
import type { NodeNote } from '../../types';

// Mock IndexedDB
const mockIndexedDB = {
  databases: new Map(),
  
  open: jest.fn((name: string, version: number) => {
    const request = {
      result: null as any,
      error: null as any,
      onsuccess: null as any,
      onerror: null as any,
      onupgradeneeded: null as any,
    };

    setTimeout(() => {
      const db = {
        name,
        version,
        objectStoreNames: {
          contains: (storeName: string) => mockIndexedDB.databases.has(storeName),
        },
        transaction: (_storeNames: string[], _mode: string) => {
          const transaction = {
            objectStore: (storeName: string) => {
              const store = mockIndexedDB.databases.get(storeName) || new Map();
              mockIndexedDB.databases.set(storeName, store);
              
              return {
                put: (value: any, key?: any) => {
                  const request = {
                    onsuccess: null as any,
                    onerror: null as any,
                  };
                  
                  setTimeout(() => {
                    store.set(key || value.nodeId, value);
                    if (request.onsuccess) request.onsuccess({ target: request });
                  }, 0);
                  
                  return request;
                },
                
                get: (key: any) => {
                  const request = {
                    result: store.get(key),
                    onsuccess: null as any,
                    onerror: null as any,
                  };
                  
                  setTimeout(() => {
                    if (request.onsuccess) {
                      request.onsuccess({ target: request });
                    }
                  }, 0);
                  
                  return request;
                },
                
                getAll: () => {
                  const request = {
                    result: Array.from(store.values()),
                    onsuccess: null as any,
                    onerror: null as any,
                  };
                  
                  setTimeout(() => {
                    if (request.onsuccess) {
                      request.onsuccess({ target: request });
                    }
                  }, 0);
                  
                  return request;
                },
                
                delete: (key: any) => {
                  const request = {
                    onsuccess: null as any,
                    onerror: null as any,
                  };
                  
                  setTimeout(() => {
                    store.delete(key);
                    if (request.onsuccess) request.onsuccess({ target: request });
                  }, 0);
                  
                  return request;
                },
                
                clear: () => {
                  const request = {
                    onsuccess: null as any,
                    onerror: null as any,
                  };
                  
                  setTimeout(() => {
                    store.clear();
                    if (request.onsuccess) request.onsuccess({ target: request });
                  }, 0);
                  
                  return request;
                },
                
                createIndex: jest.fn(),
              };
            },
          };
          
          return transaction;
        },
        createObjectStore: jest.fn((_name: string, _options: any) => ({
          createIndex: jest.fn(),
        })),
        close: jest.fn(),
      };

      request.result = db;
      
      if (version > 1 && request.onupgradeneeded) {
        request.onupgradeneeded({ target: request });
      }
      
      if (request.onsuccess) {
        request.onsuccess({ target: request });
      }
    }, 0);

    return request;
  }),
};

// Replace global IndexedDB with mock
(globalThis as any).indexedDB = mockIndexedDB;

describe('useIndexedDBNotes', () => {
  const mockNote: NodeNote = {
    id: 'note-1',
    nodeId: 'node-1',
    content: '<p>Test note</p>',
    contentJson: { type: 'doc', content: [] },
    contentType: 'tiptap',
    plainText: 'Test note',
    tags: ['test'],
    isPinned: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    mockIndexedDB.databases.clear();
    jest.clearAllMocks();
  });

  it('should initialize with empty notes', async () => {
    const { result } = renderHook(() => useIndexedDBNotes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.notes.size).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('should save a note', async () => {
    const { result } = renderHook(() => useIndexedDBNotes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.saveNote(mockNote);
    });

    expect(result.current.notes.size).toBe(1);
    expect(result.current.notes.get(mockNote.nodeId)).toEqual(mockNote);
  });

  it('should update an existing note', async () => {
    const { result } = renderHook(() => useIndexedDBNotes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Save initial note
    await act(async () => {
      await result.current.saveNote(mockNote);
    });

    // Update the note
    const updatedNote = {
      ...mockNote,
      content: '<p>Updated content</p>',
      plainText: 'Updated content',
      updatedAt: new Date('2024-01-02'),
    };

    await act(async () => {
      await result.current.saveNote(updatedNote);
    });

    expect(result.current.notes.size).toBe(1);
    expect(result.current.notes.get(mockNote.nodeId)).toEqual(updatedNote);
  });

  it('should delete a note', async () => {
    const { result } = renderHook(() => useIndexedDBNotes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Save a note first
    await act(async () => {
      await result.current.saveNote(mockNote);
    });

    expect(result.current.notes.size).toBe(1);

    // Delete the note
    await act(async () => {
      await result.current.deleteNote(mockNote.nodeId);
    });

    expect(result.current.notes.size).toBe(0);
    expect(result.current.notes.has(mockNote.nodeId)).toBe(false);
  });

  it('should get a note by nodeId', async () => {
    const { result } = renderHook(() => useIndexedDBNotes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.saveNote(mockNote);
    });

    const retrievedNote = result.current.getNote(mockNote.nodeId);
    expect(retrievedNote).toEqual(mockNote);
  });

  it('should return undefined for non-existent note', async () => {
    const { result } = renderHook(() => useIndexedDBNotes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const note = result.current.getNote('non-existent');
    expect(note).toBeUndefined();
  });

  it('should clear all notes', async () => {
    const { result } = renderHook(() => useIndexedDBNotes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Save multiple notes
    const notes = [
      mockNote,
      { ...mockNote, id: 'note-2', nodeId: 'node-2' },
      { ...mockNote, id: 'note-3', nodeId: 'node-3' },
    ];

    await act(async () => {
      for (const note of notes) {
        await result.current.saveNote(note);
      }
    });

    expect(result.current.notes.size).toBe(3);

    // Clear all notes
    await act(async () => {
      await result.current.clearAllNotes();
    });

    expect(result.current.notes.size).toBe(0);
  });

  it('should handle errors when database is not initialized', async () => {
    const { result } = renderHook(() => useIndexedDBNotes());

    // Don't wait for initialization
    expect(result.current.loading).toBe(true);

    // Try to save without waiting
    await expect(
      act(async () => {
        await result.current.saveNote(mockNote);
      })
    ).rejects.toThrow('Database not initialized');
  });

  it('should load existing notes on initialization', async () => {
    // Pre-populate the mock database
    const store = new Map();
    store.set(mockNote.nodeId, mockNote);
    mockIndexedDB.databases.set('notes', store);

    const { result } = renderHook(() => useIndexedDBNotes());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.notes.size).toBe(1);
    expect(result.current.notes.get(mockNote.nodeId)).toEqual(mockNote);
  });
});