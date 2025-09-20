import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import routes from '../src/routes';
import { TestDataSource } from './setup';
import { setDataSource } from '../src/utils/dataSourceProvider';

const app = express();

// Set the test data source
setDataSource(TestDataSource);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: 'test',
    database: TestDataSource.isInitialized ? 'connected' : 'disconnected',
  });
});

// API routes
app.use('/api', routes);

export default app;