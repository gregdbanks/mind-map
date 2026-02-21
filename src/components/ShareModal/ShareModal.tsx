import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../services/apiClient';
import type { ShareStatus } from '../../types/sharing';
import styles from './ShareModal.module.css';

interface ShareModalProps {
  mapId: string;
  onClose: () => void;
}

const SHARE_BASE_URL = window.location.origin;

export const ShareModal: React.FC<ShareModalProps> = ({ mapId, onClose }) => {
  const [shareStatus, setShareStatus] = useState<ShareStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const status = await apiClient.getShareStatus(mapId);
      setShareStatus(status);
      setError(null);
    } catch {
      setError('Failed to load share status');
    } finally {
      setLoading(false);
    }
  }, [mapId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleToggle = async () => {
    if (toggling || !shareStatus) return;
    setToggling(true);
    setError(null);

    try {
      if (shareStatus.is_public) {
        await apiClient.unshareMap(mapId);
        setShareStatus({ ...shareStatus, is_public: false });
      } else {
        const result = await apiClient.shareMap(mapId);
        setShareStatus({
          is_public: true,
          share_token: result.share_token,
          shared_at: result.shared_at,
        });
      }
    } catch {
      setError('Failed to update sharing. Please try again.');
    } finally {
      setToggling(false);
    }
  };

  const shareUrl = shareStatus?.share_token
    ? `${SHARE_BASE_URL}/shared/${shareStatus.share_token}`
    : '';

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.querySelector(`.${styles.urlInput}`) as HTMLInputElement;
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Share Mind Map</h2>
          <button className={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>

        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleLabel}>Public sharing</div>
            <div className={styles.toggleDescription}>
              Anyone with the link can view this map
            </div>
          </div>
          <button
            className={`${styles.toggle} ${shareStatus?.is_public ? styles.active : ''} ${toggling || loading ? styles.loading : ''}`}
            onClick={handleToggle}
            disabled={toggling || loading}
          >
            <div className={styles.toggleKnob} />
          </button>
        </div>

        {shareStatus?.is_public && shareStatus.share_token ? (
          <div className={styles.urlSection}>
            <div className={styles.urlLabel}>Share link</div>
            <div className={styles.urlRow}>
              <input
                className={styles.urlInput}
                value={shareUrl}
                readOnly
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
                onClick={handleCopy}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        ) : !loading && !shareStatus?.is_public ? (
          <div className={styles.disabledSection}>
            <p className={styles.disabledText}>
              Enable sharing to generate a public link
            </p>
          </div>
        ) : null}

        {error && <div className={styles.error}>{error}</div>}
      </div>
    </div>
  );
};
