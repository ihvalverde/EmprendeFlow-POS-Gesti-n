import { Router } from 'express';
import {
  exportExpenses,
  exportInventory,
  exportSales,
} from '../controllers/reports.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

router.use(requireAuth);
router.get('/inventory.csv', asyncHandler(exportInventory));
router.get('/sales.csv', asyncHandler(exportSales));
router.get('/expenses.csv', asyncHandler(exportExpenses));

export default router;
