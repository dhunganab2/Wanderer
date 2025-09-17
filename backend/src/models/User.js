import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/database.js';

export class UserModel {
  static collection = 'users';

  // Create user profile
  static async create(userData) {
    try {
      const userRef = doc(db, this.collection, userData.id);
      const userDoc = {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActive: serverTimestamp()
      };
      
      await updateDoc(userRef, userDoc);
      return userData.id;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Get user by ID
  static async findById(userId) {
    try {
      const userRef = doc(db, this.collection, userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  // Update user
  static async update(userId, updates) {
    try {
      const userRef = doc(db, this.collection, userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        lastActive: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user
  static async delete(userId) {
    try {
      const userRef = doc(db, this.collection, userId);
      await deleteDoc(userRef);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Get discovery users (excluding current user and already swiped)
  static async getDiscoveryUsers(currentUserId, swipedUserIds = [], limitCount = 50) {
    try {
      const usersQuery = query(
        collection(db, this.collection),
        where('id', '!=', currentUserId),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      const users = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => !swipedUserIds.includes(user.id));
      
      return users;
    } catch (error) {
      console.error('Error getting discovery users:', error);
      throw error;
    }
  }

  // Get users by location
  static async getByLocation(center, radiusKm) {
    try {
      // Note: Firestore doesn't have native geo queries
      // This would need to be implemented with a geohash or similar approach
      // For now, we'll get all users and filter in memory
      const usersQuery = query(collection(db, this.collection));
      const querySnapshot = await getDocs(usersQuery);
      
      const users = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => {
          if (!user.coordinates) return false;
          // Calculate distance (simplified)
          const distance = this.calculateDistance(center, user.coordinates);
          return distance <= radiusKm;
        });
      
      return users;
    } catch (error) {
      console.error('Error getting users by location:', error);
      throw error;
    }
  }

  // Check if profile is complete
  static async isProfileComplete(userId) {
    try {
      const user = await this.findById(userId);
      if (!user) return false;

      const requiredFields = ['name', 'age', 'bio', 'travelStyle'];
      return requiredFields.every(field => {
        const value = user[field];
        return value !== undefined && value !== '' && 
               (Array.isArray(value) ? value.length > 0 : true);
      });
    } catch (error) {
      console.error('Error checking profile completeness:', error);
      throw error;
    }
  }

  // Helper function to calculate distance between two points
  static calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(point2.lat - point1.lat);
    const dLon = this.deg2rad(point2.lng - point1.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(point1.lat)) * Math.cos(this.deg2rad(point2.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  static deg2rad(deg) {
    return deg * (Math.PI/180);
  }
}
