import { prisma } from '../lib/prisma.js';
import { getRange } from '../utils/dates.js';
import { toCSV, sendCSV } from '../utils/csv.js';
import { num, round2 } from '../utils/money.js';
import { streamReportPDF } from '../utils/pdfReport.js';

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima',
  dateStyle: 'short',
  timeStyle: 'short',
});

const dayFormatter = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima',
  dateStyle: 'short',
});

const numberFormatter = new Intl.NumberFormat('es-PE');
const moneyFormatter = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const fmtDateTime = (value) => (value ? dateFormatter.format(new Date(value)) : '');
const fmtDate = (value) => (value ? dayFormatter.format(new Date(value)) : '');
const money = (value) => round2(num(value)).toFixed(2);
const pdfMoney = (value) => `S/ ${moneyFormatter.format(round2(num(value)))}`;
const pdfCount = (value) => numberFormatter.format(Math.round(num(value)));

const inventoryColumns = [
  { label: 'Producto', index: 0, width: 140 },
  { label: 'SKU', index: 1, width: 55 },
  { label: 'Variante', index: 2, width: 82 },
  { label: 'Categoría', index: 3, width: 72 },
  { label: 'Stock', index: 4, width: 42, align: 'right' },
  { label: 'Costo', index: 5, width: 55, align: 'right' },
  { label: 'Precio', index: 6, width: 55, align: 'right' },
  { label: 'Margen', index: 7, width: 55, align: 'right' },
  { label: 'Invertido', index: 8, width: 60, align: 'right' },
  { label: 'Potencial', index: 9, width: 65, align: 'right' },
  { label: 'Estado', index: 10, width: 55 },
  { label: 'Creado', index: 11, width: 55 },
];

const salesColumns = [
  { label: 'Código', index: 0, width: 65 },
  { label: 'Fecha', index: 1, width: 72 },
  { label: 'Cliente', index: 2, width: 90 },
  { label: 'Productos', index: 3, width: 175 },
  { label: 'Cant.', index: 4, width: 35, align: 'right' },
  { label: 'Total', index: 7, width: 62, align: 'right' },
  { label: 'Costo', index: 8, width: 60, align: 'right' },
  { label: 'Ganancia', index: 9, width: 65, align: 'right' },
  { label: 'Pago', index: 10, width: 55 },
  { label: 'Estado', index: 11, width: 55 },
];

const expenseColumns = [
  { label: 'Fecha', index: 0, width: 62 },
  { label: 'Tipo', index: 1, width: 78 },
  { label: 'Categoría', index: 2, width: 78 },
  { label: 'Descripción', index: 3, width: 150 },
  { label: 'Proveedor', index: 4, width: 82 },
  { label: 'Monto', index: 5, width: 60, align: 'right' },
  { label: 'Pago', index: 6, width: 58 },
  { label: 'Ítems de stock', index: 7, width: 120 },
  { label: 'Notas', index: 8, width: 82 },
];

async function getBusinessName(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { businessName: true },
  });
  return user?.businessName || 'EmprendeFlow';
}

function sendCSVReport(res, report) {
  sendCSV(res, `${report.filename}.csv`, toCSV(report.headers, report.rows));
}

async function sendPDFReport(req, res, report) {
  const businessName = await getBusinessName(req.userId);
  streamReportPDF(res, {
    ...report,
    businessName,
    filename: `${report.filename}.pdf`,
  });
}

async function buildInventoryReport(req) {
  const includeArchived = req.query.includeArchived === 'true';

  const products = await prisma.product.findMany({
    where: { userId: req.userId, ...(includeArchived ? {} : { archived: false }) },
    include: { category: true },
    orderBy: { name: 'asc' },
  });

  const headers = [
    'Producto', 'SKU', 'Variante', 'Categoría', 'Stock', 'Costo unitario (S/)',
    'Precio lista (S/)', 'Margen unitario (S/)', 'Valor invertido (S/)',
    'Valor venta potencial (S/)', 'Estado', 'Creado',
  ];

  let totalStock = 0;
  let totalInvested = 0;
  let totalPotential = 0;

  const rows = products.map((product) => {
    const cost = num(product.costPrice);
    const price = num(product.listPrice);
    const invested = cost * product.stock;
    const potential = price * product.stock;

    totalStock += product.stock;
    totalInvested += invested;
    totalPotential += potential;

    return [
      product.name,
      product.sku || '',
      product.variant || '',
      product.category?.name || 'Sin categoría',
      product.stock,
      money(cost),
      money(price),
      money(price - cost),
      money(invested),
      money(potential),
      product.archived ? 'Archivado' : product.stock <= (product.lowStockThreshold ?? 2) ? 'Stock bajo' : 'Activo',
      fmtDate(product.createdAt),
    ];
  });

  return {
    title: 'Inventario de productos',
    subtitle: `${includeArchived ? 'Inventario completo, incluye archivados' : 'Inventario de productos activos'} · ${products.length} productos`,
    filename: `inventario-${Date.now()}`,
    headers,
    rows,
    columns: inventoryColumns,
    summary: [
      { label: 'Productos', value: pdfCount(products.length), tone: 'indigo' },
      { label: 'Unidades en stock', value: pdfCount(totalStock), tone: 'sky' },
      { label: 'Valor invertido', value: pdfMoney(totalInvested), tone: 'amber' },
      { label: 'Venta potencial', value: pdfMoney(totalPotential), tone: 'emerald' },
    ],
  };
}

async function buildSalesReport(req) {
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

  let totalRevenue = 0;
  let totalCost = 0;
  let totalProfit = 0;

  const rows = sales.map((sale) => {
    totalRevenue += num(sale.total);
    totalCost += num(sale.totalCost);
    totalProfit += num(sale.profit);

    return [
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
    ];
  });

  return {
    title: 'Reporte de ventas',
    subtitle: `Periodo: ${rangeInfo.label} · ${sales.length} ventas`,
    filename: `ventas-${rangeInfo.key}-${Date.now()}`,
    headers,
    rows,
    columns: salesColumns,
    summary: [
      { label: 'Ventas', value: pdfCount(sales.length), tone: 'indigo' },
      { label: 'Total cobrado', value: pdfMoney(totalRevenue), tone: 'emerald' },
      { label: 'Costo', value: pdfMoney(totalCost), tone: 'amber' },
      { label: 'Ganancia bruta', value: pdfMoney(totalProfit), tone: 'violet' },
    ],
  };
}

async function buildExpensesReport(req) {
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

  let totalAmount = 0;
  let investmentAmount = 0;
  let operatingAmount = 0;

  const rows = expenses.map((expense) => {
    const amount = num(expense.amount);
    totalAmount += amount;
    if (expense.type === 'INVESTMENT') investmentAmount += amount;
    else operatingAmount += amount;

    return [
      fmtDate(expense.date),
      expense.type === 'INVESTMENT' ? 'Inversión en mercadería' : 'Gasto operativo',
      expense.expenseCategory?.name || 'Sin categoría',
      expense.description,
      expense.supplier || '',
      money(amount),
      expense.paymentMethod || '',
      expense.items.map((item) => `${item.quantity}x ${item.productName}`).join(' | '),
      expense.notes || '',
    ];
  });

  const typeLabel = type === 'INVESTMENT' ? ' · Solo inversiones' : type === 'OPERATING' ? ' · Solo operativos' : '';

  return {
    title: 'Gastos e inversiones',
    subtitle: `Periodo: ${rangeInfo.label} · ${expenses.length} registros${typeLabel}`,
    filename: `gastos-${rangeInfo.key}-${Date.now()}`,
    headers,
    rows,
    columns: expenseColumns,
    summary: [
      { label: 'Registros', value: pdfCount(expenses.length), tone: 'indigo' },
      { label: 'Total', value: pdfMoney(totalAmount), tone: 'rose' },
      { label: 'Inversión', value: pdfMoney(investmentAmount), tone: 'amber' },
      { label: 'Operativo', value: pdfMoney(operatingAmount), tone: 'sky' },
    ],
  };
}

export async function exportInventory(req, res) {
  const report = await buildInventoryReport(req);
  sendCSVReport(res, report);
}

export async function exportInventoryPDF(req, res) {
  const report = await buildInventoryReport(req);
  await sendPDFReport(req, res, report);
}

export async function exportSales(req, res) {
  const report = await buildSalesReport(req);
  sendCSVReport(res, report);
}

export async function exportSalesPDF(req, res) {
  const report = await buildSalesReport(req);
  await sendPDFReport(req, res, report);
}

export async function exportExpenses(req, res) {
  const report = await buildExpensesReport(req);
  sendCSVReport(res, report);
}

export async function exportExpensesPDF(req, res) {
  const report = await buildExpensesReport(req);
  await sendPDFReport(req, res, report);
}
