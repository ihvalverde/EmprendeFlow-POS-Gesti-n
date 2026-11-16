import { Router } from 'express';
import authRoutes from './auth.routes.js';
import categoriesRoutes from './categories.routes.js';
import productsRoutes from './products.routes.js';
import salesRoutes from './sales.routes.js';
import expensesRoutes from './expenses.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import reportsRoutes from './reports.routes.js';
import uploadsRoutes, { mediaRouter } from './uploads.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoriesRoutes);
router.use('/products', productsRoutes);
router.use('/sales', salesRoutes);
router.use('/expenses', expensesRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportsRoutes);
router.use('/uploads', uploadsRoutes);
router.use('/media', mediaRouter);

export default router;
