import React from 'react';
import type { CollabUser } from '../../services/collabSocket';
import styles from './PresencePanel.module.css';

interface PresencePanelProps {
  users: CollabUser[];
  isConnected: boolean;
  isConnecting: boolean;
}

export const PresencePanel: React.FC<PresencePanelProps> = ({ users, isConnected, isConnecting }) => {
  if (!isConnected && !isConnecting) return null;

  return (
    <div className={styles.panel}>
      {isConnecting && (
        <div className={styles.connecting} title="Connecting...">
          <div className={styles.spinner} />
        </div>
      )}
      {isConnected && users.length > 0 && (
        <div className={styles.avatars}>
          {users.slice(0, 5).map((user) => (
            <div
              key={user.socketId}
              className={styles.avatar}
              style={{ backgroundColor: user.color }}
              title={user.username}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
          ))}
          {users.length > 5 && (
            <div className={styles.overflow} title={`${users.length - 5} more`}>
              +{users.length - 5}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
