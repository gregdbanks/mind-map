import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

// Mock the migration hook
jest.mock('../hooks/useMigration', () => ({
  useMigration: () => ({ migrating: false }),
}));

// Mock the dashboard
jest.mock('../pages/Dashboard', () => ({
  Dashboard: () => <div data-testid="dashboard">Dashboard</div>,
}));

// Mock the editor
jest.mock('../pages/Editor', () => ({
  Editor: () => <div data-testid="editor">Editor</div>,
}));

// Mock the shared map viewer (uses apiClient which needs import.meta.env)
jest.mock('../pages/SharedMap/SharedMap', () => ({
  SharedMap: () => <div data-testid="shared-map">SharedMap</div>,
}));

// Mock auth pages
jest.mock('../pages/Login', () => ({
  Login: () => <div data-testid="login">Login</div>,
}));

jest.mock('../pages/Signup', () => ({
  Signup: () => <div data-testid="signup">Signup</div>,
}));

jest.mock('../pages/ForgotPassword', () => ({
  ForgotPassword: () => <div data-testid="forgot-password">ForgotPassword</div>,
}));

describe('App', () => {
  it('should render dashboard at root route', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });
  });

  it('should render editor at /map/:mapId route', async () => {
    render(
      <MemoryRouter initialEntries={['/map/test-map-123']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('editor')).toBeInTheDocument();
    });
  });

  it('should show loading while migration is in progress', () => {
    jest.resetModules();
    jest.doMock('../hooks/useMigration', () => ({
      useMigration: () => ({ migrating: true }),
    }));

    // Re-import App with the new mock
    const { default: AppWithMigration } = jest.requireActual('../App');
    render(
      <MemoryRouter>
        <AppWithMigration />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
