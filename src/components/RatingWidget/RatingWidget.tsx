import React, { useState } from 'react';
import { Star } from 'lucide-react';
import styles from './RatingWidget.module.css';

interface RatingWidgetProps {
  currentRating: number;
  ratingCount: number;
  userRating?: number;
  onRate?: (rating: number) => void;
  disabled?: boolean;
  size?: number;
}

export const RatingWidget: React.FC<RatingWidgetProps> = ({
  currentRating,
  ratingCount,
  userRating,
  onRate,
  disabled = false,
  size = 18,
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const displayRating = hoverRating || userRating || currentRating;

  return (
    <div className={styles.container}>
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            className={`${styles.star} ${star <= displayRating ? styles.filled : ''} ${disabled ? styles.disabled : ''}`}
            onMouseEnter={() => !disabled && setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => !disabled && onRate?.(star)}
            disabled={disabled}
            type="button"
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          >
            <Star size={size} fill={star <= displayRating ? '#f59e0b' : 'none'} stroke={star <= displayRating ? '#f59e0b' : '#94a3b8'} />
          </button>
        ))}
      </div>
      <span className={styles.info}>
        {currentRating > 0 ? currentRating.toFixed(1) : '\u2014'} ({ratingCount})
      </span>
    </div>
  );
};
