import jwt from 'jsonwebtoken';
import { createRemoteJWKSet, jwtVerify } from 'jose';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const JWKS_URL = SUPABASE_URL ? `${SUPABASE_URL}/auth/v1/.well-known/jwks.json` : '';
let jwks = null;
if (JWKS_URL) {
    jwks = createRemoteJWKSet(new URL(JWKS_URL));
}
export function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token)
        return res.status(401).json({ error: 'missing token' });
    try {
        if (!jwks) {
            const decoded = jwt.decode(token);
            req.user = {
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
            req.user = {
                id: payload?.sub,
                email: payload?.email,
                role: payload?.role || payload?.app_metadata?.role,
            };
            return next();
        })
            .catch(() => res.status(401).json({ error: 'invalid token' }));
        return;
    }
    catch {
        return res.status(401).json({ error: 'invalid token' });
    }
}
export const allow = (...roles) => (req, res, next) => {
    const role = req.user?.role;
    if (role && roles.includes(role))
        return next();
    return res.status(403).json({ error: 'forbidden' });
};
export const requireManager = allow('MANAGER');
