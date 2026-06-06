import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'premium-market-secret-key-2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function isAdminEmail(email: string): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase();
  const whitelist = ['cartoontoday.333@gmail.com'];
  const envAdminEmails = process.env.ADMIN_EMAILS;
  if (envAdminEmails) {
    envAdminEmails.toLowerCase().split(',').forEach(e => {
      const trimmed = e.trim();
      if (trimmed && !whitelist.includes(trimmed)) {
        whitelist.push(trimmed);
      }
    });
  }
  return whitelist.includes(normalized);
}

export function generateToken(user: { id: string; email: string; role: string }): string {
  const actualRole = isAdminEmail(user.email) ? 'admin' : 'customer';
  return jwt.sign(
    { id: user.id, email: user.email, role: actualRole },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Express middleware to authenticate route access using JWT.
 * Looks for token in Authorization header (Bearer format) or cookie.
 */
export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query?.token) {
    token = String(req.query.token);
  }

  if (!token) {
    return res.status(412).json({ error: 'Precondition Failed: Authorization JWT is required' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }

  req.user = {
    id: payload.id,
    email: payload.email,
    role: isAdminEmail(payload.email) ? 'admin' : 'customer'
  };

  next();
}

/**
 * Role authorization guard middleware
 */
export function requireRole(role: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Auth token must be verified first' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: `Forbidden: Requires role: ${role}` });
    }
    next();
  };
}

/**
 * Decodes Google client credential payload (from GIS SDK) without heavy verification
 * to guarantee fluid server-side sign-up and login for OAuth.
 */
export function decodeGoogleCredential(token: string): { email: string; name: string; id: string } | null {
  try {
    // A JWT token consists of: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const decodedPayload = Buffer.from(parts[1], 'base64').toString('utf-8');
    const userinfo = JSON.parse(decodedPayload);
    
    if (userinfo && userinfo.email) {
      return {
        email: userinfo.email,
        name: userinfo.name || userinfo.email.split('@')[0],
        id: userinfo.sub || 'google-' + Math.random().toString(36).substr(2, 9)
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to parse Google OAuth Token payload:', error);
    return null;
  }
}
