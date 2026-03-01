import React, { useState, useEffect, useCallback } from 'react';
import { X, Copy, Check, Trash2, Link } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { analytics } from '../../services/analytics';
import styles from './CollabInviteModal.module.css';

interface Invite {
  id: string;
  invite_token: string;
  invitee_email: string | null;
  invitee_id: string | null;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface CollabInviteModalProps {
  mapId: string;
  onClose: () => void;
}

export const CollabInviteModal: React.FC<CollabInviteModalProps> = ({ mapId, onClose }) => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadInvites = useCallback(async () => {
    try {
      const result = await apiClient.getCollabInvites(mapId);
      setInvites(result.invites);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [mapId]);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  const activeInvite = invites.find((i) => i.status === 'pending');

  const handleCreateInvite = async () => {
    setCreating(true);
    setError(null);
    try {
      const result = await apiClient.createCollabInvite(mapId);
      analytics.collabInviteCreate();
      await loadInvites();
      // Auto-copy the new link
      const link = `${window.location.origin}/collab/join/${result.invite_token}`;
      await navigator.clipboard.writeText(link);
      setCopiedToken(result.invite_token);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create invite';
      if (message.includes('already exists')) {
        setError('An active invite link already exists. Copy it below or revoke it first.');
      } else {
        setError(message);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = async (token: string) => {
    const link = `${window.location.origin}/collab/join/${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleDeleteInvite = async (inviteId: string) => {
    try {
      await apiClient.deleteCollabInvite(mapId, inviteId);
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      setError(null);
    } catch {
      // ignore
    }
  };

  const formatExpiry = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Expired';
    if (days === 1) return 'Expires tomorrow';
    return `Expires in ${days} days`;
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Invite Collaborators</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>
            Generate an invite link to share with collaborators. Anyone with the link can join and edit this map in real time.
          </p>

          {!activeInvite && (
            <button
              className={styles.createButton}
              onClick={handleCreateInvite}
              disabled={creating}
            >
              <Link size={16} />
              {creating ? 'Creating...' : 'Generate Invite Link'}
            </button>
          )}

          {error && <p className={styles.errorText}>{error}</p>}

          {loading ? (
            <p className={styles.emptyText}>Loading...</p>
          ) : invites.length === 0 ? (
            <p className={styles.emptyText}>No invite links yet.</p>
          ) : (
            <div className={styles.inviteList}>
              {invites.map((invite) => (
                <div key={invite.id} className={styles.inviteItem}>
                  <div className={styles.inviteInfo}>
                    <span className={`${styles.inviteStatus} ${styles[invite.status]}`}>
                      {invite.status}
                    </span>
                    <span className={styles.inviteExpiry}>
                      {formatExpiry(invite.expires_at)}
                    </span>
                  </div>
                  <div className={styles.inviteActions}>
                    <button
                      className={styles.copyButton}
                      onClick={() => handleCopyLink(invite.invite_token)}
                      title="Copy invite link"
                    >
                      {copiedToken === invite.invite_token ? (
                        <>
                          <Check size={14} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Copy Link
                        </>
                      )}
                    </button>
                    <button
                      className={styles.iconButton}
                      onClick={() => handleDeleteInvite(invite.id)}
                      title="Revoke invite"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
