import { useState, useEffect, useCallback } from 'react';
import { collabSocket } from '../services/collabSocket';
import type { CollabUser } from '../services/collabSocket';

export interface RemoteEditing {
  userId: string;
  username: string;
  color: string;
  nodeId: string;
}

interface UseCollabEditingIndicatorOptions {
  enabled: boolean;
  users: CollabUser[];
}

export function useCollabEditingIndicator({ enabled, users }: UseCollabEditingIndicatorOptions) {
  const [remoteEditing, setRemoteEditing] = useState<Map<string, RemoteEditing>>(new Map());

  const broadcastEditStart = useCallback(
    (nodeId: string) => {
      if (!enabled) return;
      const socket = collabSocket.getSocket();
      if (!socket?.connected) return;
      socket.emit('edit-start', { nodeId });
    },
    [enabled]
  );

  const broadcastEditEnd = useCallback(() => {
    if (!enabled) return;
    const socket = collabSocket.getSocket();
    if (!socket?.connected) return;
    socket.emit('edit-end', {});
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const socket = collabSocket.getSocket();
    if (!socket) return;

    const handleEditStart = (data: { userId: string; nodeId: string }) => {
      setRemoteEditing((prev) => {
        const next = new Map(prev);
        const user = users.find((u) => u.userId === data.userId);
        if (user) {
          next.set(data.userId, {
            userId: data.userId,
            username: user.username,
            color: user.color,
            nodeId: data.nodeId,
          });
        }
        return next;
      });
    };

    const handleEditEnd = (data: { userId: string }) => {
      setRemoteEditing((prev) => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    };

    socket.on('edit-start', handleEditStart);
    socket.on('edit-end', handleEditEnd);

    return () => {
      socket.off('edit-start', handleEditStart);
      socket.off('edit-end', handleEditEnd);
    };
  }, [enabled, users]);

  return { remoteEditing, broadcastEditStart, broadcastEditEnd };
}
