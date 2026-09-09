import { Router } from 'express';
import { sendMessage, addReaction, deleteMessage } from '../controllers/messageController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.post('/', sendMessage);
router.post('/:id/reactions', addReaction);
router.delete('/:id', deleteMessage);

export default router;
