import React, { useState } from 'react';
import { X } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import styles from './TeamsUpgradeModal.module.css';

interface TeamsUpgradeModalProps {
  onClose: () => void;
}

export const TeamsUpgradeModal: React.FC<TeamsUpgradeModalProps> = ({ onClose }) => {
  const [teamName, setTeamName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      setError('Please enter a team name');
      return;
    }
    setCreating(true);
    setError(null);

    try {
      const result = await apiClient.createTeam(teamName.trim());
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create team');
      setCreating(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Upgrade to Teams</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>
            Collaborate in real-time with your team. Create a team to invite
            others to edit your mind maps together.
          </p>

          <div className={styles.features}>
            <div className={styles.feature}>Real-time collaboration</div>
            <div className={styles.feature}>Live cursor presence</div>
            <div className={styles.feature}>Per-seat billing</div>
            <div className={styles.feature}>All Pro features included</div>
          </div>

          <input
            type="text"
            className={styles.input}
            placeholder="Team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTeam()}
          />

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={styles.createButton}
            onClick={handleCreateTeam}
            disabled={creating}
          >
            {creating ? 'Creating...' : 'Create Team & Subscribe'}
          </button>
          <button className={styles.cancelButton} onClick={onClose}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
};
