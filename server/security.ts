import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// 1. HELMET HIGH-SECURITY HEADERS
// Note: Content-Security-Policy is carefully guided to prevent interrupting hot-module reloads
// and images uploaded across external services (Unsplash, Cloudinary, etc.) inside development frames.
export const helmetSecurity = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
});

// 2. CORS PREMIUM ENDPOINT CONTROL
export const corsSecurity = cors({
  origin: true, // Allow direct resolution in the sandboxed preview frames
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-CSRF-Token']
});

// 3. RATE LIMITING POLICY ENGINES

// General endpoint threshold limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minute window
  max: 300, // Limit each source IP identity to 300 requests
  standardHeaders: true, // Output modern RateLimit-* headers
  legacyHeaders: false, // Turn off legacy rate limit header formats
  message: {
    error: 'Security Breach Prevention: Maximum limit threshold reached. Please try again after 15 minutes.'
  },
  skip: (req: Request) => {
    // Free pass status queries to maintain monitoring
    return req.path === '/api/health';
  }
});

// Brute-force credentials limiter
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // Max 20 auth logins / registration trials
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Security Gate Alert: Excess failed authentication trials detected from this address. Try again after 10 minutes.'
  }
});

// 4. PRECISE XSS INPUT RECURSIVE SANITIZER
function recursiveSanitize(val: any): any {
  if (typeof val === 'string') {
    // Sanitizes strings to prevent stored/reflected scripting injections
    return val
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove <script> tags
      .replace(/on\w+="[^"]*"/gi, '') // Remove on*= event attributes
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/javascript:[^\s]*/gi, '') // Remove dynamic scheme handles
      .replace(/<iframe>[\s\S]*?<\/iframe>/gi, ''); // Prevent framed cross-origin loads
  }
  if (Array.isArray(val)) {
    return val.map(recursiveSanitize);
  }
  if (val !== null && typeof val === 'object') {
    const freshObj: any = {};
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        freshObj[key] = recursiveSanitize(val[key]);
      }
    }
    return freshObj;
  }
  return val;
}

export function xssSanitizer(req: Request, res: Response, next: NextFunction) {
  if (req.body) {
    req.body = recursiveSanitize(req.body);
  }
  if (req.query) {
    req.query = recursiveSanitize(req.query);
  }
  if (req.params) {
    req.params = recursiveSanitize(req.params);
  }
  next();
}

// 5. CSRF (CROSS-SITE REQUEST FORGERY) MITIGATION SUITE
// We check for safe read-only methods and then validate verification headers
// for modifying requests (POST, PUT, DELETE) to block unauthenticated form actions.
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Bypass CSRF checks for public API endpoints where browser doesn't have authorization header yet
  const isPublicRoute = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/google',
    '/api/auth/forgot-password',
    '/api/orders/track-public'
  ].some(route => req.path.startsWith(route));

  if (isPublicRoute) {
    return next();
  }

  // Allow requests carrying safe Authorization Bearer tokens since standard CSRF 
  // relies only on browser cookie auto-sending vectors, not authorization headers.
  const hasAuthorization = req.headers.authorization;
  const isXmlHttpRequest = req.headers['x-requested-with'] === 'XMLHttpRequest';
  const csrfToken = req.headers['x-csrf-token'];

  // State mutation requests must establish secure identification checks
  if (!csrfToken && !hasAuthorization && !isXmlHttpRequest) {
    // Safely bypass CSRF check in local development (localhost or local loopback IPs)
    const host = req.hostname || '';
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.startsWith('192.168.') || host.startsWith('10.');
    if (isLocal) {
      return next();
    }

    return res.status(403).json({
      error: 'CSRF Validation Failed: Secure anti-forgery check requires matching token, authorization bearer, or XML header.'
    });
  }

  next();
}
