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

const expenseItemSchema = z.object({
  productId: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(1).max(100000),
  unitCost: z.coerce.number().min(0).max(9999999),
});

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
  items: z.array(expenseItemSchema).max(100).optional().default([]),
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
    items: z.array(expenseItemSchema).max(100).optional(),
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

async function prepareInvestmentItems(tx, items, userId, extraProductIds = []) {
  const requestedIds = [...new Set(items.map((item) => item.productId))];
  const productIds = [...new Set([...requestedIds, ...extraProductIds])];

  if (productIds.length === 0) return { preparedItems: [], productMap: new Map() };

  const products = await tx.product.findMany({
    where: { id: { in: productIds }, userId },
  });

  const productMap = new Map(products.map((product) => [product.id, product]));
  if (requestedIds.some((productId) => !productMap.has(productId))) {
    throw new AppError(400, 'Uno de los productos vinculados no existe.');
  }

  const preparedItems = items.map((item) => {
    const product = productMap.get(item.productId);
    const unitCost = round2(item.unitCost);
    return {
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitCost,
      lineTotal: round2(unitCost * item.quantity),
    };
  });

  return { preparedItems, productMap };
}

function quantitiesByProduct(items) {
  const quantities = new Map();
  for (const item of items) {
    if (!item.productId) continue;
    quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
  }
  return quantities;
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
    const { preparedItems } =
      data.type === 'INVESTMENT'
        ? await prepareInvestmentItems(tx, items, req.userId)
        : { preparedItems: [] };

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
    include: { items: true },
  });
  if (!existing) throw new AppError(404, 'Movimiento no encontrado.');

  const { items, ...data } = req.body;

  if (data.expenseCategoryId) {
    await assertExpenseCategory(data.expenseCategoryId, existing.type, req.userId);
  }

  const expense = await prisma.$transaction(async (tx) => {
    if (items !== undefined) {
      if (existing.type !== 'INVESTMENT') {
        if (items.length > 0) {
          throw new AppError(400, 'Los gastos operativos no pueden vincular stock.');
        }
      } else {
        const oldProductIds = existing.items
          .map((item) => item.productId)
          .filter(Boolean);
        const { preparedItems, productMap } = await prepareInvestmentItems(
          tx,
          items,
          req.userId,
          oldProductIds
        );

        const oldQuantities = quantitiesByProduct(existing.items);
        const newQuantities = quantitiesByProduct(preparedItems);
        const productIds = new Set([...oldQuantities.keys(), ...newQuantities.keys()]);

        for (const productId of productIds) {
          const oldQuantity = oldQuantities.get(productId) || 0;
          const newQuantity = newQuantities.get(productId) || 0;
          const delta = newQuantity - oldQuantity;
          if (delta === 0) continue;

          const product = productMap.get(productId);
          if (!product) continue;

          if (delta > 0) {
            await tx.product.update({
              where: { id: product.id },
              data: { stock: { increment: delta } },
            });
          } else {
            const decrement = -delta;
            const updated = await tx.product.updateMany({
              where: {
                id: product.id,
                userId: req.userId,
                stock: { gte: decrement },
              },
              data: { stock: { decrement } },
            });

            if (updated.count === 0) {
              throw new AppError(
                409,
                `Stock insuficiente de "${product.name}" para reducir la inversión. Disponible: ${product.stock}.`
              );
            }
          }
        }

        await tx.expenseItem.deleteMany({ where: { expenseId: existing.id } });

        if (preparedItems.length > 0) {
          await tx.expenseItem.createMany({
            data: preparedItems.map((item) => ({ ...item, expenseId: existing.id })),
          });
        }
      }
    }

    return tx.expense.update({
      where: { id: existing.id },
      data,
      include: { expenseCategory: true, items: true },
    });
  });

  if (
    data.receiptUrl !== undefined &&
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
