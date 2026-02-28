import React from 'react';
import styles from './ConnectionIndicator.module.css';

interface ConnectionIndicatorProps {
  isConnected: boolean;
  isConnecting: boolean;
}

export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({ isConnected, isConnecting }) => {
  if (!isConnected && !isConnecting) return null;

  const status = isConnecting ? 'connecting' : isConnected ? 'connected' : 'disconnected';
  const title = isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected';

  return (
    <div className={styles.indicator} title={title}>
      <div className={`${styles.dot} ${styles[status]}`} />
    </div>
  );
};
