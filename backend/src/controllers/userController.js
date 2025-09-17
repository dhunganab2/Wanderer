import { userService } from '../services/userService.js';

export const userController = {
  // Get user profile
  async getUserProfile(req, res) {
    try {
      const { userId } = req.params;
      const user = await userService.getUserProfile(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error getting user profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Create user profile
  async createUserProfile(req, res) {
    try {
      const userData = req.body;
      const userId = await userService.createUserProfile(userData);
      
      res.status(201).json({ 
        message: 'User profile created successfully',
        userId 
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Update user profile
  async updateUserProfile(req, res) {
    try {
      const { userId } = req.params;
      const updates = req.body;
      
      await userService.updateUserProfile(userId, updates);
      
      res.json({ message: 'User profile updated successfully' });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Delete user profile
  async deleteUserProfile(req, res) {
    try {
      const { userId } = req.params;
      await userService.deleteUserProfile(userId);
      
      res.json({ message: 'User profile deleted successfully' });
    } catch (error) {
      console.error('Error deleting user profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get discovery users
  async getDiscoveryUsers(req, res) {
    try {
      const { userId } = req.params;
      const { swipedUserIds = [] } = req.query;
      
      const users = await userService.getDiscoveryUsers(userId, swipedUserIds);
      res.json(users);
    } catch (error) {
      console.error('Error getting discovery users:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get enhanced discovery users
  async getEnhancedDiscoveryUsers(req, res) {
    try {
      const { userId } = req.params;
      const { swipedUserIds = [], limit = 20 } = req.query;
      const filters = req.body;
      
      const users = await userService.getEnhancedDiscoveryUsers(
        userId, 
        swipedUserIds, 
        filters, 
        parseInt(limit)
      );
      res.json(users);
    } catch (error) {
      console.error('Error getting enhanced discovery users:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get location-based users
  async getLocationBasedUsers(req, res) {
    try {
      const { userId } = req.params;
      const { lat, lng, radius = 50 } = req.query;
      
      const users = await userService.getLocationBasedUsers(
        userId,
        { lat: parseFloat(lat), lng: parseFloat(lng) },
        parseFloat(radius)
      );
      res.json(users);
    } catch (error) {
      console.error('Error getting location-based users:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Check if profile is complete
  async isProfileComplete(req, res) {
    try {
      const { userId } = req.params;
      const isComplete = await userService.isProfileComplete(userId);
      
      res.json({ isComplete });
    } catch (error) {
      console.error('Error checking profile completeness:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
