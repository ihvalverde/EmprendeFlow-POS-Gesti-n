import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';

export const expenseCategorySchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(60),
  color: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{6})$/, 'Color hexadecimal inválido')
    .default('#EF4444'),
  type: z.enum(['INVESTMENT', 'OPERATING', 'BOTH']).default('OPERATING'),
});

export const expenseCategoryUpdateSchema = expenseCategorySchema.partial().extend({
  archived: z.boolean().optional(),
});

export async function listExpenseCategories(req, res) {
  const includeArchived = req.query.includeArchived === 'true';
  const items = await prisma.expenseCategory.findMany({
    where: { userId: req.userId, ...(includeArchived ? {} : { archived: false }) },
    orderBy: { name: 'asc' },
    include: { _count: { select: { expenses: true } } },
  });
  res.json({ items });
}

export async function createExpenseCategory(req, res) {
  const category = await prisma.expenseCategory.create({
    data: { ...req.body, userId: req.userId },
  });
  res.status(201).json({ category });
}

export async function updateExpenseCategory(req, res) {
  const existing = await prisma.expenseCategory.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) throw new AppError(404, 'Categoría de gasto no encontrada.');

  const category = await prisma.expenseCategory.update({
    where: { id: existing.id },
    data: req.body,
  });
  res.json({ category });
}

export async function deleteExpenseCategory(req, res) {
  const existing = await prisma.expenseCategory.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { _count: { select: { expenses: true } } },
  });
  if (!existing) throw new AppError(404, 'Categoría de gasto no encontrada.');

  if (req.query.hard === 'true' && existing._count.expenses === 0) {
    await prisma.expenseCategory.delete({ where: { id: existing.id } });
    return res.status(204).send();
  }

  const category = await prisma.expenseCategory.update({
    where: { id: existing.id },
    data: { archived: true },
  });
  res.json({ category });
}
