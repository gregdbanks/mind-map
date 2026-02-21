import { Request, Response, NextFunction } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import pool from '../db/pool';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        cognitoSub: string;
        email: string;
        username: string;
      };
    }
  }
}

let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getVerifier() {
  if (!verifier && process.env.NODE_ENV !== 'test') {
    verifier = CognitoJwtVerifier.create({
      userPoolId: process.env.COGNITO_USER_POOL_ID!,
      tokenUse: 'access' as const,
      clientId: process.env.COGNITO_CLIENT_ID!,
    });
  }
  return verifier;
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  // Test mode bypass
  if (process.env.NODE_ENV === 'test' || process.env.LOCAL_AUTH_BYPASS === 'true') {
    req.user = {
      userId: process.env.TEST_USER_ID || 'test-user-id',
      cognitoSub: 'test-cognito-sub',
      email: 'test@example.com',
      username: 'testuser',
    };
    return next();
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  try {
    const payload = await getVerifier()!.verify(token);
    const cognitoSub = payload.sub;
    const email = (payload as Record<string, unknown>)['email'] as string || '';
    const username = (payload as Record<string, unknown>)['cognito:username'] as string || '';

    // Upsert user and get internal ID
    const { rows } = await pool.query(
      `INSERT INTO users (cognito_sub, email, username)
       VALUES ($1, $2, $3)
       ON CONFLICT (cognito_sub) DO UPDATE SET
         email = EXCLUDED.email,
         username = EXCLUDED.username,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [cognitoSub, email, username]
    );

    req.user = {
      userId: rows[0].id,
      cognitoSub,
      email,
      username,
    };

    next();
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Token verification failed:', err);
    }
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
