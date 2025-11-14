import jwt from 'jsonwebtoken';

// Validate and normalize secrets at module load so errors surface early and are easier to debug.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('Missing environment variable JWT_SECRET. Set JWT_SECRET in your .env or environment.');
}

// If JWT_REFRESH_SECRET is not provided, fall back to JWT_SECRET for local/dev convenience and warn.
// In production you should set a separate strong JWT_REFRESH_SECRET.
let JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
if (!JWT_REFRESH_SECRET) {
  // Warn so developers notice and can set a proper refresh secret for production.
  console.warn('JWT_REFRESH_SECRET is not set — falling back to JWT_SECRET. Set a separate JWT_REFRESH_SECRET for production.');
  JWT_REFRESH_SECRET = JWT_SECRET;
}

export const generateAuthToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: '15m',
  });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET as string, {
    expiresIn: '7d',
  });
};

export const verifyAuthToken = (token: string): { userId: string } => {
  return jwt.verify(token, JWT_SECRET) as { userId: string };
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, JWT_REFRESH_SECRET as string) as { userId: string };
};

export const generateResetToken = (userId: string): string => {
  return jwt.sign({ userId, type: 'reset' }, JWT_SECRET, {
    expiresIn: '1h',
  });
};

export const verifyResetToken = (token: string): { userId: string; type: string } => {
  return jwt.verify(token, JWT_SECRET) as { userId: string; type: string };
};