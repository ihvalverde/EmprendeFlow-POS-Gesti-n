import { Router } from 'express';
import {
  categorySchema,
  categoryUpdateSchema,
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../controllers/categories.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(listCategories));
router.post('/', validate(categorySchema), asyncHandler(createCategory));
router.patch('/:id', validate(categoryUpdateSchema), asyncHandler(updateCategory));
router.delete('/:id', asyncHandler(deleteCategory));

export default router;
