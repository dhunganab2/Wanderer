import express from 'express';
import { matchingController } from '../controllers/matchingController.js';

const router = express.Router();

// Swipe and matching routes
router.post('/swipe', matchingController.recordSwipe);
router.get('/matches/:userId', matchingController.getUserMatches);
router.post('/check-match', matchingController.checkForMatch);

// Compatibility and recommendations
router.get('/recommendations/:userId', matchingController.getRecommendations);
router.get('/compatibility/:userId1/:userId2', matchingController.getCompatibility);

export default router;
