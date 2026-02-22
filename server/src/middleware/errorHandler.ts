import { Request, Response, NextFunction } from 'express';

interface PgError extends Error {
  code?: string;
  statusCode?: number;
}

export const errorHandler = (err: PgError, _req: Request, res: Response, _next: NextFunction) => {
  let message = err.message || 'Server Error';
  let statusCode = err.statusCode || 500;

  // Stripe errors — never expose internal details to clients
  if ((err as any).type && typeof (err as any).type === 'string' && (err as any).type.startsWith('Stripe')) {
    console.error('Stripe error:', err.message);
    message = 'Payment processing error';
    statusCode = 502;
  }

  // Postgres: duplicate key
  if (err.code === '23505') {
    message = 'Duplicate field value entered';
    statusCode = 400;
  }

  // Postgres: invalid input syntax
  if (err.code === '22P02') {
    message = 'Invalid input syntax';
    statusCode = 400;
  }

  // Postgres: not null violation
  if (err.code === '23502') {
    message = 'A required field is missing';
    statusCode = 400;
  }

  // Postgres: foreign key violation
  if (err.code === '23503') {
    message = 'Foreign key constraint violation';
    statusCode = 400;
  }

  res.status(statusCode).json({ error: message });
};
