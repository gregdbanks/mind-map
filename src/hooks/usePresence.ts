import { useState, useEffect, useCallback, useRef } from 'react';
import { collabSocket } from '../services/collabSocket';
import type { CollabUser } from '../services/collabSocket';
import { useAuth } from '../context/AuthContext';

interface UsePresenceOptions {
  mapId: string;
  enabled?: boolean;
}

interface UsePresenceReturn {
  users: CollabUser[];
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function usePresence({ mapId, enabled = true }: UsePresenceOptions): UsePresenceReturn {
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<CollabUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(async () => {
    if (!isAuthenticated || !user || !enabled) return;

    setIsConnecting(true);
    setError(null);

    try {
      const socket = await collabSocket.connect(user.username);

      if (!mountedRef.current) return;

      socket.on('presence-update', (updatedUsers: CollabUser[]) => {
        if (mountedRef.current) {
          setUsers(updatedUsers);
        }
      });

      socket.on('disconnect', () => {
        if (mountedRef.current) {
          setIsConnected(false);
        }
      });

      socket.on('reconnect', () => {
        if (mountedRef.current) {
          setIsConnected(true);
          collabSocket.joinRoom(mapId);
        }
      });

      setIsConnected(true);
      collabSocket.joinRoom(mapId);
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Connection failed');
      }
    } finally {
      if (mountedRef.current) {
        setIsConnecting(false);
      }
    }
  }, [mapId, user, isAuthenticated, enabled]);

  const disconnect = useCallback(() => {
    collabSocket.disconnect();
    setUsers([]);
    setIsConnected(false);
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    mountedRef.current = true;

    if (enabled && isAuthenticated) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      collabSocket.leaveRoom();
    };
  }, [mapId, enabled, isAuthenticated]);

  return { users, isConnected, isConnecting, error, connect, disconnect };
}
