import { prisma } from '../lib/prisma.js';
import { getRange } from '../utils/dates.js';
import { toCSV, sendCSV } from '../utils/csv.js';
import { num, round2 } from '../utils/money.js';

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima',
  dateStyle: 'short',
  timeStyle: 'short',
});

const dayFormatter = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima',
  dateStyle: 'short',
});

const fmtDateTime = (value) => (value ? dateFormatter.format(new Date(value)) : '');
const fmtDate = (value) => (value ? dayFormatter.format(new Date(value)) : '');
const money = (value) => round2(num(value)).toFixed(2);

export async function exportInventory(req, res) {
  const products = await prisma.product.findMany({
    where: { userId: req.userId, ...(req.query.includeArchived === 'true' ? {} : { archived: false }) },
    include: { category: true },
    orderBy: { name: 'asc' },
  });

  const headers = [
    'Producto', 'SKU', 'Variante', 'Categoría', 'Stock', 'Costo unitario (S/)',
    'Precio lista (S/)', 'Margen unitario (S/)', 'Valor invertido (S/)',
    'Valor venta potencial (S/)', 'Estado', 'Creado',
  ];

  const rows = products.map((product) => {
    const cost = num(product.costPrice);
    const price = num(product.listPrice);
    return [
      product.name,
      product.sku || '',
      product.variant || '',
      product.category?.name || 'Sin categoría',
      product.stock,
      money(cost),
      money(price),
      money(price - cost),
      money(cost * product.stock),
      money(price * product.stock),
      product.archived ? 'Archivado' : product.stock <= (product.lowStockThreshold ?? 2) ? 'Stock bajo' : 'Activo',
      fmtDate(product.createdAt),
    ];
  });

  sendCSV(res, `inventario-${Date.now()}.csv`, toCSV(headers, rows));
}

export async function exportSales(req, res) {
  const rangeInfo = getRange(req.query.range || 'all');
  const categoryId = req.query.categoryId || null;

  const sales = await prisma.sale.findMany({
    where: {
      userId: req.userId,
      ...(req.query.status && req.query.status !== 'ALL' ? { status: req.query.status } : {}),
      ...(rangeInfo.from ? { soldAt: { gte: rangeInfo.from, lte: rangeInfo.to } } : {}),
      ...(categoryId ? { items: { some: { categoryId } } } : {}),
    },
    include: { items: true },
    orderBy: { soldAt: 'desc' },
  });

  const headers = [
    'Código', 'Fecha', 'Cliente', 'Productos', 'Cantidad', 'Precio lista (S/)',
    'Rebaja (S/)', 'Total cobrado (S/)', 'Costo (S/)', 'Ganancia bruta (S/)',
    'Método de pago', 'Estado', 'Notas',
  ];

  const rows = sales.map((sale) => [
    sale.code,
    fmtDateTime(sale.soldAt),
    sale.customerName || 'Cliente mostrador',
    sale.items.map((item) => `${item.quantity}x ${item.productName}${item.variant ? ` (${item.variant})` : ''}`).join(' | '),
    sale.itemCount,
    money(sale.subtotal),
    money(sale.totalDiscount),
    money(sale.total),
    money(sale.totalCost),
    money(sale.profit),
    sale.paymentMethod,
    sale.status === 'COMPLETED' ? 'Completada' : 'Anulada',
    sale.notes || '',
  ]);

  sendCSV(res, `ventas-${rangeInfo.key}-${Date.now()}.csv`, toCSV(headers, rows));
}

export async function exportExpenses(req, res) {
  const rangeInfo = getRange(req.query.range || 'all');
  const type = req.query.type;

  const expenses = await prisma.expense.findMany({
    where: {
      userId: req.userId,
      ...(type && type !== 'ALL' ? { type } : {}),
      ...(rangeInfo.from ? { date: { gte: rangeInfo.from, lte: rangeInfo.to } } : {}),
    },
    include: { expenseCategory: true, items: true },
    orderBy: { date: 'desc' },
  });

  const headers = [
    'Fecha', 'Tipo', 'Categoría', 'Descripción', 'Proveedor', 'Monto (S/)',
    'Método de pago', 'Ítems de stock', 'Notas',
  ];

  const rows = expenses.map((expense) => [
    fmtDate(expense.date),
    expense.type === 'INVESTMENT' ? 'Inversión en mercadería' : 'Gasto operativo',
    expense.expenseCategory?.name || 'Sin categoría',
    expense.description,
    expense.supplier || '',
    money(expense.amount),
    expense.paymentMethod || '',
    expense.items.map((item) => `${item.quantity}x ${item.productName}`).join(' | '),
    expense.notes || '',
  ]);

  sendCSV(res, `gastos-${rangeInfo.key}-${Date.now()}.csv`, toCSV(headers, rows));
}
