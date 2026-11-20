import { Router } from 'express';
import { getPublicCatalog } from '../controllers/public.controller.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

router.get('/catalog/:slug', asyncHandler(getPublicCatalog));

export default router;