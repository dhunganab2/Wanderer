import express from 'express';
import { messagingController } from '../controllers/messagingController.js';

const router = express.Router();

// Messaging routes
router.get('/conversations/:userId', messagingController.getConversations);
router.get('/messages/:conversationId', messagingController.getMessages);
router.post('/messages', messagingController.sendMessage);
router.post('/conversations', messagingController.createConversation);

// Real-time messaging
router.get('/conversations/:userId/live', messagingController.subscribeToConversations);
router.get('/messages/:conversationId/live', messagingController.subscribeToMessages);

export default router;
