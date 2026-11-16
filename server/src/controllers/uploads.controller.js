import crypto from 'crypto';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { del, get, put } from '@vercel/blob';
import { AppError } from '../utils/AppError.js';
import { IMAGE_EXTENSIONS } from '../middleware/upload.js';

const BLOB_HOST_PATTERN = /\.(?:public|private)\.blob\.vercel-storage\.com$/i;
const MEDIA_PATH_PATTERN =
  /^assets\/[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+\.(?:jpg|jpeg|png|webp|gif|avif)$/i;

function blobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN || null;
}

function blobPathname(value, userId) {
  if (!value) return null;

  let pathname = value;

  if (/^https?:\/\//i.test(value)) {
    let parsed;
    try {
      parsed = new URL(value);
    } catch {
      return null;
    }
    if (!BLOB_HOST_PATTERN.test(parsed.hostname)) return null;
    pathname = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
  } else {
    pathname = pathname.replace(/^\/?api\/v1\/media\//, '').replace(/^\/+/, '');
  }

  if (!MEDIA_PATH_PATTERN.test(pathname)) return null;
  if (!pathname.startsWith(`assets/${userId}/`)) return null;

  return pathname;
}

export async function uploadFile(req, res) {
  if (!req.file) throw new AppError(400, 'Selecciona una imagen para subir.');
  if (!blobToken()) {
    throw new AppError(500, 'El almacenamiento de imágenes no está configurado.');
  }

  const extension = IMAGE_EXTENSIONS[req.file.mimetype];
  if (!extension) {
    throw new AppError(400, 'Formato no permitido. Usa JPG, PNG, WEBP, GIF o AVIF.');
  }

  const pathname = `assets/${req.userId}/${Date.now()}-${crypto.randomUUID()}${extension}`;

  try {
    const blob = await put(pathname, req.file.buffer, {
      access: 'private',
      contentType: req.file.mimetype,
      token: blobToken(),
      addRandomSuffix: true,
    });

    res.status(201).json({
      url: `/api/v1/media/${blob.pathname}`,
      pathname: blob.pathname,
      size: req.file.size,
    });
  } catch (error) {
    console.error('Error subiendo imagen a Vercel Blob:', error);
    throw new AppError(502, 'No se pudo subir la imagen. Intenta nuevamente.');
  }
}

export async function serveMedia(req, res) {
  const pathname = req.params[0];

  if (!pathname || !MEDIA_PATH_PATTERN.test(pathname)) {
    throw new AppError(404, 'Imagen no encontrada.');
  }
  if (!blobToken()) {
    throw new AppError(503, 'El almacenamiento de imágenes no está disponible.');
  }

  let result;
  try {
    result = await get(pathname, { access: 'private', token: blobToken() });
  } catch (error) {
    console.error('Error leyendo imagen de Vercel Blob:', error);
    throw new AppError(502, 'No se pudo cargar la imagen.');
  }

  if (!result || result.statusCode !== 200) {
    throw new AppError(404, 'Imagen no encontrada.');
  }

  res.setHeader('Content-Type', result.blob.contentType || 'application/octet-stream');
  res.setHeader('Content-Length', String(result.blob.size));
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('ETag', result.blob.etag);

  try {
    await pipeline(Readable.fromWeb(result.stream), res);
  } catch (error) {
    if (!res.headersSent) throw error;
  }
}

export async function deleteUploadedImage(value, userId) {
  if (!value || !userId || !blobToken()) return false;

  const pathname = blobPathname(value, userId);
  if (!pathname) return false;

  try {
    await del(pathname, { token: blobToken() });
    return true;
  } catch (error) {
    console.error('Error eliminando imagen de Vercel Blob:', error);
    return false;
  }
}
