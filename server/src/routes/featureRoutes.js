import { Router } from 'express';
import {
  toggleStarMessage,
  getStarredMessages,
  togglePinChat,
  toggleMuteChat,
  getUserPreferences,
} from '../controllers/featureController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/preferences', getUserPreferences);
router.post('/messages/:messageId/star', toggleStarMessage);
router.get('/messages/starred', getStarredMessages);
router.post('/chats/:conversationId/pin', togglePinChat);
router.post('/chats/:conversationId/mute', toggleMuteChat);

export default router;
