import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const JWKS_URL = SUPABASE_URL ? `${SUPABASE_URL}/auth/v1/.well-known/jwks.json` : '';
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

if (JWKS_URL) {
  jwks = createRemoteJWKSet(new URL(JWKS_URL));
}

export interface AuthenticatedRequest extends Request {
  user?: { id?: string; email?: string; role?: string };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return res.status(401).json({ error: 'missing token' });
  try {
    if (!jwks) {
      const decoded = jwt.decode(token) as any;
      (req as AuthenticatedRequest).user = {
        id: decoded?.sub,
        email: decoded?.email,
        role: decoded?.role || decoded?.app_metadata?.role,
      };
      return next();
    }

    jwtVerify(token, jwks, {
      issuer: 'https://supabase.io/',
      // Audience is optional; skip unless you set one. Add if needed.
    })
      .then(({ payload }) => {
        (req as AuthenticatedRequest).user = {
          id: (payload as any)?.sub,
          email: (payload as any)?.email,
          role: (payload as any)?.role || (payload as any)?.app_metadata?.role,
        };
        return next();
      })
      .catch(() => res.status(401).json({ error: 'invalid token' }));
    return;
  } catch {
    return res.status(401).json({ error: 'invalid token' });
  }
}

export const allow = (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  const role = (req as AuthenticatedRequest).user?.role;
  if (role && roles.includes(role)) return next();
  return res.status(403).json({ error: 'forbidden' });
};

export const requireManager = allow('MANAGER');


