import { Router } from 'express';
import {
  login,
  loginSchema,
  logout,
  me,
  refresh,
  register,
  registerSchema,
  updateMe,
  updateMeSchema,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(register));
router.post('/login', validate(loginSchema), asyncHandler(login));
router.post('/refresh', asyncHandler(refresh));
router.post('/logout', asyncHandler(logout));
router.get('/me', requireAuth, asyncHandler(me));
router.patch('/me', requireAuth, validate(updateMeSchema), asyncHandler(updateMe));

export default router;
