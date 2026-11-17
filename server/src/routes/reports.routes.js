import { Router } from 'express';
import {
  exportExpenses,
  exportExpensesPDF,
  exportInventory,
  exportInventoryPDF,
  exportSales,
  exportSalesPDF,
} from '../controllers/reports.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

router.use(requireAuth);
router.get('/inventory.csv', asyncHandler(exportInventory));
router.get('/inventory.pdf', asyncHandler(exportInventoryPDF));
router.get('/sales.csv', asyncHandler(exportSales));
router.get('/sales.pdf', asyncHandler(exportSalesPDF));
router.get('/expenses.csv', asyncHandler(exportExpenses));
router.get('/expenses.pdf', asyncHandler(exportExpensesPDF));

export default router;
