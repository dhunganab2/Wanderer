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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/database.js';

export class SwipeModel {
  static collection = 'swipes';

  // Record a swipe action
  static async create(swipeData) {
    try {
      const docRef = await addDoc(collection(db, this.collection), {
        ...swipeData,
        timestamp: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating swipe:', error);
      throw error;
    }
  }

  // Get swipe history for a user
  static async getByUserId(userId) {
    try {
      const swipesQuery = query(
        collection(db, this.collection),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(swipesQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting swipes:', error);
      throw error;
    }
  }

  // Check if user has swiped on another user
  static async hasSwiped(userId, swipedUserId) {
    try {
      const swipesQuery = query(
        collection(db, this.collection),
        where('userId', '==', userId),
        where('swipedUserId', '==', swipedUserId)
      );

      const querySnapshot = await getDocs(swipesQuery);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking swipe:', error);
      throw error;
    }
  }

  // Get mutual likes (both users liked each other)
  static async getMutualLikes(userId1, userId2) {
    try {
      const swipesQuery1 = query(
        collection(db, this.collection),
        where('userId', '==', userId1),
        where('swipedUserId', '==', userId2),
        where('type', 'in', ['like', 'superlike'])
      );

      const swipesQuery2 = query(
        collection(db, this.collection),
        where('userId', '==', userId2),
        where('swipedUserId', '==', userId1),
        where('type', 'in', ['like', 'superlike'])
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(swipesQuery1),
        getDocs(swipesQuery2)
      ]);

      return !snapshot1.empty && !snapshot2.empty;
    } catch (error) {
      console.error('Error checking mutual likes:', error);
      throw error;
    }
  }

  // Get swipe statistics for a user
  static async getStats(userId) {
    try {
      const swipesQuery = query(
        collection(db, this.collection),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(swipesQuery);
      const swipes = querySnapshot.docs.map(doc => doc.data());

      const stats = {
        total: swipes.length,
        likes: swipes.filter(s => s.type === 'like').length,
        superlikes: swipes.filter(s => s.type === 'superlike').length,
        passes: swipes.filter(s => s.type === 'pass').length
      };

      return stats;
    } catch (error) {
      console.error('Error getting swipe stats:', error);
      throw error;
    }
  }
}
