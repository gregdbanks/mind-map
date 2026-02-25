import React, { useEffect, useState } from 'react';
import { Clock, RotateCcw, X, Eye } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import type { VersionMeta } from '../../types/versions';
import styles from './VersionHistoryPanel.module.css';

interface VersionHistoryPanelProps {
  mapId: string;
  onClose: () => void;
  onPreview: (versionId: string) => void;
  onRestore: (versionId: string) => void;
  previewingVersionId?: string | null;
}

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  mapId,
  onClose,
  onPreview,
  onRestore,
  previewingVersionId,
}) => {
  const [versions, setVersions] = useState<VersionMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const data = await apiClient.getVersions(mapId);
        setVersions(data.versions);
      } catch {
        setError('Failed to load version history.');
      } finally {
        setLoading(false);
      }
    };
    fetchVersions();
  }, [mapId]);

  const handleRestore = async (versionId: string) => {
    if (!confirm('Restore this version? Your current state will be saved as a new version first.')) return;
    setRestoringId(versionId);
    try {
      await onRestore(versionId);
    } finally {
      setRestoringId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Clock size={16} />
          <span>Version History</span>
        </div>
        <button className={styles.closeButton} onClick={onClose} title="Close">
          <X size={16} />
        </button>
      </div>

      <div className={styles.body}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>Loading versions...</span>
          </div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : versions.length === 0 ? (
          <div className={styles.empty}>
            <Clock size={32} className={styles.emptyIcon} />
            <p>No version history yet.</p>
            <p className={styles.emptyHint}>Versions are created automatically when you save changes.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {versions.map((version) => (
              <div
                key={version.id}
                className={`${styles.versionItem} ${previewingVersionId === version.id ? styles.previewing : ''}`}
              >
                <div className={styles.versionInfo}>
                  <span className={styles.versionNumber}>v{version.version_number}</span>
                  <span className={styles.versionDate}>{formatDate(version.created_at)}</span>
                </div>
                <div className={styles.versionMeta}>
                  <span className={styles.versionTitle}>{version.title}</span>
                  <span className={styles.versionNodes}>{version.node_count} nodes</span>
                </div>
                <div className={styles.versionActions}>
                  <button
                    className={`${styles.actionButton} ${styles.previewButton}`}
                    onClick={() => onPreview(previewingVersionId === version.id ? '' : version.id)}
                    title={previewingVersionId === version.id ? 'Exit preview' : 'Preview this version'}
                  >
                    <Eye size={14} />
                    {previewingVersionId === version.id ? 'Exit' : 'Preview'}
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.restoreButton}`}
                    onClick={() => handleRestore(version.id)}
                    disabled={restoringId !== null}
                    title="Restore this version"
                  >
                    <RotateCcw size={14} />
                    {restoringId === version.id ? 'Restoring...' : 'Restore'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
