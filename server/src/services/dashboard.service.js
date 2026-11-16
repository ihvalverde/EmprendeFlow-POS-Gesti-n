import { prisma } from '../lib/prisma.js';
import { num, round2, sumBy } from '../utils/money.js';
import {
  dateFilter,
  getRange,
  lastMonthKeys,
  limaMonthKey,
  monthLabel,
  percentChange,
  previousRange,
  startOfMonthsAgo,
} from '../utils/dates.js';

async function salesMetrics(userId, from, to, categoryId) {
  const items = await prisma.saleItem.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      sale: {
        userId,
        status: 'COMPLETED',
        ...(from || to ? { soldAt: dateFilter(from, to) } : {}),
      },
    },
    select: {
      saleId: true,
      quantity: true,
      listPrice: true,
      lineTotal: true,
      lineCost: true,
      lineProfit: true,
      discount: true,
    },
  });

  return {
    revenue: sumBy(items, (item) => item.lineTotal),
    costOfGoods: sumBy(items, (item) => item.lineCost),
    grossProfit: sumBy(items, (item) => item.lineProfit),
    discounts: sumBy(items, (item) => item.discount),
    subtotal: sumBy(items, (item) => num(item.listPrice) * item.quantity),
    itemsSold: items.reduce((sum, item) => sum + item.quantity, 0),
    salesCount: new Set(items.map((item) => item.saleId)).size,
  };
}

async function expenseTotals(userId, from, to) {
  const groups = await prisma.expense.groupBy({
    by: ['type'],
    where: { userId, ...(from || to ? { date: dateFilter(from, to) } : {}) },
    _sum: { amount: true },
  });

  const totals = { INVESTMENT: 0, OPERATING: 0 };
  for (const group of groups) {
    totals[group.type] = round2(group._sum.amount || 0);
  }
  return totals;
}

export async function getSummary(userId, { range = 'month', categoryId = null } = {}) {
  const rangeInfo = getRange(range);
  const bounds = rangeInfo.from ? { from: rangeInfo.from, to: rangeInfo.to } : { from: null, to: null };

  const [sales, expenses, products] = await Promise.all([
    salesMetrics(userId, bounds.from, bounds.to, categoryId),
    expenseTotals(userId, bounds.from, bounds.to),
    prisma.product.findMany({
      where: { userId, archived: false },
      include: { category: true },
      orderBy: { stock: 'asc' },
    }),
  ]);

  const invested = expenses.INVESTMENT;
  const operating = expenses.OPERATING;
  const netProfit = round2(sales.grossProfit - operating);
  const totalOut = round2(invested + operating);
  const recoveryPercent = totalOut > 0 ? round2((sales.revenue / totalOut) * 100) : sales.revenue > 0 ? 100 : 0;

  const lowStock = products
    .filter((product) => product.stock <= (product.lowStockThreshold ?? 2))
    .slice(0, 8)
    .map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      variant: product.variant,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      category: product.category ? { name: product.category.name, color: product.category.color } : null,
    }));

  const inventory = {
    count: products.length,
    units: products.reduce((sum, product) => sum + product.stock, 0),
    investedValue: round2(products.reduce((sum, product) => sum + num(product.costPrice) * product.stock, 0)),
    retailValue: round2(products.reduce((sum, product) => sum + num(product.listPrice) * product.stock, 0)),
    lowStockCount: products.filter((product) => product.stock <= (product.lowStockThreshold ?? 2)).length,
    outOfStock: products.filter((product) => product.stock <= 0).length,
  };

  let trends = null;
  const prev = previousRange({ from: bounds.from, to: bounds.to });
  if (prev) {
    const [prevSales, prevExpenses] = await Promise.all([
      salesMetrics(userId, prev.from, prev.to, categoryId),
      expenseTotals(userId, prev.from, prev.to),
    ]);
    const prevNet = round2(prevSales.grossProfit - prevExpenses.OPERATING);
    trends = {
      revenue: percentChange(sales.revenue, prevSales.revenue),
      grossProfit: percentChange(sales.grossProfit, prevSales.grossProfit),
      netProfit: percentChange(netProfit, prevNet),
      salesCount: percentChange(sales.salesCount, prevSales.salesCount),
      itemsSold: percentChange(sales.itemsSold, prevSales.itemsSold),
    };
  }

  return {
    range: {
      key: rangeInfo.key,
      label: rangeInfo.label,
      from: rangeInfo.from,
      to: rangeInfo.to,
    },
    categoryId,
    revenue: sales.revenue,
    subtotal: sales.subtotal,
    costOfGoods: sales.costOfGoods,
    grossProfit: sales.grossProfit,
    netProfit,
    invested,
    operating,
    totalOut,
    discounts: sales.discounts,
    itemsSold: sales.itemsSold,
    salesCount: sales.salesCount,
    averageTicket: sales.salesCount > 0 ? round2(sales.revenue / sales.salesCount) : 0,
    marginPercent: sales.revenue > 0 ? round2((sales.grossProfit / sales.revenue) * 100) : 0,
    capital: {
      totalOut,
      recovered: sales.revenue >= totalOut,
      recoveryPercent,
      remaining: round2(Math.max(totalOut - sales.revenue, 0)),
    },
    inventory,
    lowStock,
    trends,
  };
}

export async function getCharts(userId, { range = 'month', categoryId = null } = {}) {
  const rangeInfo = getRange(range);
  const from = rangeInfo.from;
  const to = rangeInfo.to;
  const monthKeys = lastMonthKeys(6);
  const sixMonthsStart = startOfMonthsAgo(5);

  const saleSelect = {
    soldAt: true,
    total: true,
    totalCost: true,
    profit: true,
    ...(categoryId
      ? { items: { where: { categoryId }, select: { lineTotal: true, lineCost: true, lineProfit: true } } }
      : {}),
  };

  const rangeSaleWhere = {
    userId,
    status: 'COMPLETED',
    ...(from || to ? { soldAt: dateFilter(from, to) } : {}),
    ...(categoryId ? { items: { some: { categoryId } } } : {}),
  };

  const [lastSales, lastExpenses, rangeItems, discountSales, paymentTotals] = await Promise.all([
    prisma.sale.findMany({
      where: { userId, status: 'COMPLETED', soldAt: { gte: sixMonthsStart } },
      select: saleSelect,
    }),
    prisma.expense.findMany({
      where: { userId, date: { gte: sixMonthsStart } },
      select: { date: true, amount: true, type: true },
    }),
    prisma.saleItem.findMany({
      where: {
        ...(categoryId ? { categoryId } : {}),
        sale: {
          userId,
          status: 'COMPLETED',
          ...(from || to ? { soldAt: dateFilter(from, to) } : {}),
        },
      },
      select: {
        saleId: true,
        productId: true,
        productName: true,
        variant: true,
        categoryId: true,
        categoryName: true,
        categoryColor: true,
        quantity: true,
        lineTotal: true,
        lineProfit: true,
      },
    }),
    prisma.sale.findMany({
      where: {
        ...rangeSaleWhere,
        ...(categoryId ? {} : { totalDiscount: { gt: 0 } }),
      },
      orderBy: { soldAt: 'desc' },
      take: categoryId ? 40 : 8,
      select: {
        id: true,
        code: true,
        customerName: true,
        subtotal: true,
        totalDiscount: true,
        total: true,
        soldAt: true,
        paymentMethod: true,
        ...(categoryId
          ? {
              items: {
                where: { categoryId },
                select: { listPrice: true, quantity: true, lineTotal: true },
              },
            }
          : {}),
      },
    }),
    categoryId
      ? prisma.sale
          .findMany({
            where: rangeSaleWhere,
            select: {
              paymentMethod: true,
              items: { where: { categoryId }, select: { lineTotal: true } },
            },
          })
          .then((sales) => {
            const map = new Map();
            for (const sale of sales) {
              const total = sumBy(sale.items, (item) => item.lineTotal);
              const current = map.get(sale.paymentMethod) || {
                method: sale.paymentMethod,
                total: 0,
                count: 0,
              };
              current.total = round2(current.total + total);
              current.count += 1;
              map.set(sale.paymentMethod, current);
            }
            return [...map.values()].sort((a, b) => b.total - a.total);
          })
      : prisma.sale
          .groupBy({
            by: ['paymentMethod'],
            where: rangeSaleWhere,
            _sum: { total: true },
            _count: { _all: true },
          })
          .then((groups) =>
            groups
              .map((group) => ({
                method: group.paymentMethod,
                total: num(group._sum.total),
                count: group._count._all,
              }))
              .sort((a, b) => b.total - a.total)
          ),
  ]);

  const monthlyMap = new Map(
    monthKeys.map((key) => [
      key,
      { key, label: monthLabel(key), revenue: 0, costOfGoods: 0, operating: 0, invested: 0, profit: 0 },
    ])
  );

  for (const sale of lastSales) {
    const key = limaMonthKey(sale.soldAt);
    const bucket = monthlyMap.get(key);
    if (!bucket) continue;

    if (categoryId) {
      const revenue = sumBy(sale.items || [], (item) => item.lineTotal);
      const cost = sumBy(sale.items || [], (item) => item.lineCost);
      bucket.revenue = round2(bucket.revenue + revenue);
      bucket.costOfGoods = round2(bucket.costOfGoods + cost);
      bucket.profit = round2(bucket.profit + sumBy(sale.items || [], (item) => item.lineProfit));
    } else {
      bucket.revenue = round2(bucket.revenue + num(sale.total));
      bucket.costOfGoods = round2(bucket.costOfGoods + num(sale.totalCost));
      bucket.profit = round2(bucket.profit + num(sale.profit));
    }
  }

  for (const expense of lastExpenses) {
    const key = limaMonthKey(expense.date);
    const bucket = monthlyMap.get(key);
    if (!bucket) continue;
    if (expense.type === 'OPERATING') {
      bucket.operating = round2(bucket.operating + num(expense.amount));
    } else {
      bucket.invested = round2(bucket.invested + num(expense.amount));
    }
  }

  const monthly = [...monthlyMap.values()].map((bucket) => ({
    ...bucket,
    netProfit: round2(bucket.profit - bucket.operating),
  }));

  const categoryMap = new Map();
  for (const item of rangeItems) {
    const key = item.categoryId || 'sin-categoria';
    if (!categoryMap.has(key)) {
      categoryMap.set(key, {
        id: item.categoryId,
        name: item.categoryName || 'Sin categoría',
        color: item.categoryColor || '#64748B',
        revenue: 0,
        profit: 0,
        units: 0,
      });
    }
    const bucket = categoryMap.get(key);
    bucket.revenue = round2(bucket.revenue + num(item.lineTotal));
    bucket.profit = round2(bucket.profit + num(item.lineProfit));
    bucket.units += item.quantity;
  }

  const productMap = new Map();
  for (const item of rangeItems) {
    const key = item.productId || `${item.productName}::${item.variant || ''}`;
    if (!productMap.has(key)) {
      productMap.set(key, {
        id: item.productId,
        name: item.productName,
        variant: item.variant,
        categoryName: item.categoryName,
        quantity: 0,
        revenue: 0,
        profit: 0,
      });
    }
    const bucket = productMap.get(key);
    bucket.quantity += item.quantity;
    bucket.revenue = round2(bucket.revenue + num(item.lineTotal));
    bucket.profit = round2(bucket.profit + num(item.lineProfit));
  }

  const products = [...productMap.values()];

  const discounts = discountSales
    .map((sale) => {
      if (!categoryId) {
        return {
          ...sale,
          subtotal: num(sale.subtotal),
          totalDiscount: num(sale.totalDiscount),
          total: num(sale.total),
        };
      }

      const subtotal = sumBy(sale.items, (item) => num(item.listPrice) * item.quantity);
      const total = sumBy(sale.items, (item) => item.lineTotal);
      return {
        ...sale,
        items: undefined,
        subtotal: round2(subtotal),
        totalDiscount: round2(Math.max(subtotal - total, 0)),
        total: round2(total),
      };
    })
    .filter((sale) => sale.totalDiscount > 0)
    .slice(0, 8);

  return {
    range: { key: rangeInfo.key, label: rangeInfo.label, from, to },
    monthly,
    categories: [...categoryMap.values()].sort((a, b) => b.revenue - a.revenue),
    topByUnits: [...products].sort((a, b) => b.quantity - a.quantity).slice(0, 5),
    topByProfit: [...products].sort((a, b) => b.profit - a.profit).slice(0, 5),
    discounts,
    paymentMethods: paymentTotals,
  };
}
