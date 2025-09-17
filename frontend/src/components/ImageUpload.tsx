import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Camera, Image as ImageIcon, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { imageService, imageUtils } from '@/services/imageService';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ImageMetadata } from '@/services/imageService';

interface ImageUploadProps {
  userId: string;
  onUploadComplete: (images: ImageMetadata[]) => void;
  onUploadStart?: () => void;
  maxImages?: number;
  type?: 'avatar' | 'cover' | 'gallery' | 'story';
  className?: string;
  disabled?: boolean;
}

interface UploadingImage {
  file: File;
  preview: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  userId,
  onUploadComplete,
  onUploadStart,
  maxImages = 10,
  type = 'gallery',
  className,
  disabled = false
}) => {
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];

    // Validate files
    for (const file of fileArray) {
      const validation = imageService.validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        toast.error(`${file.name}: ${validation.error}`);
      }
    }

    if (validFiles.length === 0) return;

    // Check max images limit
    const totalImages = uploadingImages.length + validFiles.length;
    if (totalImages > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Create uploading image objects
    const newUploadingImages: UploadingImage[] = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'uploading'
    }));

    setUploadingImages(prev => [...prev, ...newUploadingImages]);

    // Start upload process
    uploadImages(validFiles);
  }, [uploadingImages.length, maxImages]);

  const uploadImages = async (files: File[]) => {
    if (onUploadStart) onUploadStart();

    const uploadPromises = files.map(async (file, index) => {
      const imageIndex = uploadingImages.length + index;
      
      try {
        // Update progress
        setUploadingImages(prev => 
          prev.map((img, i) => 
            i === imageIndex ? { ...img, progress: 10 } : img
          )
        );

        // Upload based on type
        let result: ImageMetadata;
        switch (type) {
          case 'avatar':
            result = await imageService.uploadAvatar(file, userId);
            break;
          case 'cover':
            result = await imageService.uploadCoverPhoto(file, userId);
            break;
          case 'story':
            result = await imageService.uploadStoryImage(file, userId);
            break;
          default:
            result = await imageService.uploadImage(file, userId);
        }

        // Update success status
        setUploadingImages(prev => 
          prev.map((img, i) => 
            i === imageIndex 
              ? { ...img, progress: 100, status: 'success' }
              : img
          )
        );

        return result;
      } catch (error) {
        console.error('Upload error:', error);
        
        // Update error status
        setUploadingImages(prev => 
          prev.map((img, i) => 
            i === imageIndex 
              ? { 
                  ...img, 
                  progress: 0, 
                  status: 'error', 
                  error: 'Upload failed' 
                }
              : img
          )
        );

        toast.error(`Failed to upload ${file.name}`);
        return null;
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((result): result is ImageMetadata => result !== null);
      
      if (successfulUploads.length > 0) {
        onUploadComplete(successfulUploads);
        toast.success(`${successfulUploads.length} image(s) uploaded successfully`);
      }

      // Clear completed uploads after a delay
      setTimeout(() => {
        setUploadingImages(prev => 
          prev.filter(img => img.status === 'uploading')
        );
      }, 3000);
    } catch (error) {
      console.error('Upload process error:', error);
      toast.error('Upload process failed');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeUploadingImage = (index: number) => {
    setUploadingImages(prev => {
      const newImages = [...prev];
      const removedImage = newImages.splice(index, 1)[0];
      
      // Clean up object URL
      URL.revokeObjectURL(removedImage.preview);
      
      return newImages;
    });
  };

  const retryUpload = (index: number) => {
    const image = uploadingImages[index];
    if (image) {
      uploadImages([image.file]);
    }
  };

  const getUploadButtonText = () => {
    switch (type) {
      case 'avatar':
        return 'Upload Avatar';
      case 'cover':
        return 'Upload Cover Photo';
      case 'story':
        return 'Upload Story';
      default:
        return 'Upload Images';
    }
  };

  const getUploadIcon = () => {
    switch (type) {
      case 'avatar':
      case 'cover':
        return <Camera className="w-4 h-4" />;
      case 'story':
        return <ImageIcon className="w-4 h-4" />;
      default:
        return <Upload className="w-4 h-4" />;
    }
  };

  const isUploading = uploadingImages.some(img => img.status === 'uploading');
  const hasErrors = uploadingImages.some(img => img.status === 'error');

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
          isDragOver 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            {getUploadIcon()}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {getUploadButtonText()}
            </h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop images here, or click to select files
            </p>
            <p className="text-sm text-muted-foreground">
              Supports JPG, PNG, WebP up to 10MB each
            </p>
          </div>

          <Button 
            variant="outline" 
            disabled={disabled}
            className="mt-2"
          >
            {getUploadIcon()}
            <span className="ml-2">{getUploadButtonText()}</span>
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={type !== 'avatar' && type !== 'cover'}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload Progress */}
      {uploadingImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">
              Uploading Images
            </h4>
            <Badge variant={hasErrors ? "destructive" : "secondary"}>
              {uploadingImages.filter(img => img.status === 'success').length} / {uploadingImages.length}
            </Badge>
          </div>

          <div className="space-y-2">
            {uploadingImages.map((image, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center gap-3">
                  {/* Preview */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={image.preview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {image.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {imageUtils.formatFileSize(image.file.size)}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    {image.status === 'uploading' && (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">
                          {image.progress}%
                        </span>
                      </>
                    )}
                    
                    {image.status === 'success' && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                    
                    {image.status === 'error' && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-destructive" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => retryUpload(index)}
                          className="h-6 px-2 text-xs"
                        >
                          Retry
                        </Button>
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUploadingImage(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Progress bar */}
                {image.status === 'uploading' && (
                  <div className="mt-2">
                    <Progress value={image.progress} className="h-1" />
                  </div>
                )}

                {/* Error message */}
                {image.status === 'error' && image.error && (
                  <p className="text-xs text-destructive mt-1">
                    {image.error}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upload Status */}
      {isUploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Uploading images...</span>
        </div>
      )}
    </div>
  );
};
