import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const REFRESH_COOKIE = 'ef_refresh';
export const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export function signAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, env.accessSecret, {
    expiresIn: env.accessExpiresIn,
  });
}

export function signRefreshToken(user) {
  return jwt.sign({ sub: user.id, type: 'refresh' }, env.refreshSecret, {
    expiresIn: env.refreshExpiresIn,
    jwtid: crypto.randomUUID(),
  });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.refreshSecret);
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.accessSecret);
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/',
    maxAge: REFRESH_MAX_AGE,
  };
}

export function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions());
}

export function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/',
  });
}
