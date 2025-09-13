import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ImageMetadata {
  id: string;
  userId: string;
  type: 'avatar' | 'cover' | 'gallery';
  url: string;
  path: string;
  size: number;
  width: number;
  height: number;
  format: string;
  uploadedAt: string;
  isActive: boolean;
  order?: number; // For gallery images ordering
}

export class ImageMetadataService {
  private readonly collectionName = 'imageMetadata';

  // Store image metadata
  async storeImageMetadata(metadata: Omit<ImageMetadata, 'id'>): Promise<string> {
    try {
      const docRef = doc(collection(db, this.collectionName));
      const imageData: ImageMetadata = {
        ...metadata,
        id: docRef.id,
        uploadedAt: new Date().toISOString()
      };
      
      await setDoc(docRef, imageData);
      return docRef.id;
    } catch (error) {
      console.error('Error storing image metadata:', error);
      throw error;
    }
  }

  // Get user's images by type
  async getUserImages(userId: string, type?: 'avatar' | 'cover' | 'gallery'): Promise<ImageMetadata[]> {
    try {
      let q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('isActive', '==', true),
        orderBy('uploadedAt', 'desc')
      );

      if (type) {
        q = query(q, where('type', '==', type));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as ImageMetadata);
    } catch (error) {
      console.error('Error getting user images:', error);
      return [];
    }
  }

  // Get user's active avatar
  async getUserAvatar(userId: string): Promise<ImageMetadata | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('type', '==', 'avatar'),
        where('isActive', '==', true),
        orderBy('uploadedAt', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      
      return snapshot.docs[0].data() as ImageMetadata;
    } catch (error) {
      console.error('Error getting user avatar:', error);
      return null;
    }
  }

  // Get user's active cover image
  async getUserCoverImage(userId: string): Promise<ImageMetadata | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('type', '==', 'cover'),
        where('isActive', '==', true),
        orderBy('uploadedAt', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      
      return snapshot.docs[0].data() as ImageMetadata;
    } catch (error) {
      console.error('Error getting user cover image:', error);
      return null;
    }
  }

  // Update image metadata
  async updateImageMetadata(imageId: string, updates: Partial<ImageMetadata>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, imageId);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating image metadata:', error);
      throw error;
    }
  }

  // Deactivate image (soft delete)
  async deactivateImage(imageId: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, imageId);
      await updateDoc(docRef, { isActive: false });
    } catch (error) {
      console.error('Error deactivating image:', error);
      throw error;
    }
  }

  // Delete image metadata
  async deleteImageMetadata(imageId: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, imageId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting image metadata:', error);
      throw error;
    }
  }

  // Set image as active (deactivate others of same type)
  async setImageAsActive(userId: string, imageId: string, type: 'avatar' | 'cover'): Promise<void> {
    try {
      // First, deactivate all other images of the same type for this user
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('type', '==', type),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      const batch = [];
      
      for (const docSnapshot of snapshot.docs) {
        if (docSnapshot.id !== imageId) {
          batch.push(updateDoc(docSnapshot.ref, { isActive: false }));
        }
      }

      // Then activate the specified image
      batch.push(updateDoc(doc(db, this.collectionName, imageId), { isActive: true }));

      await Promise.all(batch);
    } catch (error) {
      console.error('Error setting image as active:', error);
      throw error;
    }
  }
}

export const imageMetadataService = new ImageMetadataService();
