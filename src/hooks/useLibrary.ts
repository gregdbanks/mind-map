import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import type { LibraryMapSummary, LibraryPagination, LibrarySortOption } from '../types/library';

export function useLibrary() {
  const location = useLocation();
  const navigate = useNavigate();
  const [maps, setMaps] = useState<LibraryMapSummary[]>([]);
  const [pagination, setPagination] = useState<LibraryPagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fetchingRef = useRef(false);

  // Derive stable values from location.search (a primitive string)
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const page = parseInt(params.get('page') || '1', 10);
  const sort = (params.get('sort') || 'newest') as LibrarySortOption;
  const category = params.get('category') || '';
  const search = params.get('search') || '';

  const fetchMaps = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.browseLibrary({
        page,
        sort,
        category: category || undefined,
        search: search || undefined,
      });
      setMaps(result.maps);
      setPagination(result.pagination);
    } catch {
      setError('Failed to load library. Please try again.');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [page, sort, category, search]);

  useEffect(() => {
    fetchMaps();
  }, [fetchMaps]);

  const updateParams = useCallback((updater: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(location.search);
    updater(next);
    navigate(`${location.pathname}?${next.toString()}`, { replace: true });
  }, [location.search, location.pathname, navigate]);

  const setPage = useCallback((p: number) => {
    updateParams((params) => params.set('page', String(p)));
  }, [updateParams]);

  const setSort = useCallback((s: LibrarySortOption) => {
    updateParams((params) => {
      params.set('sort', s);
      params.delete('page');
    });
  }, [updateParams]);

  const setCategory = useCallback((c: string) => {
    updateParams((params) => {
      if (c) {
        params.set('category', c);
      } else {
        params.delete('category');
      }
      params.delete('page');
    });
  }, [updateParams]);

  const setSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams((params) => {
        if (q.trim()) {
          params.set('search', q.trim());
        } else {
          params.delete('search');
        }
        params.delete('page');
      });
    }, 300);
  }, [updateParams]);

  return {
    maps,
    pagination,
    loading,
    error,
    page,
    sort,
    category,
    search,
    setPage,
    setSort,
    setCategory,
    setSearch,
    refresh: fetchMaps,
  };
}
