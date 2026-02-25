import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import type { LibraryMapSummary, LibraryPagination, LibrarySortOption } from '../types/library';

export function useLibrary() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [maps, setMaps] = useState<LibraryMapSummary[]>([]);
  const [pagination, setPagination] = useState<LibraryPagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const sort = (searchParams.get('sort') || 'newest') as LibrarySortOption;
  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';

  const fetchMaps = useCallback(async () => {
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
    }
  }, [page, sort, category, search]);

  useEffect(() => {
    fetchMaps();
  }, [fetchMaps]);

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(p));
    setSearchParams(params, { replace: true });
  };

  const setSort = (s: LibrarySortOption) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', s);
    params.delete('page');
    setSearchParams(params, { replace: true });
  };

  const setCategory = (c: string) => {
    const params = new URLSearchParams(searchParams);
    if (c) {
      params.set('category', c);
    } else {
      params.delete('category');
    }
    params.delete('page');
    setSearchParams(params, { replace: true });
  };

  const setSearch = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (q.trim()) {
        params.set('search', q.trim());
      } else {
        params.delete('search');
      }
      params.delete('page');
      setSearchParams(params, { replace: true });
    }, 300);
  };

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
