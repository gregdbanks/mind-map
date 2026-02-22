import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import healthRouter from './routes/health';
import mapsRouter from './routes/maps';
import publicRouter from './routes/public';
import userRouter from './routes/user';
import stripeRouter from './routes/stripe';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors());

// Stripe webhook needs raw body BEFORE express.json() parses it.
// express.json() consumes the body stream — without the raw bytes,
// webhook signature verification fails on every request.
app.use('/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/health', healthRouter);
app.use('/mindmaps', mapsRouter);
app.use('/public', publicRouter);
app.use('/api/user', userRouter);
app.use('/stripe', stripeRouter);

// Error handler (must be last)
app.use(errorHandler);

export { app };
