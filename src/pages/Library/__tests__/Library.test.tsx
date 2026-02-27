import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Library } from '../Library';
import type { LibraryMapSummary, LibraryPagination } from '../../../types/library';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockSetSearch = jest.fn();
const mockSetSort = jest.fn();
const mockSetCategory = jest.fn();
const mockSetPage = jest.fn();

const defaultPagination: LibraryPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
};

const mockMaps: LibraryMapSummary[] = [
  {
    id: 'lib-1',
    map_id: 'map-1',
    user_id: 'user-1',
    title: 'React Fundamentals',
    description: 'Core React concepts',
    category: 'technology',
    tags: ['react', 'javascript'],
    node_count: 15,
    rating_avg: 4.5,
    rating_count: 10,
    fork_count: 3,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
    author_name: 'JaneDoe',
  },
  {
    id: 'lib-2',
    map_id: 'map-2',
    user_id: 'user-2',
    title: 'Biology 101',
    description: 'Introduction to biology',
    category: 'science',
    tags: ['biology'],
    node_count: 20,
    rating_avg: 0,
    rating_count: 0,
    fork_count: 0,
    created_at: '2025-01-03T00:00:00Z',
    updated_at: '2025-01-04T00:00:00Z',
    author_name: null,
  },
];

let mockUseLibraryReturn: Record<string, unknown> = {};

jest.mock('../../../hooks/useLibrary', () => ({
  useLibrary: () => mockUseLibraryReturn,
}));

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    isLoading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    confirmSignUp: jest.fn(),
    signOut: jest.fn(),
    forgotPassword: jest.fn(),
    confirmPassword: jest.fn(),
  }),
}));

jest.mock('../../../services/apiClient', () => ({
  apiClient: {
    getPlanStatus: jest.fn().mockResolvedValue({ plan: 'free', mapCount: 0, mapLimit: 1 }),
    browseLibrary: jest.fn().mockResolvedValue({ maps: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
  },
}));

jest.mock('../../../components/ProfileDropdown', () => ({
  ProfileDropdown: () => <div data-testid="profile-dropdown">Profile</div>,
}));

jest.mock('../../../components/AdBanner', () => ({
  AdBanner: () => null,
}));

describe('Library', () => {
  const renderLibrary = () =>
    render(
      <MemoryRouter initialEntries={['/library']}>
        <Library />
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLibraryReturn = {
      maps: mockMaps,
      pagination: defaultPagination,
      loading: false,
      error: null,
      sort: 'newest',
      category: '',
      search: '',
      setPage: mockSetPage,
      setSort: mockSetSort,
      setCategory: mockSetCategory,
      setSearch: mockSetSearch,
    };
  });

  it('renders Library heading', () => {
    renderLibrary();

    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderLibrary();

    expect(screen.getByPlaceholderText('Search mind maps...')).toBeInTheDocument();
  });

  it('renders category filter dropdown with "All Categories" option', () => {
    renderLibrary();

    expect(screen.getByText('All Categories')).toBeInTheDocument();
  });

  it('renders sort dropdown with sort options', () => {
    renderLibrary();

    expect(screen.getByText('Newest')).toBeInTheDocument();
  });

  it('renders map cards from hook data', () => {
    renderLibrary();

    expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('Biology 101')).toBeInTheDocument();
  });

  it('renders pagination controls when totalPages > 1', () => {
    mockUseLibraryReturn = {
      ...mockUseLibraryReturn,
      pagination: { page: 1, limit: 20, total: 50, totalPages: 3 },
    };

    renderLibrary();

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('does not render pagination when totalPages is 1', () => {
    renderLibrary();

    expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  it('shows empty state when no maps', () => {
    mockUseLibraryReturn = {
      ...mockUseLibraryReturn,
      maps: [],
    };

    renderLibrary();

    expect(screen.getByText('No mind maps found')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseLibraryReturn = {
      ...mockUseLibraryReturn,
      loading: true,
    };

    renderLibrary();

    expect(screen.getByText('Loading library...')).toBeInTheDocument();
  });

  it('calls setSearch when typing in the search input', () => {
    renderLibrary();

    const searchInput = screen.getByPlaceholderText('Search mind maps...');
    fireEvent.change(searchInput, { target: { value: 'react' } });

    expect(mockSetSearch).toHaveBeenCalledWith('react');
  });

  it('calls setCategory when selecting a category', () => {
    renderLibrary();

    const categorySelect = screen.getByDisplayValue('All Categories');
    fireEvent.change(categorySelect, { target: { value: 'technology' } });

    expect(mockSetCategory).toHaveBeenCalledWith('technology');
  });

  it('calls setSort when changing sort selection', () => {
    renderLibrary();

    const sortSelect = screen.getByDisplayValue('Newest');
    fireEvent.change(sortSelect, { target: { value: 'top-rated' } });

    expect(mockSetSort).toHaveBeenCalledWith('top-rated');
  });

  it('calls setPage(2) when clicking Next', () => {
    mockUseLibraryReturn = {
      ...mockUseLibraryReturn,
      pagination: { page: 1, limit: 20, total: 50, totalPages: 3 },
    };

    renderLibrary();

    fireEvent.click(screen.getByText('Next'));

    expect(mockSetPage).toHaveBeenCalledWith(2);
  });

  it('calls setPage with decremented value when clicking Previous', () => {
    mockUseLibraryReturn = {
      ...mockUseLibraryReturn,
      pagination: { page: 2, limit: 20, total: 50, totalPages: 3 },
    };

    renderLibrary();

    fireEvent.click(screen.getByText('Previous'));

    expect(mockSetPage).toHaveBeenCalledWith(1);
  });

  it('navigates to /library/{map.id} when clicking a map card', () => {
    renderLibrary();

    fireEvent.click(screen.getByText('React Fundamentals'));

    expect(mockNavigate).toHaveBeenCalledWith('/library/lib-1');
  });

  it('shows Sign in link when user is not authenticated', () => {
    renderLibrary();

    const signInLink = screen.getByText('Sign in');
    expect(signInLink).toBeInTheDocument();
    expect(signInLink.closest('a')).toHaveAttribute('href', '/login');
  });
});
