import { num, round2 } from './money.js';

export function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    businessName: user.businessName,
    whatsappPhone: user.whatsappPhone || null,
    catalogSlug: user.catalogSlug || null,
    createdAt: user.createdAt,
  };
}

export function serializeCategory(category) {
  return {
    ...category,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    productCount: category._count?.products ?? category.productCount ?? undefined,
    childrenCount: category._count?.children ?? undefined,
    children: category.children ? category.children.map(serializeCategory) : undefined,
  };
}

export function serializeProduct(product) {
  const costPrice = num(product.costPrice);
  const listPrice = num(product.listPrice);
  const stock = product.stock ?? 0;
  const threshold = product.lowStockThreshold ?? 2;
  return {
    ...product,
    costPrice,
    listPrice,
    margin: round2(listPrice - costPrice),
    marginPercent: costPrice > 0 ? round2(((listPrice - costPrice) / costPrice) * 100) : 0,
    investedValue: round2(costPrice * stock),
    retailValue: round2(listPrice * stock),
    lowStock: stock <= threshold,
    outOfStock: stock <= 0,
    category: product.category ? serializeCategory(product.category) : null,
  };
}

function serializeSaleItem(item) {
  return {
    ...item,
    listPrice: num(item.listPrice),
    finalSoldPrice: num(item.finalSoldPrice),
    costPrice: num(item.costPrice),
    discount: num(item.discount),
    lineTotal: num(item.lineTotal),
    lineCost: num(item.lineCost),
    lineProfit: num(item.lineProfit),
    lineDiscount: num(item.discount),
  };
}

export function serializeSale(sale) {
  return {
    ...sale,
    subtotal: num(sale.subtotal),
    totalDiscount: num(sale.totalDiscount),
    total: num(sale.total),
    totalCost: num(sale.totalCost),
    profit: num(sale.profit),
    items: sale.items ? sale.items.map(serializeSaleItem) : undefined,
  };
}

function serializeExpenseItem(item) {
  return {
    ...item,
    unitCost: num(item.unitCost),
    lineTotal: num(item.lineTotal),
  };
}

export function serializeExpense(expense) {
  return {
    ...expense,
    amount: num(expense.amount),
    items: expense.items ? expense.items.map(serializeExpenseItem) : undefined,
  };
}
