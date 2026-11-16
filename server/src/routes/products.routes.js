import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  productSchema,
  productUpdateSchema,
  updateProduct,
} from '../controllers/products.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(listProducts));
router.get('/:id', asyncHandler(getProduct));
router.post('/', validate(productSchema), asyncHandler(createProduct));
router.patch('/:id', validate(productUpdateSchema), asyncHandler(updateProduct));
router.delete('/:id', asyncHandler(deleteProduct));

export default router;
