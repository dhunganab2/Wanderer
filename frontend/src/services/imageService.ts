import { ref, uploadBytes, getDownloadURL, deleteObject, getMetadata } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export interface ImageUploadOptions {
  quality?: number; // 0-1, default 0.8
  maxWidth?: number; // default 1920
  maxHeight?: number; // default 1080
  format?: 'jpeg' | 'png' | 'webp'; // default 'jpeg'
  folder?: string; // default 'images'
}

export interface ImageMetadata {
  url: string;
  path: string;
  size: number;
  width: number;
  height: number;
  format: string;
  uploadedAt: string;
}

export class ImageService {
  private readonly defaultOptions: Required<ImageUploadOptions> = {
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080,
    format: 'jpeg',
    folder: 'images'
  };

  // Upload a single image
  async uploadImage(
    file: File, 
    userId: string, 
    options: ImageUploadOptions = {}
  ): Promise<ImageMetadata> {
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      // Compress and resize image
      const processedFile = await this.processImage(file, opts);
      
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${userId}_${timestamp}.${opts.format}`;
      const path = `${opts.folder}/${userId}/${filename}`;
      
      // Create storage reference
      const storageRef = ref(storage, path);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, processedFile);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Get metadata
      const metadata = await getMetadata(snapshot.ref);
      
      return {
        url: downloadURL,
        path,
        size: metadata.size,
        width: opts.maxWidth,
        height: opts.maxHeight,
        format: opts.format,
        uploadedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  }

  // Upload multiple images
  async uploadImages(
    files: File[], 
    userId: string, 
    options: ImageUploadOptions = {}
  ): Promise<ImageMetadata[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, userId, options));
    return Promise.all(uploadPromises);
  }

  // Upload user avatar
  async uploadAvatar(file: File, userId: string): Promise<ImageMetadata> {
    return this.uploadImage(file, userId, {
      quality: 0.9,
      maxWidth: 400,
      maxHeight: 400,
      format: 'jpeg',
      folder: 'avatars'
    });
  }

  // Upload cover photo
  async uploadCoverPhoto(file: File, userId: string): Promise<ImageMetadata> {
    return this.uploadImage(file, userId, {
      quality: 0.85,
      maxWidth: 1920,
      maxHeight: 1080,
      format: 'jpeg',
      folder: 'covers'
    });
  }

  // Upload story image
  async uploadStoryImage(file: File, userId: string): Promise<ImageMetadata> {
    return this.uploadImage(file, userId, {
      quality: 0.8,
      maxWidth: 1080,
      maxHeight: 1920, // Story format
      format: 'jpeg',
      folder: 'stories'
    });
  }

  // Delete an image
  async deleteImage(imagePath: string): Promise<void> {
    try {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  }

  // Delete multiple images
  async deleteImages(imagePaths: string[]): Promise<void> {
    const deletePromises = imagePaths.map(path => this.deleteImage(path));
    await Promise.all(deletePromises);
  }

  // Process image (compress and resize)
  private async processImage(file: File, options: Required<ImageUploadOptions>): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const { width: newWidth, height: newHeight } = this.calculateDimensions(
          img.width, 
          img.height, 
          options.maxWidth, 
          options.maxHeight
        );

        // Set canvas dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, newWidth, newHeight);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const processedFile = new File([blob], file.name, {
                type: `image/${options.format}`,
                lastModified: Date.now()
              });
              resolve(processedFile);
            } else {
              reject(new Error('Failed to process image'));
            }
          },
          `image/${options.format}`,
          options.quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Calculate new dimensions maintaining aspect ratio
  private calculateDimensions(
    originalWidth: number, 
    originalHeight: number, 
    maxWidth: number, 
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // Scale down if too wide
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    // Scale down if too tall
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  // Get image dimensions from file
  async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Validate image file
  validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'File must be an image' };
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 10MB' };
    }

    // Check dimensions (will be validated after loading)
    return { valid: true };
  }

  // Generate thumbnail
  async generateThumbnail(
    file: File, 
    size: number = 200
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate thumbnail dimensions
        const { width, height } = this.calculateDimensions(
          img.width, 
          img.height, 
          size, 
          size
        );

        canvas.width = width;
        canvas.height = height;

        // Draw thumbnail
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to data URL
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnail);
      };

      img.onerror = () => reject(new Error('Failed to generate thumbnail'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Batch upload with progress
  async uploadWithProgress(
    files: File[], 
    userId: string, 
    onProgress: (progress: number) => void,
    options: ImageUploadOptions = {}
  ): Promise<ImageMetadata[]> {
    const results: ImageMetadata[] = [];
    const total = files.length;

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.uploadImage(files[i], userId, options);
        results.push(result);
        
        // Update progress
        const progress = ((i + 1) / total) * 100;
        onProgress(progress);
      } catch (error) {
        console.error(`Error uploading file ${i + 1}:`, error);
        // Continue with other files
      }
    }

    return results;
  }

  // Get optimized image URL (for different sizes)
  getOptimizedImageUrl(originalUrl: string, size: 'thumbnail' | 'medium' | 'large' = 'medium'): string {
    // In a real app, you might use a CDN or image optimization service
    // For now, return the original URL
    return originalUrl;
  }

  // Extract EXIF data (if needed)
  async extractEXIFData(file: File): Promise<any> {
    // This would require an EXIF library like exif-js
    // For now, return empty object
    return {};
  }

  // Check if image is landscape or portrait
  async getImageOrientation(file: File): Promise<'landscape' | 'portrait' | 'square'> {
    const dimensions = await this.getImageDimensions(file);
    const { width, height } = dimensions;

    if (width > height) return 'landscape';
    if (height > width) return 'portrait';
    return 'square';
  }
}

// Create singleton instance
export const imageService = new ImageService();

// Utility functions
export const imageUtils = {
  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Get file extension
  getFileExtension(filename: string): string {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  },

  // Check if file is image
  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  },

  // Generate unique filename
  generateFilename(originalName: string, userId: string): string {
    const timestamp = Date.now();
    const extension = this.getFileExtension(originalName);
    return `${userId}_${timestamp}.${extension}`;
  }
};
