import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LibraryMapView } from '../LibraryMapView';
import type { LibraryMapFull } from '../../../types/library';

const mockNavigate = jest.fn();
let mockIsAuthenticated = true;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    user: mockIsAuthenticated ? { username: 'testuser', email: 'test@test.com' } : null,
    isLoading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    confirmSignUp: jest.fn(),
    signOut: jest.fn(),
    forgotPassword: jest.fn(),
    confirmPassword: jest.fn(),
  }),
}));

const mockGetLibraryMap = jest.fn();
const mockForkMap = jest.fn();
const mockRateMap = jest.fn();

jest.mock('../../../services/apiClient', () => ({
  apiClient: {
    getLibraryMap: (...args: unknown[]) => mockGetLibraryMap(...args),
    forkMap: (...args: unknown[]) => mockForkMap(...args),
    rateMap: (...args: unknown[]) => mockRateMap(...args),
    getPlanStatus: jest.fn().mockResolvedValue({ plan: 'free', mapCount: 0, mapLimit: 1 }),
  },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  },
}));

jest.mock('../../../components/AdBanner', () => ({
  AdBanner: () => null,
}));

jest.mock('../../../services/syncService', () => ({
  pullMapFromCloud: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../utils/nodeHierarchy', () => ({
  calculateNodeDepths: jest.fn().mockReturnValue(new Map()),
  getNodeVisualProperties: jest.fn().mockReturnValue({
    radius: 20, fillColor: '#fff', strokeColor: '#000', strokeWidth: 2, fontSize: 14, fontWeight: 'normal',
  }),
  getLinkVisualProperties: jest.fn().mockReturnValue({ strokeWidth: 2, opacity: 0.6 }),
}));

jest.mock('../../../utils/hierarchicalLayout', () => ({
  createHierarchicalLayout: jest.fn().mockReturnValue(new Map()),
}));

jest.mock('../../../utils/getNodeDescendants', () => ({
  getAllConnectedNodes: jest.fn().mockReturnValue(new Set()),
}));

jest.mock('../../../components/BackgroundSelector', () => ({
  getBackgroundStyle: jest.fn().mockReturnValue({}),
  getBackgroundColor: jest.fn().mockReturnValue('#ffffff'),
}));

jest.mock('../../../components/RatingWidget', () => ({
  RatingWidget: ({ onRate, disabled }: { onRate?: (r: number) => void; disabled?: boolean }) => (
    <div data-testid="rating-widget">
      <button onClick={() => onRate?.(4)} data-disabled={disabled ? 'true' : 'false'}>Rate</button>
    </div>
  ),
}));

// Mock D3 to avoid JSDOM SVG measurement issues
const makeMockSelection = (): Record<string, jest.Mock> => {
  const sel: Record<string, jest.Mock> = {};
  sel.selectAll = jest.fn().mockReturnValue(sel);
  sel.select = jest.fn().mockReturnValue(sel);
  sel.append = jest.fn().mockReturnValue(sel);
  sel.attr = jest.fn().mockReturnValue(sel);
  sel.style = jest.fn().mockReturnValue(sel);
  sel.on = jest.fn().mockReturnValue(sel);
  sel.text = jest.fn().mockReturnValue(sel);
  sel.call = jest.fn().mockReturnValue(sel);
  sel.remove = jest.fn().mockReturnValue(sel);
  sel.each = jest.fn().mockReturnValue(sel);
  sel.filter = jest.fn().mockReturnValue(sel);
  sel.transition = jest.fn().mockReturnValue(sel);
  return sel;
};

jest.mock('d3', () => ({
  select: jest.fn().mockImplementation(() => makeMockSelection()),
  zoom: jest.fn().mockReturnValue({
    scaleExtent: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    transform: 'mock-transform',
  }),
  zoomIdentity: { translate: jest.fn().mockReturnValue({ scale: jest.fn() }) },
}));

const mockMapData: LibraryMapFull = {
  id: 'lib-1',
  map_id: 'map-1',
  user_id: 'user-1',
  title: 'React Patterns',
  description: 'Common React patterns',
  category: 'technology',
  tags: ['react', 'patterns'],
  node_count: 10,
  rating_avg: 4.2,
  rating_count: 8,
  fork_count: 2,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-02T00:00:00Z',
  author_name: 'JaneDoe',
  data: {
    nodes: [
      { id: 'n1', text: 'Root', x: 0, y: 0, color: '#fff', textColor: '#000' },
    ] as LibraryMapFull['data']['nodes'],
    links: [],
  },
};

describe('LibraryMapView', () => {
  const renderView = () =>
    render(
      <MemoryRouter initialEntries={['/library/lib-1']}>
        <Routes>
          <Route path="/library/:id" element={<LibraryMapView />} />
        </Routes>
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated = true;
    mockGetLibraryMap.mockResolvedValue(mockMapData);
  });

  it('shows loading state while fetching', () => {
    // Make getLibraryMap hang
    mockGetLibraryMap.mockReturnValue(new Promise(() => {}));

    renderView();

    expect(screen.getByText('Loading mind map...')).toBeInTheDocument();
  });

  it('shows error state on fetch failure', async () => {
    mockGetLibraryMap.mockRejectedValue(new Error('Network error'));

    renderView();

    await waitFor(() => {
      expect(screen.getByText('Failed to load mind map.')).toBeInTheDocument();
    });
  });

  it('renders map title and metadata after loading', async () => {
    renderView();

    await waitFor(() => {
      expect(screen.getByText('React Patterns')).toBeInTheDocument();
    });

    expect(screen.getByText('by JaneDoe')).toBeInTheDocument();
    expect(screen.getByText('10 nodes')).toBeInTheDocument();
  });

  it('fork button is present and calls apiClient.forkMap on click', async () => {
    mockForkMap.mockResolvedValue({ id: 'forked-1' });

    renderView();

    await waitFor(() => {
      expect(screen.getByText('Fork')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Fork'));

    await waitFor(() => {
      expect(mockForkMap).toHaveBeenCalledWith('lib-1');
    });
  });

  it('rating widget is present', async () => {
    renderView();

    await waitFor(() => {
      expect(screen.getByTestId('rating-widget')).toBeInTheDocument();
    });
  });

  it('back/browse link is present', async () => {
    renderView();

    await waitFor(() => {
      expect(screen.getByText('Browse Library')).toBeInTheDocument();
    });
  });

  it('navigates to login when unauthenticated user clicks fork', async () => {
    mockIsAuthenticated = false;

    renderView();

    await waitFor(() => {
      expect(screen.getByText('Fork')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Fork'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    expect(mockForkMap).not.toHaveBeenCalled();
  });

  it('displays description and category after loading', async () => {
    renderView();

    await waitFor(() => {
      expect(screen.getByText('Common React patterns')).toBeInTheDocument();
    });

    expect(screen.getByText('technology')).toBeInTheDocument();
  });

  it('displays tags after loading', async () => {
    renderView();

    await waitFor(() => {
      expect(screen.getByText('react')).toBeInTheDocument();
    });

    expect(screen.getByText('patterns')).toBeInTheDocument();
  });

  it('rating submission calls rateMap', async () => {
    mockRateMap.mockResolvedValue({ rating_avg: 4.1, rating_count: 9 });

    renderView();

    await waitFor(() => {
      expect(screen.getByTestId('rating-widget')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Rate'));

    await waitFor(() => {
      expect(mockRateMap).toHaveBeenCalledWith('lib-1', 4);
    });
  });

  it('unauthenticated user rating redirects to login', async () => {
    mockIsAuthenticated = false;

    renderView();

    await waitFor(() => {
      expect(screen.getByTestId('rating-widget')).toBeInTheDocument();
    });

    // Verify the widget signals disabled state to the real RatingWidget
    expect(screen.getByText('Rate')).toHaveAttribute('data-disabled', 'true');

    // Click fires onRate which calls handleRate; the auth guard in handleRate redirects
    fireEvent.click(screen.getByText('Rate'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    expect(mockRateMap).not.toHaveBeenCalled();
  });

  it('fork navigates to editor after success', async () => {
    mockForkMap.mockResolvedValue({ id: 'forked-1' });

    renderView();

    await waitFor(() => {
      expect(screen.getByText('Fork')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Fork'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/map/forked-1');
    });
  });
});
