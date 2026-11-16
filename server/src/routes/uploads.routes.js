import { Router } from 'express';
import { serveMedia, uploadFile } from '../controllers/uploads.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { asyncHandler } from '../utils/AppError.js';

const router = Router();

router.post('/', requireAuth, upload.single('file'), asyncHandler(uploadFile));

export const mediaRouter = Router();
mediaRouter.get('/*', asyncHandler(serveMedia));

export default router;
