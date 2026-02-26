import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UpgradeModal } from '../UpgradeModal';

// Mock apiClient
const mockCreateCheckout = jest.fn();
const mockGetPlanStatus = jest.fn();

jest.mock('../../../services/apiClient', () => ({
  apiClient: {
    createCheckout: (...args: unknown[]) => mockCreateCheckout(...args),
    getPlanStatus: (...args: unknown[]) => mockGetPlanStatus(...args),
  },
}));

describe('UpgradeModal', () => {
  const mockOnClose = jest.fn();

  const renderModal = (overrides: Record<string, unknown> = {}) =>
    render(<UpgradeModal onClose={mockOnClose} {...overrides} />);

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPlanStatus.mockResolvedValue({
      plan: 'free',
      mapCount: 0,
      mapLimit: 1,
      hasStripeCustomer: false,
      monthlyPriceId: 'price_monthly_123',
      annualPriceId: 'price_annual_456',
    });
    // Prevent actual navigation by mocking window.location.href setter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).location;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).location = { href: '', origin: 'http://localhost' };
  });

  afterEach(() => {
    // Restore window.location
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).location;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).location = globalThis.location;
  });

  it('renders upgrade heading/title', async () => {
    renderModal();

    expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();

    // Wait for plan status to load
    await waitFor(() => {
      expect(mockGetPlanStatus).toHaveBeenCalled();
    });
  });

  it('shows pricing options (monthly and annual)', async () => {
    renderModal();

    await waitFor(() => {
      expect(screen.getByText('Annual')).toBeInTheDocument();
    });

    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('$24/yr')).toBeInTheDocument();
    expect(screen.getByText('$3/mo')).toBeInTheDocument();
  });

  it('clicking upgrade calls apiClient.createCheckout with correct priceId', async () => {
    mockCreateCheckout.mockResolvedValue({ url: 'https://checkout.stripe.com/session123' });

    renderModal();

    await waitFor(() => {
      expect(screen.getByText('Annual')).toBeInTheDocument();
    });

    // Annual is selected by default, click upgrade
    const upgradeButton = screen.getByText(/Upgrade to Pro/i, { selector: 'button' });
    fireEvent.click(upgradeButton);

    await waitFor(() => {
      expect(mockCreateCheckout).toHaveBeenCalledWith('price_annual_456');
    });
  });

  it('selecting monthly then clicking upgrade uses monthly priceId', async () => {
    mockCreateCheckout.mockResolvedValue({ url: 'https://checkout.stripe.com/session456' });

    renderModal();

    await waitFor(() => {
      expect(screen.getByText('Monthly')).toBeInTheDocument();
    });

    // Switch to monthly
    fireEvent.click(screen.getByText('Monthly'));

    const upgradeButton = screen.getByText(/Upgrade to Pro/i, { selector: 'button' });
    fireEvent.click(upgradeButton);

    await waitFor(() => {
      expect(mockCreateCheckout).toHaveBeenCalledWith('price_monthly_123');
    });
  });

  it('close button calls onClose', async () => {
    renderModal();

    const cancelButton = screen.getByText('Not now');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state during checkout creation', async () => {
    // Make createCheckout hang so we observe the loading state
    mockCreateCheckout.mockReturnValue(new Promise(() => {}));

    renderModal();

    await waitFor(() => {
      expect(screen.getByText('Annual')).toBeInTheDocument();
    });

    const upgradeButton = screen.getByText(/Upgrade to Pro/i, { selector: 'button' });
    fireEvent.click(upgradeButton);

    await waitFor(() => {
      expect(screen.getByText('Redirecting...')).toBeInTheDocument();
    });
  });

  it('handles error from createCheckout', async () => {
    mockCreateCheckout.mockRejectedValue(new Error('Payment failed'));

    renderModal();

    await waitFor(() => {
      expect(screen.getByText('Annual')).toBeInTheDocument();
    });

    const upgradeButton = screen.getByText(/Upgrade to Pro/i, { selector: 'button' });
    fireEvent.click(upgradeButton);

    // After error, the button should re-enable (not stuck in loading state)
    await waitFor(() => {
      expect(screen.getByText(/Upgrade to Pro/i, { selector: 'button' })).not.toBeDisabled();
    });
  });
});
