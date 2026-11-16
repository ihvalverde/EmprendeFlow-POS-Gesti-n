import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const round = (n) => Math.round(Number(n) * 100) / 100;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const DEFAULT_CATEGORIES = [
  { name: 'Juguetes Niño', color: '#4F46E5', icon: 'Rocket' },
  { name: 'Juguetes Niña', color: '#EC4899', icon: 'Heart' },
  { name: 'Unisex', color: '#0EA5E9', icon: 'Shapes' },
  { name: 'General', color: '#64748B', icon: 'Tag' },
];

const EXPENSE_CATEGORIES = [
  { name: 'Mercadería', color: '#EF4444', type: 'INVESTMENT' },
  { name: 'Pasajes / Transporte', color: '#F97316', type: 'OPERATING' },
  { name: 'Comida / Viáticos', color: '#F59E0B', type: 'OPERATING' },
  { name: 'Empaques / Bolsas', color: '#8B5CF6', type: 'OPERATING' },
  { name: 'Publicidad', color: '#0EA5E9', type: 'OPERATING' },
  { name: 'Otros', color: '#64748B', type: 'BOTH' },
];

const PRODUCTS = [
  { name: 'Carro de Control Remoto', variant: 'Edad 6+ / Azul', cost: 28, price: 45, stock: 36, cat: 'Juguetes Niño', sku: 'JN-001' },
  { name: 'Pista de Carreras con Luces', variant: 'Edad 4+ / Multicolor', cost: 38, price: 62, stock: 22, cat: 'Juguetes Niño', sku: 'JN-002' },
  { name: 'Bloques Didácticos 120 pzs', variant: 'Edad 3+', cost: 32, price: 52, stock: 30, cat: 'Juguetes Niño', sku: 'JN-003' },
  { name: 'Muñeca con Vestido Rosa', variant: '30 cm / Rosa', cost: 22, price: 38, stock: 40, cat: 'Juguetes Niña', sku: 'JÑ-001' },
  { name: 'Set de Cocina Infantil', variant: 'Edad 3+ / Pastel', cost: 35, price: 58, stock: 18, cat: 'Juguetes Niña', sku: 'JÑ-002' },
  { name: 'Kit de Belleza para Niñas', variant: 'Edad 5+', cost: 18, price: 32, stock: 2, cat: 'Juguetes Niña', sku: 'JÑ-003' },
  { name: 'Pelota Saltarina', variant: 'Unisex / 45 cm', cost: 12, price: 22, stock: 55, cat: 'Unisex', sku: 'UN-001' },
  { name: 'Rompecabezas Didáctico Madera', variant: 'Unisex / 24 pzs', cost: 15, price: 28, stock: 27, cat: 'Unisex', sku: 'UN-002' },
  { name: 'Títeres de Animales', variant: 'Set x4 / Unisex', cost: 20, price: 35, stock: 14, cat: 'Unisex', sku: 'UN-003' },
  { name: 'Bolsas de Regalo Temáticas', variant: 'Pack x10', cost: 6, price: 12, stock: 60, cat: 'General', sku: 'GE-001' },
  { name: 'Globos Metalizados', variant: 'Pack x5 / Surtido', cost: 4.5, price: 10, stock: 0, cat: 'General', sku: 'GE-002' },
  { name: 'Tarjetas de Cumpleaños', variant: 'Diseño variado', cost: 2, price: 6, stock: 48, cat: 'General', sku: 'GE-003' },
];

async function main() {
  console.log('🌱 Preparando datos de demostración...');

  const demoEmail = 'demo@emprendeflow.pe';
  await prisma.user.deleteMany({ where: { email: demoEmail } });

  const passwordHash = await bcrypt.hash('demo1234', 10);
  const user = await prisma.user.create({
    data: {
      name: 'Emprendedor Demo',
      email: demoEmail,
      passwordHash,
      businessName: 'Juguetes & Novedades Sofía',
    },
  });

  const categories = {};
  for (const cat of DEFAULT_CATEGORIES) {
    categories[cat.name] = await prisma.category.create({
      data: { ...cat, userId: user.id },
    });
  }

  const expenseCategories = {};
  for (const cat of EXPENSE_CATEGORIES) {
    expenseCategories[cat.name] = await prisma.expenseCategory.create({
      data: { ...cat, userId: user.id },
    });
  }

  const products = [];
  for (const p of PRODUCTS) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        sku: p.sku,
        variant: p.variant,
        costPrice: p.cost,
        listPrice: p.price,
        stock: p.stock,
        lowStockThreshold: 2,
        categoryId: categories[p.cat].id,
        userId: user.id,
      },
    });
    products.push(product);
  }

  const paymentMethods = ['EFECTIVO', 'YAPE', 'PLIN', 'TRANSFERENCIA', 'TARJETA'];
  const customers = ['Cliente mostrador', 'Rosa Quispe', 'María Fernández', 'Luis Huamán', 'Ana Torres', null];
  let saleNumber = 1;

  for (let i = 0; i < 70; i++) {
    const daysAgo = randomBetween(0, 165);
    const soldAt = new Date();
    soldAt.setDate(soldAt.getDate() - daysAgo);
    soldAt.setHours(randomBetween(9, 20), randomBetween(0, 59), 0, 0);

    const lineCount = randomBetween(1, 3);
    const chosen = [];
    const used = new Set();
    for (let j = 0; j < lineCount; j++) {
      let product = pick(products);
      let guard = 0;
      while (used.has(product.id) && guard < 10) {
        product = pick(products);
        guard++;
      }
      if (used.has(product.id)) continue;
      used.add(product.id);
      chosen.push(product);
    }

    const items = chosen.map((product) => {
      const quantity = randomBetween(1, 2);
      const listPrice = Number(product.listPrice);
      const costPrice = Number(product.costPrice);
      const finalSoldPrice = Math.random() < 0.3 ? round(listPrice - randomBetween(1, 5)) : listPrice;
      const discount = round((listPrice - finalSoldPrice) * quantity);
      const lineTotal = round(finalSoldPrice * quantity);
      const lineCost = round(costPrice * quantity);
      const category = DEFAULT_CATEGORIES.find((c) => c.name === PRODUCTS.find((p) => p.sku === product.sku).cat);
      return {
        productId: product.id,
        productName: product.name,
        variant: product.variant,
        categoryId: product.categoryId,
        categoryName: PRODUCTS.find((p) => p.sku === product.sku).cat,
        categoryColor: category?.color ?? '#64748B',
        quantity,
        listPrice,
        finalSoldPrice,
        costPrice,
        discount,
        lineTotal,
        lineCost,
        lineProfit: round(lineTotal - lineCost),
      };
    });

    const subtotal = round(items.reduce((s, i) => s + i.listPrice * i.quantity, 0));
    const total = round(items.reduce((s, i) => s + i.lineTotal, 0));
    const totalCost = round(items.reduce((s, i) => s + i.lineCost, 0));
    const totalDiscount = round(subtotal - total);

    await prisma.sale.create({
      data: {
        code: `V-${String(saleNumber).padStart(4, '0')}`,
        customerName: pick(customers),
        paymentMethod: pick(paymentMethods),
        status: 'COMPLETED',
        subtotal,
        totalDiscount,
        total,
        totalCost,
        profit: round(total - totalCost),
        itemCount: items.reduce((s, i) => s + i.quantity, 0),
        soldAt,
        userId: user.id,
        items: { create: items },
      },
    });
    saleNumber++;
  }

  const investmentLots = [
    { description: 'Lote de juguetes didácticos', amount: 480, supplier: 'Importaciones Lima SAC', items: [products[2], products[7]] },
    { description: 'Reposición de muñecas y sets', amount: 320, supplier: 'Distribuidora El Sol', items: [products[3], products[4]] },
    { description: 'Compra de bolsas y empaques', amount: 95, supplier: 'Bazar Mayorista', items: [products[9]] },
  ];

  for (let i = 0; i < investmentLots.length; i++) {
    const lot = investmentLots[i];
    const date = new Date();
    date.setDate(date.getDate() - randomBetween(3, 120));
    const lotItems = lot.items.map((p) => {
      const quantity = i === 0 ? 10 : randomBetween(8, 20);
      const unitCost = Number(p.costPrice);
      return {
        productId: p.id,
        productName: p.name,
        quantity,
        unitCost,
        lineTotal: round(unitCost * quantity),
      };
    });
    await prisma.expense.create({
      data: {
        type: 'INVESTMENT',
        description: lot.description,
        amount: lot.amount,
        supplier: lot.supplier,
        paymentMethod: pick(paymentMethods),
        date,
        userId: user.id,
        expenseCategoryId: expenseCategories['Mercadería'].id,
        items: { create: lotItems },
      },
    });
    for (const item of lotItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  }

  const operatingExpenses = [
    { description: 'Pasajes ida y vuelta a Gamarra', amount: 18, cat: 'Pasajes / Transporte' },
    { description: 'Almuerzo durante compras', amount: 15, cat: 'Comida / Viáticos' },
    { description: 'Bolsas kraft y cintas', amount: 35, cat: 'Empaques / Bolsas' },
    { description: 'Publicidad en redes sociales', amount: 40, cat: 'Publicidad' },
    { description: 'Movilidad a entrega de pedido', amount: 12, cat: 'Pasajes / Transporte' },
    { description: 'Etiquetas y stickers personalizados', amount: 25, cat: 'Empaques / Bolsas' },
    { description: 'Menú del día feria', amount: 12, cat: 'Comida / Viáticos' },
    { description: 'Impresión de boletas', amount: 10, cat: 'Otros' },
  ];

  for (let i = 0; i < 22; i++) {
    const expense = pick(operatingExpenses);
    const date = new Date();
    date.setDate(date.getDate() - randomBetween(0, 160));
    await prisma.expense.create({
      data: {
        type: 'OPERATING',
        description: expense.description,
        amount: round(expense.amount + randomBetween(-3, 4)),
        paymentMethod: pick(['EFECTIVO', 'YAPE', 'PLIN']),
        date,
        userId: user.id,
        expenseCategoryId: expenseCategories[expense.cat].id,
      },
    });
  }

  const salesCount = await prisma.sale.count({ where: { userId: user.id } });
  const expensesCount = await prisma.expense.count({ where: { userId: user.id } });

  console.log(`✅ Listo: ${products.length} productos, ${salesCount} ventas, ${expensesCount} movimientos de caja.`);
  console.log('🔑 Usuario demo: demo@emprendeflow.pe  |  Contraseña: demo1234');
}

main()
  .catch((error) => {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
