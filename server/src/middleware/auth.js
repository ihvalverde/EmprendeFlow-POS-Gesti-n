import { verifyAccessToken } from '../lib/tokens.js';
import { AppError } from '../utils/AppError.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return next(new AppError(401, 'No autenticado. Inicia sesión para continuar.'));
  }

  try {
    const payload = verifyAccessToken(header.slice(7));
    req.userId = payload.sub;
    return next();
  } catch {
    return next(new AppError(401, 'Tu sesión expiró. Vuelve a iniciar sesión.'));
  }
}
