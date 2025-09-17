import express from 'express';
import { userController } from '../controllers/userController.js';

const router = express.Router();

// User profile routes
router.get('/:userId', userController.getUserProfile);
router.post('/', userController.createUserProfile);
router.put('/:userId', userController.updateUserProfile);
router.delete('/:userId', userController.deleteUserProfile);

// Discovery routes
router.get('/discovery/:userId', userController.getDiscoveryUsers);
router.get('/enhanced-discovery/:userId', userController.getEnhancedDiscoveryUsers);
router.get('/location-based/:userId', userController.getLocationBasedUsers);

// Profile validation
router.get('/:userId/complete', userController.isProfileComplete);

export default router;
