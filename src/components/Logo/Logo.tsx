import React from 'react';
import styles from './Logo.module.css';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeConfig = {
  sm: { iconSize: 20, fontSize: 14, gap: 6 },
  md: { iconSize: 28, fontSize: 20, gap: 8 },
  lg: { iconSize: 36, fontSize: 26, gap: 10 },
};

export const Logo: React.FC<LogoProps> = ({ size = 'md', className }) => {
  const config = sizeConfig[size];

  return (
    <span className={`${styles.logo} ${className ?? ''}`} style={{ gap: config.gap }}>
      <svg
        width={config.iconSize}
        height={config.iconSize}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={styles.icon}
      >
        <defs>
          <linearGradient id="thoughtnet-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>

        {/* Connections — thin lines between nodes */}
        <line x1="16" y1="8" x2="7" y2="18" stroke="url(#thoughtnet-grad)" strokeWidth="1.5" strokeOpacity="0.6" />
        <line x1="16" y1="8" x2="25" y2="18" stroke="url(#thoughtnet-grad)" strokeWidth="1.5" strokeOpacity="0.6" />
        <line x1="16" y1="8" x2="16" y2="26" stroke="url(#thoughtnet-grad)" strokeWidth="1.5" strokeOpacity="0.5" />
        <line x1="7" y1="18" x2="16" y2="26" stroke="url(#thoughtnet-grad)" strokeWidth="1.5" strokeOpacity="0.5" />
        <line x1="25" y1="18" x2="16" y2="26" stroke="url(#thoughtnet-grad)" strokeWidth="1.5" strokeOpacity="0.5" />
        <line x1="7" y1="18" x2="25" y2="18" stroke="url(#thoughtnet-grad)" strokeWidth="1.2" strokeOpacity="0.35" />

        {/* Nodes — dots at vertices */}
        <circle cx="16" cy="8" r="3.5" fill="url(#thoughtnet-grad)" />
        <circle cx="7" cy="18" r="3" fill="url(#thoughtnet-grad)" opacity="0.85" />
        <circle cx="25" cy="18" r="3" fill="url(#thoughtnet-grad)" opacity="0.85" />
        <circle cx="16" cy="26" r="2.5" fill="url(#thoughtnet-grad)" opacity="0.7" />
      </svg>
      <span className={styles.wordmark} style={{ fontSize: config.fontSize }}>
        <span className={styles.wordLight}>Thought</span>
        <span className={styles.wordBold}>Net</span>
      </span>
    </span>
  );
};
