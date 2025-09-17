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

export class MatchModel {
  static collection = 'matches';

  // Create a match
  static async create(matchData) {
    try {
      const docRef = await addDoc(collection(db, this.collection), {
        ...matchData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  }

  // Get matches for a user
  static async getByUserId(userId) {
    try {
      const matchesQuery = query(
        collection(db, this.collection),
        where('users', 'array-contains', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(matchesQuery);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting matches:', error);
      throw error;
    }
  }

  // Check if two users have a match
  static async checkMatch(userId1, userId2) {
    try {
      const matchesQuery = query(
        collection(db, this.collection),
        where('users', 'array-contains', userId1)
      );

      const querySnapshot = await getDocs(matchesQuery);
      const matches = querySnapshot.docs.map(doc => doc.data());
      
      return matches.some(match => match.users.includes(userId2));
    } catch (error) {
      console.error('Error checking match:', error);
      throw error;
    }
  }

  // Update match status
  static async updateStatus(matchId, status) {
    try {
      const matchRef = doc(db, this.collection, matchId);
      await updateDoc(matchRef, {
        status,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating match status:', error);
      throw error;
    }
  }

  // Delete match
  static async delete(matchId) {
    try {
      const matchRef = doc(db, this.collection, matchId);
      await deleteDoc(matchRef);
      return true;
    } catch (error) {
      console.error('Error deleting match:', error);
      throw error;
    }
  }
}
