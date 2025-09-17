import express from 'express';
import { bucketListController } from '../controllers/bucketListController.js';

const router = express.Router();

// Bucket list routes
router.get('/:userId', bucketListController.getUserBucketList);
router.post('/:userId', bucketListController.addBucketListItem);
router.put('/:itemId', bucketListController.updateBucketListItem);
router.patch('/:itemId/toggle', bucketListController.toggleBucketListItem);
router.delete('/:itemId', bucketListController.deleteBucketListItem);

export default router;
