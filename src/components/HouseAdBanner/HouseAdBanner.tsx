import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import styles from './HouseAdBanner.module.css';

type Placement = 'dashboard' | 'library';

interface HouseAdBannerProps {
  placement: Placement;
  isPro: boolean;
  onUpgradeClick?: () => void;
}

interface BannerMessage {
  text: string;
  action?: { label: string; type: 'upgrade' | 'link'; href?: string };
}

const MESSAGES: Record<Placement, BannerMessage[]> = {
  dashboard: [
    {
      text: 'Upgrade to Pro for unlimited cloud saves, version history & more',
      action: { label: 'Upgrade', type: 'upgrade' },
    },
    {
      text: 'Want to advertise here? Contact us at ads@study.coffee',
      action: { label: 'Contact', type: 'link', href: 'mailto:ads@study.coffee' },
    },
  ],
  library: [
    {
      text: 'Enjoying the library? Upgrade to Pro to publish unlimited maps',
      action: { label: 'Upgrade', type: 'upgrade' },
    },
    {
      text: 'Want to reach our community? Advertise here \u2014 ads@study.coffee',
      action: { label: 'Contact', type: 'link', href: 'mailto:ads@study.coffee' },
    },
  ],
};

const DISMISS_KEY = 'houseAdDismissed';

export const HouseAdBanner: React.FC<HouseAdBannerProps> = ({ placement, isPro, onUpgradeClick }) => {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [featureEnabled, setFeatureEnabled] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem('showHouseAds') === 'false') {
        setFeatureEnabled(false);
      }
    } catch {
      // localStorage unavailable — default to enabled
    }
  }, []);

  // Pick a deterministic message based on the current day so it rotates daily
  const message = useMemo(() => {
    const messages = MESSAGES[placement];
    const dayIndex = new Date().getDate() % messages.length;
    return messages[dayIndex];
  }, [placement]);

  if (isPro || dismissed || !featureEnabled) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // ignore
    }
  };

  const handleAction = () => {
    if (!message.action) return;
    if (message.action.type === 'upgrade' && onUpgradeClick) {
      onUpgradeClick();
    } else if (message.action.type === 'link' && message.action.href) {
      window.open(message.action.href, '_blank', 'noopener');
    }
  };

  return (
    <div className={styles.banner} role="banner">
      <div className={styles.accent} />
      <span className={styles.text}>{message.text}</span>
      {message.action && (
        <button className={styles.actionButton} onClick={handleAction} type="button">
          {message.action.label}
        </button>
      )}
      <button
        className={styles.dismissButton}
        onClick={handleDismiss}
        type="button"
        aria-label="Dismiss banner"
      >
        <X size={14} />
      </button>
    </div>
  );
};
