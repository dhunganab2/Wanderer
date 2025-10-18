import express from 'express';
import { matchingController } from '../controllers/matchingController.js';

const router = express.Router();

// Swipe and matching routes
router.post('/swipe', matchingController.recordSwipe);
router.get('/matches/:userId', matchingController.getUserMatches);
router.post('/check-match', matchingController.checkForMatch);
router.get('/likes-received/:userId', matchingController.getLikesReceived);

// Compatibility and recommendations
router.get('/recommendations/:userId', matchingController.getRecommendations);
router.get('/compatibility/:userId1/:userId2', matchingController.getCompatibility);

// Discovery modes
router.get('/smart-matches/:userId', matchingController.getSmartMatches);
router.get('/nearby-matches/:userId', matchingController.getNearbyMatches);
router.get('/explore-matches/:userId', matchingController.getExploreMatches);

// Admin/maintenance routes
router.post('/cleanup-duplicates', matchingController.cleanupDuplicateSwipes);

export default router;
