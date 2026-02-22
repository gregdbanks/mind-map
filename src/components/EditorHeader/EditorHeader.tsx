import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Share2 } from 'lucide-react';
import { useMapTitle } from '../../hooks/useMapTitle';
import { useAuth } from '../../context/AuthContext';
import { ShareModal } from '../ShareModal/ShareModal';
import styles from './EditorHeader.module.css';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'syncing' | 'synced' | 'sync-error' | 'offline';

interface EditorHeaderProps {
  mapId: string;
  saveStatus: SaveStatus;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({ mapId, saveStatus }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { title, loading: titleLoading, rename } = useMapTitle(mapId);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
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
          {saveStatus === 'saving' && <span>Saving...</span>}
          {saveStatus === 'saved' && (
            <>
              <Check size={14} className={styles.checkIcon} />
              <span>Saved locally</span>
            </>
          )}
          {saveStatus === 'syncing' && <span>Syncing...</span>}
          {saveStatus === 'synced' && (
            <>
              <Check size={14} className={styles.cloudCheckIcon} />
              <span>Synced</span>
            </>
          )}
          {saveStatus === 'sync-error' && (
            <span className={styles.syncError}>Cloud sync failed</span>
          )}
          {saveStatus === 'offline' && (
            <span className={styles.offlineStatus}>Offline — saved locally</span>
          )}
        </div>

        {isAuthenticated && (
          <button
            className={styles.shareButton}
            onClick={() => setShowShareModal(true)}
            title="Share"
            aria-label="Share mind map"
          >
            <Share2 size={16} />
          </button>
        )}
      </div>

      {showShareModal && (
        <ShareModal mapId={mapId} onClose={() => setShowShareModal(false)} />
      )}
    </>
  );
};
