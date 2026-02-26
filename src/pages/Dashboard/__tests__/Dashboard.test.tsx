import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '../Dashboard';
import { importFromJSONText } from '../../../utils/exportUtils';
import { apiClient } from '../../../services/apiClient';
import type { MapMetadata } from '../../../types/mindMap';

const mockCreateMap = jest.fn();
const mockNavigate = jest.fn();

const mockMaps: MapMetadata[] = [
  {
    id: 'map-1',
    title: 'Project Ideas',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
    nodeCount: 8,
    syncStatus: 'local',
  },
  {
    id: 'map-2',
    title: 'Study Notes',
    createdAt: '2025-01-03T00:00:00Z',
    updatedAt: '2025-01-04T00:00:00Z',
    nodeCount: 15,
    syncStatus: 'synced',
  },
];

let mockIsAuthenticated = false;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../hooks/useMapMetadata', () => ({
  useMapMetadata: () => ({
    maps: mockMaps,
    loading: false,
    error: null,
    createMap: mockCreateMap,
    renameMap: jest.fn().mockResolvedValue(undefined),
    deleteMap: jest.fn().mockResolvedValue(undefined),
    importMap: jest.fn().mockResolvedValue('imported-1'),
    refreshMaps: jest.fn().mockResolvedValue(undefined),
  }),
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

const mockFetchCloudMaps = jest.fn().mockResolvedValue({ maps: [], plan: 'free', mapCount: 0, mapLimit: 1 });
const mockSaveToCloud = jest.fn().mockResolvedValue(true);
const mockDeleteFromCloud = jest.fn().mockResolvedValue(undefined);
const mockPullMap = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../hooks/useCloudSync', () => ({
  useCloudSync: () => ({
    fetchCloudMaps: mockFetchCloudMaps,
    saveToCloud: mockSaveToCloud,
    deleteFromCloud: mockDeleteFromCloud,
    pullMap: mockPullMap,
    isOnline: true,
  }),
}));

jest.mock('../../../services/apiClient', () => ({
  apiClient: {
    getPlanStatus: jest.fn().mockResolvedValue({ plan: 'free', mapCount: 0, mapLimit: 1 }),
  },
}));

jest.mock('../../../components/ProfileDropdown', () => ({
  ProfileDropdown: () => <div data-testid="profile-dropdown">Profile</div>,
}));

jest.mock('../../../components/UpgradeModal', () => ({
  UpgradeModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="upgrade-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

jest.mock('../../../components/TemplateModal', () => ({
  TemplateModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="template-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

jest.mock('../../../components/HouseAdBanner', () => ({
  HouseAdBanner: () => null,
}));

jest.mock('../../../utils/exportUtils', () => ({
  importFromJSONText: jest.fn().mockReturnValue({
    state: {
      nodes: new Map([['n1', { id: 'n1', text: 'Root' }]]),
      links: [],
    },
    notes: [],
  }),
}));

jest.mock('../MapCard', () => ({
  MapCard: ({ map, onOpen, onSaveToCloud }: { map: any; onOpen: (id: string) => void; onSaveToCloud?: (id: string) => void }) => (
    <div data-testid={`map-card-${map.id}`} onClick={() => onOpen(map.id)}>
      <span>{map.title}</span>
      {onSaveToCloud && <button data-testid={`save-cloud-${map.id}`} onClick={() => onSaveToCloud(map.id)}>Save to Cloud</button>}
    </div>
  ),
}));

describe('Dashboard', () => {
  const renderDashboard = () =>
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated = false;
  });

  it('renders "ThoughtNet" heading', () => {
    renderDashboard();

    expect(screen.getByText('ThoughtNet')).toBeInTheDocument();
  });

  it('"New Map" button is present and calls createMap on click', async () => {
    mockCreateMap.mockResolvedValue('new-map-1');

    renderDashboard();

    const newMapButton = screen.getByText('+ New Map');
    expect(newMapButton).toBeInTheDocument();

    fireEvent.click(newMapButton);

    await waitFor(() => {
      expect(mockCreateMap).toHaveBeenCalledWith('Untitled Map');
    });
  });

  it('"Library" link is present', () => {
    renderDashboard();

    const libraryLink = screen.getByText('Library');
    expect(libraryLink).toBeInTheDocument();
    expect(libraryLink.closest('a')).toHaveAttribute('href', '/library');
  });

  it('"Import JSON" button is present', () => {
    renderDashboard();

    expect(screen.getByText('Import JSON')).toBeInTheDocument();
  });

  it('"Templates" button opens TemplateModal', async () => {
    renderDashboard();

    const templatesButton = screen.getByText('Templates');
    expect(templatesButton).toBeInTheDocument();

    fireEvent.click(templatesButton);

    await waitFor(() => {
      expect(screen.getByTestId('template-modal')).toBeInTheDocument();
    });
  });

  it('map cards render when maps exist', () => {
    renderDashboard();

    expect(screen.getByTestId('map-card-map-1')).toBeInTheDocument();
    expect(screen.getByTestId('map-card-map-2')).toBeInTheDocument();
    expect(screen.getByText('Project Ideas')).toBeInTheDocument();
    expect(screen.getByText('Study Notes')).toBeInTheDocument();
  });

  it('sign in link shown when not authenticated', () => {
    mockIsAuthenticated = false;

    renderDashboard();

    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('shows ProfileDropdown when authenticated', () => {
    mockIsAuthenticated = true;

    renderDashboard();

    expect(screen.getByTestId('profile-dropdown')).toBeInTheDocument();
  });

  it('new map navigates to editor after creation', async () => {
    mockCreateMap.mockResolvedValue('new-map-1');

    renderDashboard();

    fireEvent.click(screen.getByText('+ New Map'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/map/new-map-1');
    });
  });

  it('JSON file import flow reads file, calls importMap, and navigates', async () => {
    renderDashboard();

    const fileInput = document.querySelector('input[type="file"][accept=".json"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    const jsonContent = JSON.stringify({ nodes: [{ id: 'n1', text: 'Root' }], links: [] });
    const file = new File([jsonContent], 'my-map.json', { type: 'application/json' });

    // Mock File.prototype.text to return the JSON content
    Object.defineProperty(file, 'text', {
      value: jest.fn().mockResolvedValue(jsonContent),
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(importFromJSONText).toHaveBeenCalledWith(jsonContent);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/map/imported-1');
    });
  });

  it('cloud save at limit triggers upgrade modal', async () => {
    mockIsAuthenticated = true;

    // Both getPlanStatus and fetchCloudMaps set planInfo — both must return at-limit
    jest.mocked(apiClient.getPlanStatus).mockResolvedValue({ plan: 'free', mapCount: 1, mapLimit: 1 } as any);
    mockFetchCloudMaps.mockResolvedValue({ maps: [], plan: 'free', mapCount: 1, mapLimit: 1 });

    renderDashboard();

    // Wait for plan info to load via both getPlanStatus and fetchCloudMaps
    await waitFor(() => {
      expect(jest.mocked(apiClient.getPlanStatus)).toHaveBeenCalled();
      expect(mockFetchCloudMaps).toHaveBeenCalled();
    });

    // Click "Save to Cloud" on a map card
    const saveButton = await screen.findByTestId('save-cloud-map-1');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId('upgrade-modal')).toBeInTheDocument();
    });
  });

  it('map card click navigates to editor', async () => {
    renderDashboard();

    fireEvent.click(screen.getByTestId('map-card-map-1'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/map/map-1');
    });
  });
});
