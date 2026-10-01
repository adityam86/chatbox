import { Router } from 'express';
import {
  getUserConversations,
  getOrCreateConversation,
  getConversationMessages,
  getAllConversationMessages,
  createGroup,
  getGroupMembers,
  clearConversationMessages,
  addMemberToGroup,
  removeMemberFromGroup,
  updateMemberRole,
} from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getUserConversations);
router.post('/', getOrCreateConversation);
router.post('/group', createGroup);
router.get('/:id/messages', getConversationMessages);
router.get('/:id/messages/all', getAllConversationMessages);
router.delete('/:id/messages', clearConversationMessages);

router.get('/:id/members', getGroupMembers);
router.post('/:id/members', addMemberToGroup);
router.delete('/:id/members/:userId', removeMemberFromGroup);
router.put('/:id/members/:userId', updateMemberRole);

export default router;
