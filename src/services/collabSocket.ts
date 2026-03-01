import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { cognitoService } from './cognitoService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

let socket: Socket | null = null;
let currentRoom: string | null = null;

export interface CollabUser {
  socketId: string;
  userId: string;
  username: string;
  color: string;
  joinedAt: number;
}

async function getAccessToken(): Promise<string | null> {
  try {
    const session = await cognitoService.getSession();
    if (session && session.isValid()) {
      return session.getAccessToken().getJwtToken();
    }
  } catch {
    // Session retrieval failed
  }
  return null;
}

export const collabSocket = {
  async connect(username: string): Promise<Socket> {
    if (socket?.connected) return socket;

    const token = await getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    socket = io(API_BASE_URL, {
      path: '/collab',
      transports: ['websocket', 'polling'],
      auth: {
        token,
        username,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error('Socket not initialized'));

      socket.on('connect', () => {
        resolve(socket!);
      });

      socket.on('connect_error', (err) => {
        reject(err);
      });

      // Timeout after 10s
      setTimeout(() => {
        if (socket && !socket.connected) {
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  },

  joinRoom(roomId: string) {
    if (!socket?.connected) return;
    if (currentRoom) {
      socket.emit('leave-room', currentRoom);
    }
    currentRoom = roomId;
    socket.emit('join-room', roomId);
  },

  leaveRoom() {
    if (!socket?.connected || !currentRoom) return;
    socket.emit('leave-room', currentRoom);
    currentRoom = null;
  },

  disconnect() {
    if (currentRoom) {
      this.leaveRoom();
    }
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket(): Socket | null {
    return socket;
  },

  isConnected(): boolean {
    return socket?.connected ?? false;
  },

  getCurrentRoom(): string | null {
    return currentRoom;
  },
};
