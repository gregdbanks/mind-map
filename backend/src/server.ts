import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { AppDataSource } from './config/database';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: AppDataSource.isInitialized ? 'connected' : 'disconnected',
  });
});

// API routes
app.use('/api', routes);

// Initialize database and start server
async function startServer() {
  try {
    await AppDataSource.initialize();
    console.log('📊 Database connected successfully');
    
    // Set the data source for routes to use
    const { setDataSource } = await import('./utils/dataSourceProvider');
    setDataSource(AppDataSource);

    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`🔍 Health check at http://localhost:${PORT}/health`);
      });
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
export { AppDataSource };