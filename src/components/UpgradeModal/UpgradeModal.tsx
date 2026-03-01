import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { analytics } from '../../services/analytics';
import styles from './UpgradeModal.module.css';

interface UpgradeModalProps {
  title?: string;
  description?: string;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  title = 'Upgrade to Pro',
  description = 'Save your mind maps to the cloud and access them from any device. Pro members get unlimited cloud saves, premium exports, and sharing.',
  onClose,
}) => {
  const [upgrading, setUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  const [priceIds, setPriceIds] = useState<{ monthlyPriceId?: string; annualPriceId?: string }>({});

  useEffect(() => {
    apiClient.getPlanStatus().then((status) => {
      setPriceIds({ monthlyPriceId: status.monthlyPriceId, annualPriceId: status.annualPriceId });
      if (!status.annualPriceId) {
        setSelectedPlan('monthly');
      }
    }).catch(() => {});
  }, []);

  const activePriceId = selectedPlan === 'annual' ? priceIds.annualPriceId : priceIds.monthlyPriceId;

  const handleUpgrade = async () => {
    if (!activePriceId) return;
    setUpgrading(true);
    analytics.checkoutStart(selectedPlan || 'monthly');
    try {
      const { url } = await apiClient.createCheckout(activePriceId!);
      window.location.href = url;
    } catch {
      setUpgrading(false);
    }
  };

  const hasAnnual = !!priceIds.annualPriceId;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p>{description}</p>

        {hasAnnual ? (
          <div className={styles.planOptions}>
            <button
              className={`${styles.planOption} ${selectedPlan === 'annual' ? styles.planOptionSelected : ''}`}
              onClick={() => setSelectedPlan('annual')}
            >
              <span className={styles.planName}>Annual</span>
              <span className={styles.planPrice}>$40/yr</span>
              <span className={styles.planSaving}>Save 33%</span>
              <span className={styles.recommended}>Recommended</span>
            </button>
            <button
              className={`${styles.planOption} ${selectedPlan === 'monthly' ? styles.planOptionSelected : ''}`}
              onClick={() => setSelectedPlan('monthly')}
            >
              <span className={styles.planName}>Monthly</span>
              <span className={styles.planPrice}>$5/mo</span>
            </button>
          </div>
        ) : null}

        <div className={styles.actions}>
          <button className={styles.upgradeButton} onClick={handleUpgrade} disabled={upgrading || !activePriceId}>
            {upgrading ? 'Redirecting...' : hasAnnual
              ? `Upgrade to Pro — ${selectedPlan === 'annual' ? '$40/yr' : '$5/mo'}`
              : 'Upgrade to Pro — $5/mo'}
          </button>
          <button className={styles.cancelButton} onClick={onClose}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
};
