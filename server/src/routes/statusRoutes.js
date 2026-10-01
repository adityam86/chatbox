import { Router } from 'express';
import { createStatus, getStatuses, deleteStatus } from '../controllers/statusController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.post('/', createStatus);
router.get('/', getStatuses);
router.delete('/:id', deleteStatus);

export default router;
