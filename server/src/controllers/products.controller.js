import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { round2 } from '../utils/money.js';
import { serializeProduct } from '../utils/serializers.js';
import { deleteUploadedImage } from './uploads.controller.js';

const money = z.coerce.number().min(0, 'El monto no puede ser negativo').max(99999999);
const optionalText = z
  .union([z.string().trim().max(200), z.null()])
  .optional()
  .transform((value) => (value == null || value === '' ? null : value));

export const productSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(120),
  sku: z
    .union([z.string().trim().max(40), z.null()])
    .optional()
    .transform((value) => (value == null || value === '' ? null : value)),
  variant: optionalText,
  imageUrl: optionalText,
  categoryId: z
    .union([z.string().trim().min(1), z.null()])
    .optional()
    .transform((value) => value || null),
  costPrice: money,
  listPrice: money,
  stock: z.coerce.number().int().min(0).max(1000000).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).max(10000).default(2),
  archived: z.boolean().optional(),
});

export const productUpdateSchema = productSchema.partial();

function makeSku(name) {
  const prefix = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X');
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

async function uniqueSku(userId, desired, excludeId = null) {
  if (desired) {
    const exists = await prisma.product.findFirst({
      where: { userId, sku: desired, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    if (exists) throw new AppError(409, `El SKU "${desired}" ya está en uso.`);
    return desired;
  }

  for (let i = 0; i < 5; i += 1) {
    const candidate = makeSku('PRD');
    const exists = await prisma.product.findFirst({ where: { userId, sku: candidate } });
    if (!exists) return candidate;
  }
  return `PRD-${Date.now().toString(36).toUpperCase()}`;
}

export async function listProducts(req, res) {
  const { search, categoryId, includeArchived, lowStock, sort } = req.query;
  const showArchived = includeArchived === 'true';

  const where = {
    userId: req.userId,
    ...(showArchived ? {} : { archived: false }),
    ...(categoryId ? { categoryId } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { variant: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  let items = (
    await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: sort === 'name' ? { name: 'asc' } : { createdAt: 'desc' },
    })
  ).map(serializeProduct);

  if (lowStock === 'true') items = items.filter((item) => item.lowStock);

  const stats = {
    count: items.length,
    units: items.reduce((sum, item) => sum + item.stock, 0),
    investedValue: round2(items.reduce((sum, item) => sum + item.investedValue, 0)),
    retailValue: round2(items.reduce((sum, item) => sum + item.retailValue, 0)),
    lowStock: items.filter((item) => item.lowStock).length,
    outOfStock: items.filter((item) => item.outOfStock).length,
  };

  res.json({ items, stats });
}

export async function getProduct(req, res) {
  const product = await prisma.product.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { category: true },
  });
  if (!product) throw new AppError(404, 'Producto no encontrado.');
  res.json({ product: serializeProduct(product) });
}

export async function createProduct(req, res) {
  const { categoryId, ...data } = req.body;

  if (categoryId) {
    const category = await prisma.category.findFirst({ where: { id: categoryId, userId: req.userId } });
    if (!category) throw new AppError(400, 'La categoría seleccionada no existe.');
  }

  const sku = await uniqueSku(req.userId, data.sku);

  const product = await prisma.product.create({
    data: { ...data, sku, categoryId: categoryId || null, userId: req.userId },
    include: { category: true },
  });

  res.status(201).json({ product: serializeProduct(product) });
}

export async function updateProduct(req, res) {
  const existing = await prisma.product.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) throw new AppError(404, 'Producto no encontrado.');

  const { categoryId, ...data } = req.body;

  if (categoryId) {
    const category = await prisma.category.findFirst({ where: { id: categoryId, userId: req.userId } });
    if (!category) throw new AppError(400, 'La categoría seleccionada no existe.');
  }

  if (data.sku !== undefined && data.sku !== existing.sku) {
    data.sku = await uniqueSku(req.userId, data.sku, existing.id);
  }

  const product = await prisma.product.update({
    where: { id: existing.id },
    data: { ...data, ...(categoryId !== undefined ? { categoryId: categoryId || null } : {}) },
    include: { category: true },
  });

  if (data.imageUrl !== undefined && existing.imageUrl && existing.imageUrl !== product.imageUrl) {
    await deleteUploadedImage(existing.imageUrl, req.userId);
  }

  res.json({ product: serializeProduct(product) });
}

export async function deleteProduct(req, res) {
  const existing = await prisma.product.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) throw new AppError(404, 'Producto no encontrado.');

  if (req.query.hard === 'true') {
    await prisma.product.delete({ where: { id: existing.id } });
    await deleteUploadedImage(existing.imageUrl, req.userId);
    return res.status(204).send();
  }

  await prisma.product.update({ where: { id: existing.id }, data: { archived: true } });
  res.json({ message: 'Producto archivado correctamente.', archived: true });
}
