import { Router } from 'express';
import {
  createExpense,
  deleteExpense,
  expenseSchema,
  expenseUpdateSchema,
  getExpense,
  listExpenses,
  updateExpense,
} from '../controllers/expenses.controller.js';
import {
  createExpenseCategory,
  deleteExpenseCategory,
  expenseCategorySchema,
  expenseCategoryUpdateSchema,
  listExpenseCategories,
  updateExpenseCategory,
} from '../controllers/expenseCategories.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

router.use(requireAuth);

router.get('/categories', asyncHandler(listExpenseCategories));
router.post('/categories', validate(expenseCategorySchema), asyncHandler(createExpenseCategory));
router.patch('/categories/:id', validate(expenseCategoryUpdateSchema), asyncHandler(updateExpenseCategory));
router.delete('/categories/:id', asyncHandler(deleteExpenseCategory));

router.get('/', asyncHandler(listExpenses));
router.get('/:id', asyncHandler(getExpense));
router.post('/', validate(expenseSchema), asyncHandler(createExpense));
router.patch('/:id', validate(expenseUpdateSchema), asyncHandler(updateExpense));
router.delete('/:id', asyncHandler(deleteExpense));

export default router;
