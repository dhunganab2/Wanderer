import express from 'express';
import { messagingController } from '../controllers/messagingController.js';

const router = express.Router();

// Messaging routes
router.get('/conversations/:userId', messagingController.getConversations);
router.get('/messages/:conversationId', messagingController.getMessages);
router.post('/messages', messagingController.sendMessage);
router.post('/conversations', messagingController.createConversation);

// Message status routes
router.put('/conversations/:conversationId/read', messagingController.markMessagesAsRead);

// System info routes
router.get('/online-users', messagingController.getOnlineUsers);

export default router;
