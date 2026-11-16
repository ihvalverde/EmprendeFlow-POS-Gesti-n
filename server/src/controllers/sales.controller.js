import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { round2 } from '../utils/money.js';
import { serializeSale } from '../utils/serializers.js';
import { getRange } from '../utils/dates.js';

export const PAYMENT_METHODS = ['EFECTIVO', 'YAPE', 'PLIN', 'TRANSFERENCIA', 'TARJETA'];

const optionalText = z
  .union([z.string().trim().max(300), z.null()])
  .optional()
  .transform((value) => (value == null || value === '' ? null : value));

export const saleSchema = z.object({
  customerName: optionalText,
  paymentMethod: z.enum(PAYMENT_METHODS).default('EFECTIVO'),
  notes: optionalText,
  soldAt: z.coerce.date().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1),
        quantity: z.coerce.number().int().min(1, 'La cantidad mínima es 1').max(100000),
        finalSoldPrice: z.coerce.number().min(0, 'El precio no puede ser negativo').max(9999999).optional(),
      })
    )
    .min(1, 'Agrega al menos un producto a la venta'),
});

function generateCode() {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `V-${date}-${random}`;
}

export async function listSales(req, res) {
  const { search, status, paymentMethod, from, to, range } = req.query;
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 300);
  const rangeInfo = range && range !== 'all' ? getRange(range) : null;
  const start = from ? new Date(from) : rangeInfo?.from || null;
  const end = to ? new Date(to) : rangeInfo?.to || null;

  const where = {
    userId: req.userId,
    ...(status && status !== 'ALL' ? { status } : {}),
    ...(paymentMethod && paymentMethod !== 'ALL' ? { paymentMethod } : {}),
    ...(start || end
      ? {
          soldAt: {
            ...(start ? { gte: start } : {}),
            ...(end ? { lte: end } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { customerName: { contains: search, mode: 'insensitive' } },
            { notes: { contains: search, mode: 'insensitive' } },
            { items: { some: { productName: { contains: search, mode: 'insensitive' } } } },
          ],
        }
      : {}),
  };

  const sales = await prisma.sale.findMany({
    where,
    include: { items: true },
    orderBy: { soldAt: 'desc' },
    take: limit,
  });

  res.json({ items: sales.map(serializeSale) });
}

export async function getSale(req, res) {
  const sale = await prisma.sale.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { items: true },
  });
  if (!sale) throw new AppError(404, 'Venta no encontrada.');
  res.json({ sale: serializeSale(sale) });
}

export async function createSale(req, res) {
  const { items, customerName, paymentMethod, notes, soldAt } = req.body;

  const sale = await prisma.$transaction(async (tx) => {
    const productIds = [...new Set(items.map((item) => item.productId))];
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, userId: req.userId },
      include: { category: true },
    });

    if (products.length !== productIds.length) {
      throw new AppError(400, 'Uno o más productos no existen en tu catálogo.');
    }

    const productMap = new Map(products.map((product) => [product.id, product]));

    const requiredStock = new Map();
    for (const item of items) {
      requiredStock.set(item.productId, (requiredStock.get(item.productId) || 0) + item.quantity);
    }

    for (const [productId, quantity] of requiredStock.entries()) {
      const product = productMap.get(productId);
      if (product.archived) {
        throw new AppError(400, `"${product.name}" está archivado y no se puede vender.`);
      }
      if (product.stock < quantity) {
        throw new AppError(
          409,
          `Stock insuficiente de "${product.name}". Disponible: ${product.stock}, solicitado: ${quantity}.`
        );
      }
    }

    const preparedItems = items.map((item) => {
      const product = productMap.get(item.productId);
      const listPrice = round2(product.listPrice);
      const costPrice = round2(product.costPrice);
      const finalSoldPrice =
        item.finalSoldPrice != null ? round2(item.finalSoldPrice) : listPrice;
      const quantity = item.quantity;

      const lineTotal = round2(finalSoldPrice * quantity);
      const lineCost = round2(costPrice * quantity);
      const lineDiscount = round2(Math.max(listPrice - finalSoldPrice, 0) * quantity);

      return {
        productId: product.id,
        productName: product.name,
        variant: product.variant,
        categoryId: product.categoryId,
        categoryName: product.category?.name || 'Sin categoría',
        categoryColor: product.category?.color || '#64748B',
        quantity,
        listPrice,
        finalSoldPrice,
        costPrice,
        discount: lineDiscount,
        lineTotal,
        lineCost,
        lineProfit: round2(lineTotal - lineCost),
      };
    });

    const subtotal = round2(preparedItems.reduce((sum, item) => sum + item.listPrice * item.quantity, 0));
    const total = round2(preparedItems.reduce((sum, item) => sum + item.lineTotal, 0));
    const totalCost = round2(preparedItems.reduce((sum, item) => sum + item.lineCost, 0));

    for (const [productId, quantity] of requiredStock.entries()) {
      const updated = await tx.product.updateMany({
        where: { id: productId, userId: req.userId, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      });
      if (updated.count === 0) {
        const product = productMap.get(productId);
        throw new AppError(
          409,
          `Stock insuficiente de "${product.name}". Actualiza el catálogo e intenta nuevamente.`
        );
      }
    }

    const created = await tx.sale.create({
      data: {
        code: generateCode(),
        customerName,
        paymentMethod,
        notes,
        subtotal,
        totalDiscount: round2(Math.max(subtotal - total, 0)),
        total,
        totalCost,
        profit: round2(total - totalCost),
        itemCount: preparedItems.reduce((sum, item) => sum + item.quantity, 0),
        soldAt: soldAt || new Date(),
        userId: req.userId,
        items: { create: preparedItems },
      },
      include: { items: true },
    });

    return created;
  });

  res.status(201).json({ sale: serializeSale(sale) });
}

export async function cancelSale(req, res) {
  const sale = await prisma.$transaction(async (tx) => {
    const existing = await tx.sale.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { items: true },
    });
    if (!existing) throw new AppError(404, 'Venta no encontrada.');
    if (existing.status === 'CANCELLED') throw new AppError(409, 'Esta venta ya fue anulada.');

    const cancelled = await tx.sale.update({
      where: { id: existing.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
      include: { items: true },
    });

    for (const item of existing.items) {
      if (!item.productId) continue;
      const product = await tx.product.findFirst({
        where: { id: item.productId, userId: req.userId },
      });
      if (product) {
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    return cancelled;
  });

  res.json({ sale: serializeSale(sale), message: 'Venta anulada y stock restaurado.' });
}
