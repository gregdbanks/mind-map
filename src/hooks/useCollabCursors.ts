import { useState, useEffect, useCallback, useRef } from 'react';
import { collabSocket } from '../services/collabSocket';
import type { CollabUser } from '../services/collabSocket';

export interface RemoteCursor {
  userId: string;
  username: string;
  color: string;
  x: number;
  y: number;
  lastUpdate: number;
}

interface UseCollabCursorsOptions {
  enabled: boolean;
  users: CollabUser[];
}

export function useCollabCursors({ enabled, users }: UseCollabCursorsOptions) {
  const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursor>>(new Map());
  const throttleRef = useRef<number>(0);

  // Broadcast local cursor position (throttled to 50ms)
  const broadcastCursor = useCallback(
    (x: number, y: number) => {
      if (!enabled) return;
      const now = Date.now();
      if (now - throttleRef.current < 50) return;
      throttleRef.current = now;

      const socket = collabSocket.getSocket();
      if (!socket?.connected) return;

      socket.emit('cursor-move', { x, y });
    },
    [enabled]
  );

  // Listen for remote cursor updates
  useEffect(() => {
    if (!enabled) return;

    const socket = collabSocket.getSocket();
    if (!socket) return;

    const handleCursorMove = (data: { userId: string; x: number; y: number }) => {
      setRemoteCursors((prev) => {
        const next = new Map(prev);
        const user = users.find((u) => u.userId === data.userId);
        if (user) {
          next.set(data.userId, {
            userId: data.userId,
            username: user.username,
            color: user.color,
            x: data.x,
            y: data.y,
            lastUpdate: Date.now(),
          });
        }
        return next;
      });
    };

    socket.on('cursor-move', handleCursorMove);

    // Clean up stale cursors every 3 seconds
    const cleanupInterval = setInterval(() => {
      setRemoteCursors((prev) => {
        const now = Date.now();
        const next = new Map(prev);
        let changed = false;
        next.forEach((cursor, id) => {
          if (now - cursor.lastUpdate > 5000) {
            next.delete(id);
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 3000);

    return () => {
      socket.off('cursor-move', handleCursorMove);
      clearInterval(cleanupInterval);
    };
  }, [enabled, users]);

  return { remoteCursors, broadcastCursor };
}
