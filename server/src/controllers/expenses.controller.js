import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { round2, sumBy } from '../utils/money.js';
import { serializeExpense } from '../utils/serializers.js';
import { getRange } from '../utils/dates.js';
import { deleteUploadedImage } from './uploads.controller.js';

const optionalText = z
  .union([z.string().trim().max(300), z.null()])
  .optional()
  .transform((value) => (value == null || value === '' ? null : value));

export const expenseSchema = z.object({
  type: z.enum(['INVESTMENT', 'OPERATING'], { message: 'Tipo de gasto inválido' }),
  description: z.string().trim().min(2, 'Describe el gasto').max(200),
  amount: z.coerce.number().min(0).max(99999999).optional(),
  supplier: optionalText,
  paymentMethod: optionalText,
  receiptUrl: optionalText,
  notes: optionalText,
  date: z.coerce.date().optional(),
  expenseCategoryId: z
    .union([z.string().trim().min(1), z.null()])
    .optional()
    .transform((value) => value || null),
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1),
        quantity: z.coerce.number().int().min(1).max(100000),
        unitCost: z.coerce.number().min(0).max(9999999),
      })
    )
    .max(100)
    .optional()
    .default([]),
});

export const expenseUpdateSchema = z
  .object({
    description: z.string().trim().min(2).max(200).optional(),
    amount: z.coerce.number().min(0).max(99999999).optional(),
    supplier: optionalText,
    paymentMethod: optionalText,
    receiptUrl: optionalText,
    notes: optionalText,
    date: z.coerce.date().optional(),
    expenseCategoryId: z
      .union([z.string().trim().min(1), z.null()])
      .optional()
      .transform((value) => value || null),
  })
  .partial();

async function assertExpenseCategory(categoryId, type, userId) {
  if (!categoryId) return null;
  const category = await prisma.expenseCategory.findFirst({ where: { id: categoryId, userId } });
  if (!category) throw new AppError(400, 'La categoría de gasto no existe.');
  if (category.type !== 'BOTH' && category.type !== type) {
    throw new AppError(400, 'La categoría seleccionada no corresponde al tipo de movimiento.');
  }
  return category;
}

export async function listExpenses(req, res) {
  const { search, type, categoryId, from, to, range } = req.query;
  const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 500);
  const rangeInfo = range && range !== 'all' ? getRange(range) : null;
  const start = from ? new Date(from) : rangeInfo?.from || null;
  const end = to ? new Date(to) : rangeInfo?.to || null;

  const where = {
    userId: req.userId,
    ...(type && type !== 'ALL' ? { type } : {}),
    ...(categoryId ? { expenseCategoryId: categoryId } : {}),
    ...(start || end
      ? {
          date: {
            ...(start ? { gte: start } : {}),
            ...(end ? { lte: end } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { description: { contains: search, mode: 'insensitive' } },
            { supplier: { contains: search, mode: 'insensitive' } },
            { notes: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const expenses = await prisma.expense.findMany({
    where,
    include: { expenseCategory: true, items: true },
    orderBy: { date: 'desc' },
    take: limit,
  });

  const items = expenses.map(serializeExpense);
  const totals = {
    INVESTMENT: round2(
      items.filter((expense) => expense.type === 'INVESTMENT').reduce((sum, expense) => sum + expense.amount, 0)
    ),
    OPERATING: round2(
      items.filter((expense) => expense.type === 'OPERATING').reduce((sum, expense) => sum + expense.amount, 0)
    ),
  };
  totals.ALL = round2(totals.INVESTMENT + totals.OPERATING);

  res.json({ items, totals });
}

export async function getExpense(req, res) {
  const expense = await prisma.expense.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { expenseCategory: true, items: true },
  });
  if (!expense) throw new AppError(404, 'Movimiento no encontrado.');
  res.json({ expense: serializeExpense(expense) });
}

export async function createExpense(req, res) {
  const { items = [], amount, expenseCategoryId, ...data } = req.body;

  await assertExpenseCategory(expenseCategoryId, data.type, req.userId);

  const expense = await prisma.$transaction(async (tx) => {
    const preparedItems = [];

    if (data.type === 'INVESTMENT' && items.length > 0) {
      const productIds = [...new Set(items.map((item) => item.productId))];
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, userId: req.userId },
      });
      if (products.length !== productIds.length) {
        throw new AppError(400, 'Uno de los productos vinculados no existe.');
      }
      const productMap = new Map(products.map((product) => [product.id, product]));

      for (const item of items) {
        const product = productMap.get(item.productId);
        const unitCost = round2(item.unitCost);
        preparedItems.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitCost,
          lineTotal: round2(unitCost * item.quantity),
        });
      }
    }

    const itemsTotal = sumBy(preparedItems, (item) => item.lineTotal);
    const finalAmount = round2(amount && amount > 0 ? amount : itemsTotal);

    if (finalAmount <= 0 && preparedItems.length === 0) {
      throw new AppError(422, 'Ingresa un monto mayor a cero.');
    }

    const created = await tx.expense.create({
      data: {
        ...data,
        amount: finalAmount,
        expenseCategoryId,
        userId: req.userId,
        ...(preparedItems.length > 0 ? { items: { create: preparedItems } } : {}),
      },
      include: { expenseCategory: true, items: true },
    });

    for (const item of preparedItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    return created;
  });

  res.status(201).json({ expense: serializeExpense(expense) });
}

export async function updateExpense(req, res) {
  const existing = await prisma.expense.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) throw new AppError(404, 'Movimiento no encontrado.');

  if (req.body.expenseCategoryId) {
    await assertExpenseCategory(req.body.expenseCategoryId, existing.type, req.userId);
  }

  const expense = await prisma.expense.update({
    where: { id: existing.id },
    data: req.body,
    include: { expenseCategory: true, items: true },
  });

  if (
    req.body.receiptUrl !== undefined &&
    existing.receiptUrl &&
    existing.receiptUrl !== expense.receiptUrl
  ) {
    await deleteUploadedImage(existing.receiptUrl, req.userId);
  }

  res.json({ expense: serializeExpense(expense) });
}

export async function deleteExpense(req, res) {
  const receiptUrl = await prisma.$transaction(async (tx) => {
    const existing = await tx.expense.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { items: true },
    });
    if (!existing) throw new AppError(404, 'Movimiento no encontrado.');

    for (const item of existing.items) {
      if (!item.productId) continue;
      const product = await tx.product.findFirst({
        where: { id: item.productId, userId: req.userId },
      });
      if (product) {
        await tx.product.update({
          where: { id: product.id },
          data: { stock: Math.max(0, product.stock - item.quantity) },
        });
      }
    }

    await tx.expense.delete({ where: { id: existing.id } });
    return existing.receiptUrl;
  });

  await deleteUploadedImage(receiptUrl, req.userId);
  res.status(204).send();
}
