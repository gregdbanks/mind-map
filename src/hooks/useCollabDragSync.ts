import { useState, useEffect, useCallback, useRef } from 'react';
import { collabSocket } from '../services/collabSocket';

export interface RemoteDrag {
  userId: string;
  nodeId: string;
  x: number;
  y: number;
}

interface UseCollabDragSyncOptions {
  enabled: boolean;
}

export function useCollabDragSync({ enabled }: UseCollabDragSyncOptions) {
  const [remoteDrags, setRemoteDrags] = useState<Map<string, RemoteDrag>>(new Map());
  const throttleRef = useRef<number>(0);

  // Broadcast drag position (throttled to 16ms / ~60fps)
  const broadcastDragPosition = useCallback(
    (nodeId: string, x: number, y: number) => {
      if (!enabled) return;
      const now = Date.now();
      if (now - throttleRef.current < 16) return;
      throttleRef.current = now;

      const socket = collabSocket.getSocket();
      if (!socket?.connected) return;

      socket.emit('drag-move', { nodeId, x, y });
    },
    [enabled]
  );

  const broadcastDragEnd = useCallback(
    (nodeId: string) => {
      if (!enabled) return;
      const socket = collabSocket.getSocket();
      if (!socket?.connected) return;
      socket.emit('drag-end', { nodeId });
    },
    [enabled]
  );

  // Listen for remote drag updates
  useEffect(() => {
    if (!enabled) return;

    const socket = collabSocket.getSocket();
    if (!socket) return;

    const handleDragMove = (data: { userId: string; nodeId: string; x: number; y: number }) => {
      setRemoteDrags((prev) => {
        const next = new Map(prev);
        next.set(data.userId, data);
        return next;
      });
    };

    const handleDragEnd = (data: { userId: string; nodeId: string }) => {
      setRemoteDrags((prev) => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    };

    socket.on('drag-move', handleDragMove);
    socket.on('drag-end', handleDragEnd);

    return () => {
      socket.off('drag-move', handleDragMove);
      socket.off('drag-end', handleDragEnd);
    };
  }, [enabled]);

  return { remoteDrags, broadcastDragPosition, broadcastDragEnd };
}
