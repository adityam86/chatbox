import { Router } from 'express';
import { searchUsers, getUserProfile, updateProfile } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/search', searchUsers);
router.get('/profile/:id', getUserProfile);
router.put('/profile', updateProfile);

export default router;
