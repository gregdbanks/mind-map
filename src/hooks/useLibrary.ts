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
  const abortRef = useRef<AbortController | null>(null);
  const locationRef = useRef(location);
  locationRef.current = location;

  // Derive stable values from location.search (a primitive string)
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const rawPage = params.get('page');
  const parsedPage = rawPage !== null ? parseInt(rawPage, 10) : 1;
  const page = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const sort = (params.get('sort') || 'newest') as LibrarySortOption;
  const category = params.get('category') || '';
  const search = params.get('search') || '';

  useEffect(() => {
    // Cancel any in-flight request when params change
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    apiClient.browseLibrary({
      page,
      sort,
      category: category || undefined,
      search: search || undefined,
    }).then((result) => {
      if (controller.signal.aborted) return;
      setMaps(result.maps);
      setPagination(result.pagination);
    }).catch(() => {
      if (controller.signal.aborted) return;
      setError('Failed to load library. Please try again.');
    }).finally(() => {
      if (controller.signal.aborted) return;
      setLoading(false);
    });

    return () => { controller.abort(); };
  }, [page, sort, category, search]);

  // Read latest location from ref so debounced callbacks never use stale search params
  const updateParams = useCallback((updater: (p: URLSearchParams) => void) => {
    const loc = locationRef.current;
    const next = new URLSearchParams(loc.search);
    updater(next);
    navigate(`${loc.pathname}?${next.toString()}`, { replace: true });
  }, [navigate]);

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

  const refresh = useCallback(() => {
    // Force re-fetch by navigating to same URL (triggers location.search change detection)
    const loc = locationRef.current;
    navigate(`${loc.pathname}${loc.search}`, { replace: true });
  }, [navigate]);

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
    refresh,
  };
}
