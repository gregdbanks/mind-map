import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileDropdown } from '../ProfileDropdown';

const mockSignOut = jest.fn();
const mockGetPlanStatus = jest.fn();
const mockCreatePortal = jest.fn();
const mockCreateCheckout = jest.fn();

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'testuser', email: 'test@example.com' },
    signOut: mockSignOut,
  }),
}));

jest.mock('../../../services/apiClient', () => ({
  apiClient: {
    getPlanStatus: (...args: unknown[]) => mockGetPlanStatus(...args),
    createPortal: (...args: unknown[]) => mockCreatePortal(...args),
    createCheckout: (...args: unknown[]) => mockCreateCheckout(...args),
  },
}));

describe('ProfileDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPlanStatus.mockResolvedValue({
      plan: 'free',
      mapCount: 0,
      mapLimit: 1,
      monthlyPriceId: 'price_monthly_123',
    });
  });

  it('renders avatar button', () => {
    render(<ProfileDropdown />);

    expect(screen.getByTitle('test@example.com')).toBeInTheDocument();
  });

  it('opens dropdown when avatar is clicked', async () => {
    render(<ProfileDropdown />);

    fireEvent.click(screen.getByTitle('test@example.com'));

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('sign out button calls signOut', async () => {
    render(<ProfileDropdown />);

    fireEvent.click(screen.getByTitle('test@example.com'));

    await waitFor(() => {
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Sign out'));

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('shows "Upgrade to Pro" for free users', async () => {
    render(<ProfileDropdown />);

    fireEvent.click(screen.getByTitle('test@example.com'));

    await waitFor(() => {
      expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
    });
  });

  it('shows "Manage subscription" for pro users', async () => {
    mockGetPlanStatus.mockResolvedValue({
      plan: 'pro',
      mapCount: 5,
      mapLimit: null,
    });

    render(<ProfileDropdown />);

    // Wait for plan status to resolve and re-render
    await waitFor(() => {
      expect(mockGetPlanStatus).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByTitle('test@example.com'));

    await waitFor(() => {
      expect(screen.getByText('Manage subscription')).toBeInTheDocument();
    });
  });

  it('closes dropdown when clicking outside', async () => {
    const { container } = render(<ProfileDropdown />);

    fireEvent.click(screen.getByTitle('test@example.com'));

    await waitFor(() => {
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });

    // Click outside the dropdown
    fireEvent.mouseDown(container.parentElement!);

    await waitFor(() => {
      expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
    });
  });
});
