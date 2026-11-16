import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { serializeCategory } from '../utils/serializers.js';

const colorSchema = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{6})$/, 'Usa un color hexadecimal válido, ej. #4F46E5');

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(60),
  color: colorSchema.default('#4F46E5'),
  icon: z.string().trim().min(1).max(40).default('Tag'),
  parentId: z.string().trim().min(1).nullable().optional(),
  archived: z.boolean().optional(),
});

export const categoryUpdateSchema = categorySchema.partial();

async function assertParent(parentId, userId) {
  if (!parentId) return;
  const parent = await prisma.category.findFirst({ where: { id: parentId, userId } });
  if (!parent) throw new AppError(400, 'La categoría padre no existe.');
}

async function assertUniqueName(userId, name, parentId, excludeId = null) {
  const duplicate = await prisma.category.findFirst({
    where: {
      userId,
      parentId: parentId || null,
      name: { equals: name, mode: 'insensitive' },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  if (duplicate) {
    throw new AppError(409, 'Ya existe una categoría con ese nombre en el mismo nivel.');
  }
}

export async function listCategories(req, res) {
  const includeArchived = req.query.includeArchived === 'true';

  const categories = await prisma.category.findMany({
    where: { userId: req.userId, ...(includeArchived ? {} : { archived: false }) },
    include: { _count: { select: { products: true, children: true } } },
    orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
  });

  const serialized = categories.map(serializeCategory);
  const parents = serialized
    .filter((category) => !category.parentId)
    .map((parent) => ({
      ...parent,
      children: serialized.filter((child) => child.parentId === parent.id),
    }));

  res.json({ items: serialized, tree: parents });
}

export async function createCategory(req, res) {
  const { parentId, ...data } = req.body;
  await assertParent(parentId, req.userId);
  await assertUniqueName(req.userId, data.name, parentId);

  const category = await prisma.category.create({
    data: { ...data, parentId: parentId || null, userId: req.userId },
  });

  res.status(201).json({ category: serializeCategory(category) });
}

export async function updateCategory(req, res) {
  const existing = await prisma.category.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) throw new AppError(404, 'Categoría no encontrada.');

  const { parentId, ...data } = req.body;

  if (parentId !== undefined) {
    if (parentId === existing.id) throw new AppError(400, 'Una categoría no puede ser su propio padre.');
    await assertParent(parentId, req.userId);

    if (parentId) {
      const child = await prisma.category.findFirst({ where: { id: parentId, parentId: existing.id } });
      if (child) throw new AppError(400, 'No puedes mover una categoría dentro de una subcategoría suya.');
    }
  }

  await assertUniqueName(
    req.userId,
    data.name ?? existing.name,
    parentId !== undefined ? parentId : existing.parentId,
    existing.id
  );

  const category = await prisma.$transaction(async (tx) => {
    const updated = await tx.category.update({
      where: { id: existing.id },
      data: { ...data, ...(parentId !== undefined ? { parentId: parentId || null } : {}) },
    });

    if (data.archived === false) {
      await tx.category.updateMany({
        where: { parentId: existing.id, userId: req.userId },
        data: { archived: false },
      });
    }

    return updated;
  });

  res.json({ category: serializeCategory(category) });
}

export async function deleteCategory(req, res) {
  const existing = await prisma.category.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { _count: { select: { products: true, children: true } } },
  });
  if (!existing) throw new AppError(404, 'Categoría no encontrada.');

  const hard = req.query.hard === 'true';

  if (!hard) {
    const [category] = await prisma.$transaction([
      prisma.category.update({
        where: { id: existing.id },
        data: { archived: true },
      }),
      prisma.category.updateMany({
        where: { parentId: existing.id, userId: req.userId },
        data: { archived: true },
      }),
    ]);
    return res.json({ category: serializeCategory(category), archived: true });
  }

  if (existing._count.products > 0 || existing._count.children > 0) {
    throw new AppError(
      409,
      'No puedes eliminar una categoría con productos o subcategorías. Archívala en su lugar.'
    );
  }

  await prisma.category.delete({ where: { id: existing.id } });
  res.status(204).send();
}
