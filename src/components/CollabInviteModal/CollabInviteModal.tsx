import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Trash2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
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
  const [email, setEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const loadInvites = async () => {
    try {
      const result = await apiClient.getCollabInvites(mapId);
      setInvites(result.invites);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, [mapId]);

  const handleCreateInvite = async () => {
    setCreating(true);
    try {
      await apiClient.createCollabInvite(mapId, email || undefined);
      setEmail('');
      await loadInvites();
    } catch {
      // ignore
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
    } catch {
      // ignore
    }
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
          <div className={styles.inputRow}>
            <input
              type="email"
              className={styles.emailInput}
              placeholder="Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateInvite()}
            />
            <button
              className={styles.createButton}
              onClick={handleCreateInvite}
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create Link'}
            </button>
          </div>

          {loading ? (
            <p className={styles.emptyText}>Loading...</p>
          ) : invites.length === 0 ? (
            <p className={styles.emptyText}>No invites yet. Create an invite link to share.</p>
          ) : (
            <div className={styles.inviteList}>
              {invites.map((invite) => (
                <div key={invite.id} className={styles.inviteItem}>
                  <div className={styles.inviteInfo}>
                    <span className={styles.inviteEmail}>
                      {invite.invitee_email || 'Anyone with link'}
                    </span>
                    <span className={`${styles.inviteStatus} ${styles[invite.status]}`}>
                      {invite.status}
                    </span>
                  </div>
                  <div className={styles.inviteActions}>
                    <button
                      className={styles.iconButton}
                      onClick={() => handleCopyLink(invite.invite_token)}
                      title="Copy invite link"
                    >
                      {copiedToken === invite.invite_token ? <Check size={14} /> : <Copy size={14} />}
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
