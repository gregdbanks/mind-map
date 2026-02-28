import React from 'react';
import type { RemoteCursor } from '../../hooks/useCollabCursors';

interface CollabCursorsProps {
  cursors: Map<string, RemoteCursor>;
}

export const CollabCursors: React.FC<CollabCursorsProps> = ({ cursors }) => {
  if (cursors.size === 0) return null;

  return (
    <g className="collab-cursors">
      {Array.from(cursors.values()).map((cursor) => (
        <g
          key={cursor.userId}
          style={{
            transition: 'transform 80ms linear',
            transform: `translate(${cursor.x}px, ${cursor.y}px)`,
          }}
        >
          {/* Cursor arrow */}
          <path
            d="M0,0 L0,14 L4,11 L7,17 L9,16 L6,10 L11,10 Z"
            fill={cursor.color}
            stroke="#fff"
            strokeWidth={1}
          />
          {/* Username label */}
          <rect
            x={12}
            y={10}
            width={Math.max(cursor.username.length * 7 + 8, 30)}
            height={18}
            rx={4}
            fill={cursor.color}
            opacity={0.9}
          />
          <text
            x={16}
            y={23}
            fill="#fff"
            fontSize={11}
            fontWeight={500}
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {cursor.username}
          </text>
        </g>
      ))}
    </g>
  );
};
