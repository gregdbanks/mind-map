import { render, screen, fireEvent } from '@testing-library/react';
import { HouseAdBanner } from '../HouseAdBanner';

// The component picks a message based on new Date().getDate() % messages.length.
// Dashboard messages: [0] = upgrade, [1] = advertise
// Library messages:   [0] = upgrade, [1] = advertise
// We use fake timers to control the date so we deterministically get the upgrade message.

describe('HouseAdBanner', () => {
  const mockOnUpgradeClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders banner when isPro is false', () => {
    render(
      <HouseAdBanner placement="dashboard" isPro={false} onUpgradeClick={mockOnUpgradeClick} />
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('returns null (no render) when isPro is true', () => {
    const { container } = render(
      <HouseAdBanner placement="dashboard" isPro={true} onUpgradeClick={mockOnUpgradeClick} />
    );

    expect(container.innerHTML).toBe('');
  });

  it('returns null when localStorage "houseAdDismissed" is "true"', () => {
    localStorage.setItem('houseAdDismissed', 'true');

    const { container } = render(
      <HouseAdBanner placement="dashboard" isPro={false} onUpgradeClick={mockOnUpgradeClick} />
    );

    expect(container.innerHTML).toBe('');
  });

  it('returns null when localStorage "showHouseAds" is "false"', () => {
    localStorage.setItem('showHouseAds', 'false');

    const { container } = render(
      <HouseAdBanner placement="dashboard" isPro={false} onUpgradeClick={mockOnUpgradeClick} />
    );

    expect(container.querySelector('[role="banner"]')).toBeNull();
  });

  it('clicking dismiss button hides banner and sets localStorage', () => {
    const { container } = render(
      <HouseAdBanner placement="dashboard" isPro={false} onUpgradeClick={mockOnUpgradeClick} />
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();

    const dismissButton = screen.getByLabelText('Dismiss banner');
    fireEvent.click(dismissButton);

    // Banner should be gone
    expect(container.querySelector('[role="banner"]')).toBeNull();
    // localStorage should be set
    expect(localStorage.getItem('houseAdDismissed')).toBe('true');
  });

  it('calls onUpgradeClick when upgrade action button is clicked', () => {
    // Use fake timers set to an even day (day 2 -> 2 % 2 = 0 -> upgrade message)
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-02T12:00:00'));

    render(
      <HouseAdBanner placement="dashboard" isPro={false} onUpgradeClick={mockOnUpgradeClick} />
    );

    const upgradeButton = screen.getByText('Upgrade');
    fireEvent.click(upgradeButton);

    expect(mockOnUpgradeClick).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it('shows different messages for "dashboard" vs "library" placement', () => {
    // Set to an even day so index 0 message is selected for both placements
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-02T12:00:00'));

    const { unmount } = render(
      <HouseAdBanner placement="dashboard" isPro={false} onUpgradeClick={mockOnUpgradeClick} />
    );

    expect(
      screen.getByText('Upgrade to Pro for unlimited cloud saves, version history & more')
    ).toBeInTheDocument();

    unmount();
    localStorage.clear();

    render(
      <HouseAdBanner placement="library" isPro={false} onUpgradeClick={mockOnUpgradeClick} />
    );

    expect(
      screen.getByText('Enjoying the library? Upgrade to Pro to publish unlimited maps')
    ).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('has role="banner" for accessibility', () => {
    render(
      <HouseAdBanner placement="dashboard" isPro={false} onUpgradeClick={mockOnUpgradeClick} />
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
