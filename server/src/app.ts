import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import healthRouter from './routes/health';
import mapsRouter from './routes/maps';
import userRouter from './routes/user';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/health', healthRouter);
app.use('/api/maps', mapsRouter);
app.use('/api/user', userRouter);

// Error handler (must be last)
app.use(errorHandler);

export { app };
