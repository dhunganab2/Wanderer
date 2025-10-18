import { matchingService } from '../services/matchingService.js';

export const matchingController = {
  async recordSwipe(req, res) {
    try {
      const { type, userId, swipedUserId } = req.body;
      console.log(`Recording swipe: ${type} from ${userId} to ${swipedUserId}`);

      if (!type || !userId || !swipedUserId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await matchingService.recordSwipe({ type, userId, swipedUserId });

      res.json({
        message: 'Swipe recorded successfully',
        match: result.match,
        matchId: result.matchId
      });
    } catch (error) {
      console.error('Error recording swipe:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getUserMatches(req, res) {
    try {
      const { userId } = req.params;
      console.log(`Getting matches for user: ${userId}`);

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const matches = await matchingService.getUserMatches(userId);
      res.json(matches);
    } catch (error) {
      console.error('Error getting matches:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async checkForMatch(req, res) {
    try {
      const { userId1, userId2 } = req.body;
      console.log(`Checking for match between ${userId1} and ${userId2}`);

      if (!userId1 || !userId2) {
        return res.status(400).json({ error: 'Both user IDs are required' });
      }

      const isMatch = await matchingService.checkMutualLike(userId1, userId2);
      res.json({ isMatch });
    } catch (error) {
      console.error('Error checking for match:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getRecommendations(req, res) {
    try {
      const { userId } = req.params;
      const { limit, ageRange, maxDistance, verified, travelStyles, destinations } = req.query;

      console.log(`Getting recommendations for user: ${userId}`);

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Build filters object
      const filters = {};
      if (ageRange) filters.ageRange = JSON.parse(ageRange);
      if (maxDistance) filters.maxDistance = parseInt(maxDistance);
      if (verified) filters.verified = verified === 'true';
      if (travelStyles) filters.travelStyles = JSON.parse(travelStyles);
      if (destinations) filters.destinations = JSON.parse(destinations);

      const recommendations = await matchingService.findMatches(
        userId,
        filters,
        limit ? parseInt(limit) : 20
      );

      res.json(recommendations);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getCompatibility(req, res) {
    try {
      const { userId1, userId2 } = req.params;
      console.log(`Getting compatibility between ${userId1} and ${userId2}`);

      if (!userId1 || !userId2) {
        return res.status(400).json({ error: 'Both user IDs are required' });
      }

      const compatibility = await matchingService.getCompatibility(userId1, userId2);
      res.json(compatibility);
    } catch (error) {
      console.error('Error getting compatibility:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getLikesReceived(req, res) {
    try {
      const { userId } = req.params;
      console.log(`Getting likes received for user: ${userId}`);

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const likesReceived = await matchingService.getLikesReceived(userId);
      res.json(likesReceived);
    } catch (error) {
      console.error('Error getting likes received:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async cleanupDuplicateSwipes(req, res) {
    try {
      console.log('Starting cleanup of duplicate swipes...');
      const result = await matchingService.cleanupDuplicateSwipes();
      res.json({
        message: 'Cleanup completed successfully',
        removed: result.removed
      });
    } catch (error) {
      console.error('Error cleaning up duplicate swipes:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getSmartMatches(req, res) {
    try {
      const { userId } = req.params;
      const { limit, ageRange, maxDistance, verified, travelStyles, destinations } = req.query;

      console.log(`🎯 Getting Smart Matches for user: ${userId}`);

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Build filters object
      const filters = {};
      if (ageRange) filters.ageRange = JSON.parse(ageRange);
      if (maxDistance) filters.maxDistance = parseInt(maxDistance);
      if (verified) filters.verified = verified === 'true';
      if (travelStyles) filters.travelStyles = JSON.parse(travelStyles);
      if (destinations) filters.destinations = JSON.parse(destinations);

      const matches = await matchingService.getSmartMatches(
        userId,
        filters,
        limit ? parseInt(limit) : 20
      );

      res.json(matches);
    } catch (error) {
      console.error('Error getting smart matches:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getNearbyMatches(req, res) {
    try {
      const { userId } = req.params;
      const { limit, ageRange, maxDistance, verified, travelStyles, destinations } = req.query;

      console.log(`📍 Getting Nearby Matches for user: ${userId}`);

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Build filters object
      const filters = {};
      if (ageRange) filters.ageRange = JSON.parse(ageRange);
      if (maxDistance) filters.maxDistance = parseInt(maxDistance);
      if (verified) filters.verified = verified === 'true';
      if (travelStyles) filters.travelStyles = JSON.parse(travelStyles);
      if (destinations) filters.destinations = JSON.parse(destinations);

      const matches = await matchingService.getNearbyMatches(
        userId,
        filters,
        limit ? parseInt(limit) : 20
      );

      res.json(matches);
    } catch (error) {
      console.error('Error getting nearby matches:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getExploreMatches(req, res) {
    try {
      const { userId } = req.params;
      const { limit, ageRange, maxDistance, verified, travelStyles, destinations } = req.query;

      console.log(`🎲 Getting Explore Matches for user: ${userId}`);

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Build filters object
      const filters = {};
      if (ageRange) filters.ageRange = JSON.parse(ageRange);
      if (maxDistance) filters.maxDistance = parseInt(maxDistance);
      if (verified) filters.verified = verified === 'true';
      if (travelStyles) filters.travelStyles = JSON.parse(travelStyles);
      if (destinations) filters.destinations = JSON.parse(destinations);

      const matches = await matchingService.getExploreMatches(
        userId,
        filters,
        limit ? parseInt(limit) : 20
      );

      res.json(matches);
    } catch (error) {
      console.error('Error getting explore matches:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
