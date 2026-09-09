import { Router } from 'express';
import {
  getUserConversations,
  getOrCreateConversation,
  getConversationMessages,
  createGroup,
  getGroupMembers,
  clearConversationMessages,
} from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getUserConversations);
router.post('/', getOrCreateConversation);
router.post('/group', createGroup);
router.get('/:id/messages', getConversationMessages);
router.delete('/:id/messages', clearConversationMessages);
router.get('/:id/members', getGroupMembers);

export default router;
