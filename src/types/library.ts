export interface LibraryMapSummary {
  id: string;
  map_id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  node_count: number;
  rating_avg: number;
  rating_count: number;
  fork_count: number;
  created_at: string;
  updated_at: string;
  author_name: string | null;
}

export interface LibraryMapFull extends LibraryMapSummary {
  data: {
    nodes: import('./mindMap').Node[];
    links: import('./mindMap').Link[];
    notes?: import('./sync').SerializedNote[];
    canvasBackground?: string;
  };
}

export interface LibraryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BrowseLibraryResponse {
  maps: LibraryMapSummary[];
  pagination: LibraryPagination;
}

export interface CategoriesResponse {
  categories: Array<{ category: string; count: number }>;
}

export interface PublishMapPayload {
  mapId: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
}

export interface RateMapResponse {
  rating: number;
  rating_avg: number;
  rating_count: number;
}

export type LibrarySortOption = 'newest' | 'oldest' | 'top-rated' | 'most-forked';

export const LIBRARY_CATEGORIES = [
  { value: 'study', label: 'Study' },
  { value: 'business', label: 'Business' },
  { value: 'technology', label: 'Technology' },
  { value: 'science', label: 'Science' },
  { value: 'creative', label: 'Creative' },
  { value: 'planning', label: 'Planning' },
  { value: 'other', label: 'Other' },
] as const;

export const LIBRARY_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'top-rated', label: 'Top Rated' },
  { value: 'most-forked', label: 'Most Forked' },
] as const;
