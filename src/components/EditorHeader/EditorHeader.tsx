import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Share2, BookOpen, Clock, Users } from 'lucide-react';
import { useMapTitle } from '../../hooks/useMapTitle';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/apiClient';
import { ShareModal } from '../ShareModal/ShareModal';
import { UpgradeModal } from '../UpgradeModal';
import { PublishModal } from '../PublishModal';
import { PresencePanel } from '../PresencePanel';
import { ConnectionIndicator } from '../ConnectionIndicator';
import { CollabInviteModal } from '../CollabInviteModal';
import type { CollabUser } from '../../services/collabSocket';
import styles from './EditorHeader.module.css';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'syncing' | 'synced' | 'sync-error' | 'offline';

interface EditorHeaderProps {
  mapId: string;
  saveStatus: SaveStatus;
  isPro?: boolean;
  isAtCloudLimit?: boolean;
  onToggleHistory?: () => void;
  showingHistory?: boolean;
  collabUsers?: CollabUser[];
  collabConnected?: boolean;
  collabConnecting?: boolean;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({ mapId, saveStatus, isPro = false, isAtCloudLimit = false, onToggleHistory, showingHistory = false, collabUsers, collabConnected, collabConnecting }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { title, loading: titleLoading, rename } = useMapTitle(mapId);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishedMapId, setPublishedMapId] = useState<string | undefined>();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditValue(title);
    setIsEditing(true);
  };

  const handleSave = async () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) {
      await rename(trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const showStatus = saveStatus !== 'idle';

  return (
    <>
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => navigate('/')}
          title="Back to Dashboard"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft size={18} />
        </button>

        <div className={styles.titleSection}>
          {titleLoading ? null : isEditing ? (
            <input
              ref={inputRef}
              className={styles.titleInput}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <span
              className={styles.title}
              onClick={handleStartEdit}
              title="Click to rename"
            >
              {title}
            </span>
          )}
        </div>

        <div
          className={`${styles.saveStatus} ${showStatus ? styles.saveStatusVisible : styles.saveStatusHidden}`}
        >
          {saveStatus === 'saving' && <span className={styles.statusText}>Saving...</span>}
          {saveStatus === 'saved' && (
            <span
              className={styles.clickableStatus}
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login');
                } else if (isAtCloudLimit && !isPro) {
                  setShowUpgradeModal(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!isAuthenticated) {
                    navigate('/login');
                  } else if (isAtCloudLimit && !isPro) {
                    setShowUpgradeModal(true);
                  }
                }
              }}
              role={!isAuthenticated || (isAtCloudLimit && !isPro) ? 'button' : undefined}
              tabIndex={!isAuthenticated || (isAtCloudLimit && !isPro) ? 0 : undefined}
            >
              <Check size={14} className={styles.checkIcon} />
              <span className={styles.statusText}>Saved locally</span>
            </span>
          )}
          {saveStatus === 'syncing' && <span className={styles.statusText}>Syncing...</span>}
          {saveStatus === 'synced' && (
            <>
              <Check size={14} className={styles.cloudCheckIcon} />
              <span className={styles.statusText}>Synced</span>
            </>
          )}
          {saveStatus === 'sync-error' && (
            <span className={`${styles.syncError} ${styles.statusText}`}>Cloud sync failed</span>
          )}
          {saveStatus === 'offline' && (
            <span className={`${styles.offlineStatus} ${styles.statusText}`}>Offline — saved locally</span>
          )}
        </div>

        <PresencePanel
          users={collabUsers || []}
          isConnected={collabConnected || false}
          isConnecting={collabConnecting || false}
        />

        <ConnectionIndicator
          isConnected={collabConnected || false}
          isConnecting={collabConnecting || false}
        />

        {isAuthenticated && (
          <div className={styles.actionButtons}>
            <button
              className={styles.shareButton}
              onClick={() => {
                if (isPro) {
                  setShowInviteModal(true);
                } else {
                  setShowUpgradeModal(true);
                }
              }}
              title="Invite Collaborators"
              aria-label="Invite collaborators"
            >
              <Users size={16} />
            </button>

            <button
              className={styles.shareButton}
              onClick={() => {
                if (isPro) {
                  setShowShareModal(true);
                } else {
                  setShowUpgradeModal(true);
                }
              }}
              title="Share"
              aria-label="Share mind map"
            >
              <Share2 size={16} />
            </button>

            <button
              className={styles.shareButton}
              onClick={async () => {
                try {
                  const status = await apiClient.getPublishStatus(mapId);
                  setPublishedMapId(status.published ? status.publishedMapId : undefined);
                } catch {
                  setPublishedMapId(undefined);
                }
                setShowPublishModal(true);
              }}
              title="Publish to Library"
              aria-label="Publish to library"
            >
              <BookOpen size={16} />
            </button>

            <button
              className={`${styles.shareButton} ${showingHistory ? styles.historyActive : ''}`}
              onClick={() => {
                if (isPro) {
                  onToggleHistory?.();
                } else {
                  setShowUpgradeModal(true);
                }
              }}
              title={isPro ? 'Version History' : 'Version History (Pro)'}
              aria-label="Version history"
            >
              <Clock size={16} />
              {!isPro && <span className={styles.proBadge}>Pro</span>}
            </button>
          </div>
        )}
      </div>

      {showShareModal && (
        <ShareModal mapId={mapId} onClose={() => setShowShareModal(false)} />
      )}

      {showUpgradeModal && (
        <UpgradeModal
          title="Upgrade to Pro"
          description="Sharing, premium exports, and unlimited cloud saves are available with a Pro subscription."
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      {showPublishModal && (
        <PublishModal
          mapId={mapId}
          mapTitle={title}
          onClose={() => setShowPublishModal(false)}
          publishedMapId={publishedMapId}
        />
      )}

      {showInviteModal && (
        <CollabInviteModal mapId={mapId} onClose={() => setShowInviteModal(false)} />
      )}

    </>
  );
};
