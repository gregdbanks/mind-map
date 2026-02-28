export interface CollabUser {
  socketId: string;
  userId: string;
  username: string;
  color: string;
  joinedAt: number;
}

export const collabSocket = {
  connect: jest.fn().mockResolvedValue({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connected: true,
  }),
  joinRoom: jest.fn(),
  leaveRoom: jest.fn(),
  disconnect: jest.fn(),
  getSocket: jest.fn().mockReturnValue(null),
  isConnected: jest.fn().mockReturnValue(false),
  getCurrentRoom: jest.fn().mockReturnValue(null),
};
