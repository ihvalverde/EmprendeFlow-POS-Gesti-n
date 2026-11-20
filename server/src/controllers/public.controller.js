import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { num } from '../utils/money.js';

export async function getPublicCatalog(req, res) {
  const { slug } = req.params;

  let user = await prisma.user.findUnique({
    where: { catalogSlug: slug },
    select: {
      id: true,
      name: true,
      businessName: true,
      whatsappPhone: true,
      catalogSlug: true,
    },
  });

  if (!user) {
    user = await prisma.user.findUnique({
      where: { id: slug },
      select: {
        id: true,
        name: true,
        businessName: true,
        whatsappPhone: true,
        catalogSlug: true,
      },
    });
  }

  if (!user) throw new AppError(404, 'Catálogo no encontrado.');

  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: {
        userId: user.id,
        archived: false,
        products: {
          some: {
            isPublic: true,
            archived: false,
            stock: { gt: 0 },
          },
        },
      },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, color: true, icon: true, parentId: true },
    }),
    prisma.product.findMany({
      where: {
        userId: user.id,
        archived: false,
        isPublic: true,
        stock: { gt: 0 },
      },
      include: { category: { select: { id: true, name: true, color: true, icon: true } } },
      orderBy: [{ name: 'asc' }],
    }),
  ]);

  res.json({
    store: {
      id: user.id,
      name: user.businessName || user.name,
      ownerName: user.name,
      slug: user.catalogSlug || user.id,
      whatsappPhone: user.whatsappPhone || null,
    },
    categories,
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      variant: product.variant,
      listPrice: num(product.listPrice),
      stock: product.stock,
      imageUrl: product.imageUrl,
      category: product.category
        ? {
            id: product.category.id,
            name: product.category.name,
            color: product.category.color,
            icon: product.category.icon,
          }
        : null,
    })),
  });
}