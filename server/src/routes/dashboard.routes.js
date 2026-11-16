import { Router } from 'express';
import { z } from 'zod';
import { getCharts, getSummary } from '../services/dashboard.service.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

const querySchema = z.object({
  range: z.enum(['today', 'week', 'month', 'all']).default('month'),
  categoryId: z
    .union([z.string().trim().min(1), z.literal(''), z.null()])
    .optional()
    .transform((value) => (value ? value : null)),
});

router.use(requireAuth);
router.get('/summary', validate(querySchema, 'query'), asyncHandler(async (req, res) => {
  const summary = await getSummary(req.userId, req.query);
  res.json(summary);
}));
router.get('/charts', validate(querySchema, 'query'), asyncHandler(async (req, res) => {
  const charts = await getCharts(req.userId, req.query);
  res.json(charts);
}));

export default router;
