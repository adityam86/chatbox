import { Router } from 'express';
import { createStatus, getStatuses } from '../controllers/statusController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.post('/', createStatus);
router.get('/', getStatuses);

export default router;
