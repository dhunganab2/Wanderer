import { UserModel } from '../models/User.js';

export const userService = {
  async getUserProfile(userId) {
    try {
      console.log(`🔍 Getting user profile for: ${userId}`);
      const user = await UserModel.findById(userId);
      
      if (user) {
        console.log(`✅ Found user profile: ${user.name || 'Unknown'}`);
        return user;
      } else {
        console.log(`❌ No user profile found for: ${userId}`);
        return null; // Return null instead of fake data
      }
    } catch (error) {
      console.error('❌ Error getting user profile:', error);
      throw error; // Throw error instead of returning fake data
    }
  },

  async createUserProfile(userData) {
    try {
      console.log('Creating user profile:', userData);
      return await UserModel.create(userData);
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },

  async updateUserProfile(userId, updates) {
    try {
      console.log(`Updating user ${userId}:`, updates);
      return await UserModel.update(userId, updates);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  async deleteUserProfile(userId) {
    try {
      console.log(`Deleting user: ${userId}`);
      return await UserModel.delete(userId);
    } catch (error) {
      console.error('Error deleting user profile:', error);
      throw error;
    }
  },

  async getDiscoveryUsers(userId, swipedUserIds = []) {
    try {
      console.log(`Getting discovery users for ${userId}, excluding:`, swipedUserIds);
      return await UserModel.getDiscoveryUsers(userId, swipedUserIds);
    } catch (error) {
      console.error('Error getting discovery users:', error);
      throw error;
    }
  },

  async getEnhancedDiscoveryUsers(userId, swipedUserIds = [], filters = {}, limit = 20) {
    try {
      console.log(`Getting enhanced discovery for ${userId} with filters:`, filters);
      // TODO: Implement enhanced matching algorithm
      // For now, return basic discovery users
      return await UserModel.getDiscoveryUsers(userId, swipedUserIds);
    } catch (error) {
      console.error('Error getting enhanced discovery users:', error);
      throw error;
    }
  },

  async getLocationBasedUsers(userId, center, radiusKm) {
    try {
      console.log(`Getting location-based users near ${center.lat}, ${center.lng} within ${radiusKm}km`);
      return await UserModel.getByLocation(center, radiusKm);
    } catch (error) {
      console.error('Error getting location-based users:', error);
      throw error;
    }
  },

  async isProfileComplete(userId) {
    try {
      console.log(`Checking profile completeness for: ${userId}`);
      return await UserModel.isProfileComplete(userId);
    } catch (error) {
      console.error('Error checking profile completeness:', error);
      throw error;
    }
  }
};
