import 'reflect-metadata';
import dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { MindMap, Node, CanvasState } from '../src/entities';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test database URL
process.env.DATABASE_URL = 'postgresql://mindmap_user:mindmap_pass@localhost:5432/mindmap_test';

// Increase timeout for database operations
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};

// Test data source
export const TestDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'mindmap_user',
  password: 'mindmap_pass',
  database: 'mindmap_test',
  synchronize: true, // Auto-create schema for tests
  dropSchema: false, // Don't drop schema on each connection
  entities: [MindMap, Node, CanvasState],
  logging: false,
});

// Initialize test database before all tests
beforeAll(async () => {
  try {
    if (!TestDataSource.isInitialized) {
      await TestDataSource.initialize();
    }
  } catch (error) {
    console.error('Failed to initialize TestDataSource:', error);
    throw error;
  }
});

// Clean up after all tests
afterAll(async () => {
  if (TestDataSource.isInitialized) {
    await TestDataSource.destroy();
  }
});