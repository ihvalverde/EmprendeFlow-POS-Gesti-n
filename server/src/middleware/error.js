import multer from 'multer';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
  }

  if (error instanceof multer.MulterError) {
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'La imagen supera el límite de 4 MB.'
        : 'No se pudo subir el archivo.';
    return res.status(400).json({ message });
  }

  if (error.code === 'P2002') {
    return res.status(409).json({
      message: 'Ya existe un registro con esos datos (nombre, SKU o código duplicado).',
    });
  }

  if (error.code === 'P2025') {
    return res.status(404).json({ message: 'El registro solicitado no existe.' });
  }

  if (error.code === 'P2003') {
    return res.status(409).json({ message: 'El registro está vinculado a otros datos.' });
  }

  if (!env.isProd) console.error('[ERROR]', error);

  return res.status(500).json({ message: 'Ocurrió un error inesperado. Intenta nuevamente.' });
}
