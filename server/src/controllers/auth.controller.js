import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import {
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  clearRefreshCookie,
  hashToken,
  setRefreshCookie,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../lib/tokens.js';
import { AppError } from '../utils/AppError.js';
import { serializeUser } from '../utils/serializers.js';

const DEFAULT_CATEGORIES = [
  { name: 'Juguetes Niño', color: '#4F46E5', icon: 'Rocket' },
  { name: 'Juguetes Niña', color: '#EC4899', icon: 'Heart' },
  { name: 'Unisex', color: '#0EA5E9', icon: 'Shapes' },
  { name: 'General', color: '#64748B', icon: 'Tag' },
];

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Mercadería', color: '#EF4444', type: 'INVESTMENT' },
  { name: 'Pasajes / Transporte', color: '#F97316', type: 'OPERATING' },
  { name: 'Comida / Viáticos', color: '#F59E0B', type: 'OPERATING' },
  { name: 'Empaques / Bolsas', color: '#8B5CF6', type: 'OPERATING' },
  { name: 'Publicidad', color: '#0EA5E9', type: 'OPERATING' },
  { name: 'Otros', color: '#64748B', type: 'BOTH' },
];

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Ingresa tu nombre').max(80),
  email: z.string().trim().toLowerCase().email('Correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(72),
  businessName: z.string().trim().max(120).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Correo electrónico inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

export const updateMeSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  businessName: z.string().trim().min(2).max(120).optional(),
});

async function issueSession(user, res) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_MAX_AGE),
    },
  });

  setRefreshCookie(res, refreshToken);
  return accessToken;
}

export async function register(req, res) {
  const { name, email, password, businessName } = req.body;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new AppError(409, 'Ese correo ya está registrado. Inicia sesión.');

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        businessName: businessName || `Emprendimiento de ${name.split(' ')[0]}`,
      },
    });

    await tx.category.createMany({
      data: DEFAULT_CATEGORIES.map((category) => ({ ...category, userId: created.id })),
    });

    await tx.expenseCategory.createMany({
      data: DEFAULT_EXPENSE_CATEGORIES.map((category) => ({ ...category, userId: created.id })),
    });

    return created;
  });

  const accessToken = await issueSession(user, res);
  res.status(201).json({ accessToken, user: serializeUser(user) });
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(401, 'Correo o contraseña incorrectos.');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, 'Correo o contraseña incorrectos.');

  await prisma.refreshToken.deleteMany({
    where: { userId: user.id, expiresAt: { lt: new Date() } },
  });

  const accessToken = await issueSession(user, res);
  res.json({ accessToken, user: serializeUser(user) });
}

export async function refresh(req, res) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw new AppError(401, 'No hay una sesión activa.');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    clearRefreshCookie(res);
    throw new AppError(401, 'Tu sesión expiró. Inicia sesión nuevamente.');
  }

  const tokenHash = hashToken(token);
  const stored = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      userId: payload.sub,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!stored) {
    clearRefreshCookie(res);
    throw new AppError(401, 'Tu sesión expiró. Inicia sesión nuevamente.');
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const accessToken = await issueSession(stored.user, res);
  res.json({ accessToken, user: serializeUser(stored.user) });
}

export async function logout(req, res) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    await prisma.refreshToken
      .delete({ where: { tokenHash: hashToken(token) } })
      .catch(() => null);
  }
  clearRefreshCookie(res);
  res.status(204).send();
}

export async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) throw new AppError(404, 'Usuario no encontrado.');
  res.json({ user: serializeUser(user) });
}

export async function updateMe(req, res) {
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: req.body,
  });
  res.json({ user: serializeUser(user) });
}
