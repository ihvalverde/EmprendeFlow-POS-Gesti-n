import { Router } from 'express';
import {
  cancelSale,
  createSale,
  getSale,
  listSales,
  saleSchema,
} from '../controllers/sales.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(listSales));
router.get('/:id', asyncHandler(getSale));
router.post('/', validate(saleSchema), asyncHandler(createSale));
router.post('/:id/cancel', asyncHandler(cancelSale));

export default router;
