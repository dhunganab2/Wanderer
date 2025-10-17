import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Camera, 
  MapPin, 
  Calendar, 
  Settings, 
  Edit3, 
  Heart, 
  MessageCircle,
  Share2,
  MoreHorizontal,
  Verified,
  Plus,
  X,
  Upload,
  Save,
  Check,
  Globe,
  Star,
  Award,
  Users,
  Plane,
  Camera as CameraIcon,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DesktopNavigation, Navigation } from '@/components/Navigation';
import { useParams, useNavigate } from 'react-router-dom';
import { userService, matchingService } from '@/services/firebaseService';
import { useAppStore } from '@/store/useAppStore';
import { useUserProfile } from '@/hooks/useUserProfile';
import { sampleUsers, travelStyleOptions } from '@/data/sampleUsers';
import { imageService } from '@/services/imageService';
import { imageMetadataService } from '@/services/imageMetadataService';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { User as UserType, TravelStyle } from '@/types';

export default function Profile() {
  const { user, updateUserProfile, loading, error, setUser, authUser } = useUserProfile();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UserType | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newInterest, setNewInterest] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [isMatched, setIsMatched] = useState(false);

  // Use viewed user (route param) or fallback to current auth user
  const [viewedUser, setViewedUser] = useState<UserType | null>(null);
  const currentUser = viewedUser || user || sampleUsers[0];

  // Check if viewing own profile
  const isOwnProfile = !userId || (authUser && userId === authUser.uid) || (!userId && user);
  const isViewingOthersProfile = userId && authUser && userId !== authUser.uid;

  // Load profile by route param (view other user's profile) or use self
  useEffect(() => {
    const load = async () => {
      if (userId) {
        const u = await userService.getUserProfile(userId);
        if (u) {
          setViewedUser(u);
          setEditForm(isOwnProfile ? u : null); // Only set edit form if it's own profile
          return;
        }
      }
      if (user) {
        setViewedUser(user);
        setEditForm(isOwnProfile ? user : null); // Only set edit form if it's own profile
      }
    };
    load();
  }, [userId, user]);

  // Check if current user is matched with viewed user
  useEffect(() => {
    const checkMatch = async () => {
      if (!authUser || !userId || isOwnProfile) {
        setIsMatched(false);
        return;
      }

      try {
        const matches = await matchingService.getUserMatches(authUser.uid);
        const isUserMatched = matches.some(match =>
          match.users.includes(userId) && match.status === 'accepted'
        );
        setIsMatched(isUserMatched);
      } catch (error) {
        console.error('Error checking match status:', error);
        setIsMatched(false);
      }
    };

    checkMatch();
  }, [authUser, userId, isOwnProfile]);

  // Load user images from database
  useEffect(() => {
    const loadUserImages = async () => {
      console.log('Profile Debug - Loading user images:', {
        currentUser: currentUser?.id,
        hasUser: !!user,
        hasCurrentUser: !!currentUser,
        userAvatar: user?.avatar?.substring(0, 30) + '...',
        userCoverImage: user?.coverImage?.substring(0, 30) + '...'
      });

      if (!user) {
        console.log('Profile Debug - No user data, skipping image load');
        return;
      }

      // Load images from user profile (base64 or valid URLs)
      console.log('Profile Debug - Loading images from user profile:', {
        avatar: user.avatar?.substring(0, 50) + '...',
        coverImage: user.coverImage?.substring(0, 50) + '...'
      });
      
      // Load avatar if it exists and is not a blob URL
      if (user.avatar && !user.avatar.startsWith('blob:') && user.avatar.startsWith('data:')) {
        console.log('Profile Debug - Loading avatar from profile:', user.avatar.substring(0, 100));
        setEditForm(prev => prev ? { ...prev, avatar: user.avatar } : null);
      } else if (user.avatar && user.avatar.startsWith('blob:')) {
        console.log('Profile Debug - Skipping blob URL avatar (will be lost on refresh)');
        // Don't load blob URLs as they become invalid
      } else {
        console.log('Profile Debug - No valid avatar found');
      }
      
      // Load cover image if it exists and is not a blob URL or placeholder
      if (user.coverImage && 
          !user.coverImage.startsWith('blob:') && 
          user.coverImage !== '/api/placeholder/800/400' &&
          user.coverImage.startsWith('data:')) {
        console.log('Profile Debug - Loading cover image from profile:', user.coverImage.substring(0, 100));
        setEditForm(prev => prev ? { ...prev, coverImage: user.coverImage } : null);
      } else if (user.coverImage && user.coverImage.startsWith('blob:')) {
        console.log('Profile Debug - Skipping blob URL cover image (will be lost on refresh)');
        // Don't load blob URLs as they become invalid
      } else {
        console.log('Profile Debug - No valid cover image found');
      }
    };

    loadUserImages();
  }, [user]);

  // Supported image formats
  const supportedImageTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'image/svg+xml',
    'image/heic',
    'image/heif',
    'image/avif'
  ];

  const validateImageFile = (file: File): { valid: boolean; error?: string } => {
    // Check if file exists
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    // Check file type
    if (!supportedImageTypes.includes(file.type.toLowerCase())) {
      const supportedExtensions = supportedImageTypes
        .map(type => type.split('/')[1].toUpperCase())
        .join(', ');
      return { 
        valid: false, 
        error: `Unsupported file type. Supported formats: ${supportedExtensions}` 
      };
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return { 
        valid: false, 
        error: 'Image size must be less than 5MB' 
      };
    }

    // Check minimum file size (1KB)
    if (file.size < 1024) {
      return { 
        valid: false, 
        error: 'Image file is too small (minimum 1KB)' 
      };
    }

    return { valid: true };
  };

  const handleImageUpload = async (file: File, type: 'avatar' | 'cover') => {
    // Validate the file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid image file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      console.log('Profile Debug - Starting image upload:', { type, fileName: file.name, size: file.size });

      // Convert file to base64 for persistent storage
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert file to base64'));
          }
        };
        reader.onerror = () => reject(new Error('File reading failed'));
        reader.readAsDataURL(file);
      });

      setUploadProgress(50);
      console.log('Profile Debug - Converted to base64, length:', base64String.length);

      // Update form with new image URL
      setEditForm(prev => prev ? {
        ...prev,
        [type === 'avatar' ? 'avatar' : 'coverImage']: base64String
      } : null);

      // Update the user profile in Firebase with the base64 URL
      const profileUpdate = {
        [type === 'avatar' ? 'avatar' : 'coverImage']: base64String
      };

      setUploadProgress(80);
      console.log('Profile Debug - Updating profile with base64 image URL');
      await updateUserProfile(profileUpdate);

      setUploadProgress(100);
      toast.success(`${type === 'avatar' ? 'Avatar' : 'Cover image'} uploaded successfully!`);
      
      console.log('Profile Debug - Image upload completed successfully');
    } catch (error) {
      console.error('Profile Debug - Image upload error:', error);
      toast.error(`Failed to upload ${type === 'avatar' ? 'avatar' : 'cover image'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAddInterest = () => {
    if (!newInterest.trim() || !editForm) return;
    
    const trimmedInterest = newInterest.trim();
    
    // Check if interest already exists
    if (editForm.interests?.includes(trimmedInterest)) {
      toast.error('This interest already exists');
      return;
    }
    
    const updatedInterests = [...(editForm.interests || []), trimmedInterest];
    setEditForm(prev => prev ? { ...prev, interests: updatedInterests } : null);
    setNewInterest('');
    toast.success('Interest added!');
  };

  const handleRemoveInterest = (index: number) => {
    if (!editForm?.interests) return;
    
    const updatedInterests = editForm.interests.filter((_, i) => i !== index);
    setEditForm(prev => prev ? { ...prev, interests: updatedInterests } : null);
    toast.success('Interest removed!');
  };

  const handleSave = async () => {
    if (!editForm || !isOwnProfile) {
      console.log('Profile Debug - No editForm or not own profile, cannot save');
      return;
    }
    
    console.log('Profile Debug - Saving profile:', {
      editForm: editForm,
      currentUser: currentUser?.id,
      hasUser: !!user
    });

    setIsSaving(true);
    try {
      // Update the user profile in Firebase
      console.log('Profile Debug - Calling updateUserProfile...');
      await updateUserProfile(editForm);
      console.log('Profile Debug - updateUserProfile completed');
      
      // Update local state immediately for better UX
      console.log('Profile Debug - Updating local state...');
      setUser(editForm);
      
      setIsEditing(false);
      toast.success('Profile updated successfully!');
      console.log('Profile Debug - Profile save completed successfully');
    } catch (error) {
      console.error('Profile Debug - Save error:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm(currentUser);
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    if (isEditing && isOwnProfile) {
      avatarInputRef.current?.click();
    }
  };

  const handleCoverClick = () => {
    if (isOwnProfile) {
      // If not in edit mode, enter edit mode first
      if (!isEditing) {
        setIsEditing(true);
        setEditForm(currentUser);
        // Small delay to ensure edit mode is activated
        setTimeout(() => {
          coverInputRef.current?.click();
        }, 100);
      } else {
        coverInputRef.current?.click();
      }
    }
  };

  const handleMessageUser = async () => {
    if (!authUser || !currentUser || isOwnProfile) return;
    
    try {
      // Navigate to messages with the user's info
      // We'll pass the user info as state so the messages page can start a conversation
      navigate('/messages', { 
        state: { 
          startConversationWith: {
            id: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar
          }
        }
      });
      toast.success(`Starting conversation with ${currentUser.name}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background overflow-y-auto">
      {/* Desktop Navigation */}
      <DesktopNavigation className="hidden md:flex" />
      
      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-4 py-6 pb-20">
        {/* Profile Header */}
          <div className="relative mb-12 animate-fade-up">
          {/* Cover Image */}
          <div className="relative h-52 md:h-72 lg:h-80 rounded-3xl overflow-hidden shadow-elevation bg-gradient-sunset">
            {(isEditing ? editForm?.coverImage : currentUser.coverImage) ? (
              <img
                src={(isEditing ? editForm?.coverImage : currentUser.coverImage) || ''}
                alt="Cover"
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
            ) : (
              <div 
                className={cn(
                  "w-full h-full bg-gradient-sunset flex items-center justify-center relative overflow-hidden",
                  isOwnProfile && "cursor-pointer hover:opacity-90 transition-opacity duration-300"
                )}
                onClick={isOwnProfile ? handleCoverClick : undefined}
                title={isOwnProfile ? "Click to upload cover photo" : undefined}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
                <div className="text-center text-white z-10">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-70 animate-float" />
                  <p className="text-lg font-semibold opacity-90">
                    {isOwnProfile ? "Add Cover Photo" : "No Cover Photo"}
                  </p>
                  <p className="text-sm opacity-70 mt-1">
                    {isOwnProfile ? "Click to upload your travel adventures" : ""}
                  </p>
                </div>
                <div className="absolute top-4 right-4 w-12 h-12 rounded-full blur-lg animate-bounce-gentle" style={{backgroundColor: 'rgba(255, 255, 255, 0.2)'}}></div>
                <div className="absolute bottom-6 left-6 w-8 h-8 rounded-full blur-md animate-float" style={{animationDelay: '1s', backgroundColor: 'rgba(255, 255, 255, 0.15)'}}></div>
                      </div>
                    )}

            {/* Cover Upload Overlay - Show for existing cover photos */}
            {currentUser.coverImage && isOwnProfile && (
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-sm"
                style={{backgroundColor: 'rgba(0, 0, 0, 0.5)'}}
                onClick={handleCoverClick}
                title="Click to upload cover photo. Supports: JPEG, PNG, WebP, HEIC, GIF, BMP, TIFF, SVG, AVIF"
              >
                <div className="text-center text-white transform scale-90 hover:scale-100 transition-transform duration-300">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm" style={{backgroundColor: 'rgba(255, 255, 255, 0.2)'}}>
                    <Camera className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-semibold">Change Cover Photo</p>
                  <p className="text-xs opacity-80 mt-1">Upload your best travel moment</p>
                  </div>
                </div>
              )}
            </div>

          {/* Profile Picture */}
          <div className="relative -mt-20 md:-mt-24 flex justify-center md:justify-start animate-scale-in" style={{animationDelay: '0.2s'}}>
            <div className="relative group">
              <div className="w-32 h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full border-6 border-background shadow-elevation overflow-hidden bg-gradient-to-br from-sunrise-coral-light to-sunrise-coral-soft">
                {(isEditing ? editForm?.avatar : currentUser.avatar) ? (
                  <img
                    src={(isEditing ? editForm?.avatar : currentUser.avatar) || ''}
                    alt={currentUser.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-sunrise-coral-light to-sunrise-coral-soft flex items-center justify-center">
                    <User className="w-16 h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 text-sunrise-coral-dark" />
                  </div>
                )}
              </div>

              {/* Online Status Indicator */}
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-forest-green border-4 border-background rounded-full shadow-medium animate-pulse"></div>

              {/* Avatar Upload Overlay */}
              {isEditing && isOwnProfile && (
                <div
                  className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-sm"
                  style={{backgroundColor: 'rgba(0, 0, 0, 0.6)'}}
                  onClick={handleAvatarClick}
                  title="Click to upload profile photo. Supports: JPEG, PNG, WebP, HEIC, GIF, BMP, TIFF, SVG, AVIF"
                >
                  <div className="text-center text-white transform scale-90 hover:scale-100 transition-transform duration-300">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 backdrop-blur-sm" style={{backgroundColor: 'rgba(255, 255, 255, 0.2)'}}>
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-medium">Change Photo</p>
                  </div>
                    </div>
                        )}
                      </div>
                    </div>

        {/* Profile Actions */}
        <div className="absolute top-6 right-6 flex gap-3 animate-fade-in" style={{animationDelay: '0.4s'}}>
          {isViewingOthersProfile && isMatched && (
            <Button
              onClick={handleMessageUser}
              variant="hero"
              size="sm"
              className="shadow-medium hover:shadow-glow backdrop-blur-xl"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </Button>
          )}
          <Button
            variant="glass"
            size="icon"
            className="glass-card-elevated backdrop-blur-xl hover:scale-110 transition-all duration-300"
          >
            <Share2 className="w-5 h-5" />
          </Button>
          <Button
            variant="glass"
            size="icon"
            className="glass-card-elevated backdrop-blur-xl hover:scale-110 transition-all duration-300"
          >
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
                </div>

        {/* Profile Content */}
        <div className="px-4 md:px-8">
          {/* Profile Info */}
          <div className="mt-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex-1">
                      {isEditing && isOwnProfile ? (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                              <Input
                        value={editForm?.name || ''}
                        onChange={(e) => setEditForm(prev => prev ? { ...prev, name: e.target.value } : null)}
                        className="text-2xl md:text-3xl font-bold border-2 border-dashed border-border rounded-lg px-4 py-2 h-auto bg-transparent focus:border-primary"
                                placeholder="Your name"
                              />
                      {currentUser.verified && (
                        <Verified className="w-6 h-6 text-blue-500 flex-shrink-0" />
                      )}
                            </div>
                    <div className="flex items-center gap-3">
                              <Input
                                type="number"
                        value={editForm?.age || ''}
                        onChange={(e) => setEditForm(prev => prev ? { ...prev, age: parseInt(e.target.value) || 0 } : null)}
                        className="w-24 text-lg font-semibold border-2 border-dashed border-border rounded-lg px-3 py-2 h-auto bg-transparent focus:border-primary"
                        placeholder="Age"
                      />
                      <span className="text-lg text-muted-foreground">years old</span>
                          </div>
                        </div>
                      ) : (
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">
                    {currentUser.name}
                          </h1>
                  {currentUser.verified && (
                    <Verified className="w-6 h-6 text-primary" />
                  )}
                  <Badge variant="secondary" className="text-sm">
                    {currentUser.age} years old
                  </Badge>
                </div>
              )}
              
              <div className="flex items-center gap-4 text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                  <span>{isEditing ? editForm?.location : currentUser.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                  <span>Member since {new Date().getFullYear()}</span>
                            </div>
                          </div>

                    </div>

            <div className="flex gap-2">
              {isEditing && isOwnProfile ? (
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isSaving}
                            size="lg"
                            className="hover:shadow-medium transition-all duration-300"
                          >
                            <X className="w-5 h-5 mr-2" />
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            variant="hero"
                            size="lg"
                            className="shadow-medium hover:shadow-glow"
                          >
                            {isSaving ? (
                              <div className="w-5 h-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                              <Save className="w-5 h-5 mr-2" />
                            )}
                            Save Changes
                          </Button>
                        </div>
              ) : isOwnProfile ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="premium"
                  size="lg"
                  className="shadow-medium hover:shadow-glow"
                >
                  <Edit3 className="w-5 h-5 mr-2" />
                  Edit Profile
                </Button>
              ) : isMatched ? (
                <Button
                  onClick={handleMessageUser}
                  variant="hero"
                  size="lg"
                  className="shadow-medium hover:shadow-glow"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Message {currentUser.name}
                </Button>
              ) : (
                <div className="text-center py-8 glass-card p-6 rounded-lg">
                  <p className="text-muted-foreground">
                    You need to match with {currentUser.name} to send messages
                  </p>
                </div>
                      )}
                    </div>
                  </div>
                </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="mb-8 p-6 glass-card-elevated rounded-2xl border border-sunrise-coral/20 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-sunrise rounded-full flex items-center justify-center">
                <Upload className="w-4 h-4 text-white animate-pulse" />
              </div>
              <span className="text-base font-semibold text-foreground">Uploading your photo...</span>
              </div>
            <div className="w-full bg-warm-gray-200 rounded-full h-3 mb-3 overflow-hidden">
              <div
                className="bg-gradient-sunrise h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                style={{ width: `${uploadProgress}%` }}
              >
                <div className="absolute inset-0 shimmer-effect"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Supported: JPEG, PNG, WebP, HEIC, GIF, BMP, TIFF, SVG, AVIF
              </p>
              <span className="text-sm font-semibold text-sunrise-coral">{uploadProgress}%</span>
            </div>
          </div>
        )}

        {/* Profile Tabs */}
          <Tabs defaultValue="about" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="travel">Travel</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* About Tab */}
            <TabsContent value="about" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Bio */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    About Me
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing && isOwnProfile ? (
                    <div className="space-y-4">
                      <Textarea
                        value={editForm?.bio || ''}
                        onChange={(e) => setEditForm(prev => prev ? { ...prev, bio: e.target.value } : null)}
                        placeholder="Tell us about yourself..."
                        className="min-h-[100px]"
                      />
                      {editForm?.bio && (
                        <div className="p-3 bg-muted/50 rounded-lg border">
                          <p className="text-sm text-muted-foreground mb-1">Preview:</p>
                          <p className="text-sm">{editForm.bio}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      {currentUser.bio || 'No bio added yet'}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Travel Style */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="w-5 h-5" />
                    Travel Style
                  </CardTitle>
                </CardHeader>
                <CardContent>
                    {isEditing && isOwnProfile ? (
                    <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                        {travelStyleOptions.map((style) => (
                              <Badge 
                                  key={style.id}
                            variant={editForm?.travelStyle?.includes(style.id as TravelStyle) ? "default" : "outline"}
                            className="px-3 py-1 text-sm cursor-pointer"
                            onClick={() => {
                              const currentStyles = editForm?.travelStyle || [];
                              const newStyles = currentStyles.includes(style.id as TravelStyle)
                                ? currentStyles.filter(s => s !== (style.id as TravelStyle))
                                : [...currentStyles, style.id as TravelStyle];
                              setEditForm(prev => prev ? { ...prev, travelStyle: newStyles } : null);
                            }}
                          >
                                  {style.label}
                          </Badge>
                              ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                      {currentUser.travelStyle?.map((styleId, index) => {
                        const style = travelStyleOptions.find(s => s.id === styleId);
                          return (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="px-3 py-1 text-sm"
                          >
                            {style?.label || styleId}
                            </Badge>
                          );
                      }) || (
                        <p className="text-muted-foreground text-sm">No travel styles added</p>
                      )}
                      </div>
                    )}
                </CardContent>
              </Card>


                  {/* Interests */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Interests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing && isOwnProfile ? (
                    <div className="space-y-4">
                      {/* Add New Interest */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter an interest (e.g., photography, hiking, cooking)"
                          value={newInterest}
                          onChange={(e) => setNewInterest(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newInterest.trim()) {
                              handleAddInterest();
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          onClick={handleAddInterest}
                          disabled={!newInterest.trim()}
                          size="sm"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      
                      {/* Current Interests */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Your Interests:</p>
                        {editForm?.interests && editForm.interests.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {editForm.interests.map((interest, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-sm px-3 py-1 flex items-center gap-2"
                              >
                                {interest}
                                <button
                                  onClick={() => handleRemoveInterest(index)}
                                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No interests added yet</p>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        💡 <strong>Tip:</strong> Add interests one by one. You can include spaces in interest names.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {currentUser.interests?.map((interest, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="px-3 py-1 text-sm"
                        >
                          {interest}
                        </Badge>
                      )) || (
                        <p className="text-muted-foreground text-sm">No interests added</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Next Destination */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Next Destination
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing && isOwnProfile ? (
                    <div className="space-y-3">
                        <Input
                        value={editForm?.nextDestination || ''}
                        onChange={(e) => setEditForm(prev => prev ? { ...prev, nextDestination: e.target.value } : null)}
                          placeholder="Where are you going next?"
                        />
                        <Input
                        value={editForm?.travelDates || ''}
                        onChange={(e) => setEditForm(prev => prev ? { ...prev, travelDates: e.target.value } : null)}
                        placeholder="Travel dates (e.g., June 15-22, 2024)"
                      />
                    </div>
                  ) : (
                      <div>
                      <p className="text-lg font-medium">{currentUser.nextDestination || 'Not specified'}</p>
                      {currentUser.travelDates && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {currentUser.travelDates}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing && isOwnProfile ? (
                    <Input
                      value={editForm?.location || ''}
                      onChange={(e) => setEditForm(prev => prev ? { ...prev, location: e.target.value } : null)}
                      placeholder="Your current location"
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      {currentUser.location || 'Not specified'}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
            </TabsContent>

            {/* Photos Tab */}
            <TabsContent value="photos">
              <Card>
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CameraIcon className="w-5 h-5" />
                  Photo Gallery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                {currentUser.photos && currentUser.photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {currentUser.photos.map((photo, index) => (
                      <div
                        key={index}
                        className="aspect-square rounded-lg overflow-hidden bg-muted"
                      >
                        <img 
                          src={photo} 
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                    <div className="text-center py-12">
                    <CameraIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No photos uploaded yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Travel Tab */}
          <TabsContent value="travel">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Travel Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Preferred Travel Style</Label>
                      <p className="text-muted-foreground">
                        {currentUser.travelStyle?.join(', ') || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Next Destination</Label>
                      <p className="text-muted-foreground">
                        {currentUser.nextDestination || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Travel Dates</Label>
                      <p className="text-muted-foreground">
                        {currentUser.travelDates || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive updates about matches and messages</p>
                    </div>
                    <Button variant="outline" size="sm">Enable</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Location Services</Label>
                      <p className="text-sm text-muted-foreground">Allow location-based matching</p>
                    </div>
                    <Button variant="outline" size="sm">Enable</Button>
                  </div>
                </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

      {/* Hidden File Inputs */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/tiff,image/svg+xml,image/heic,image/heif,image/avif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file, 'avatar');
        }}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/tiff,image/svg+xml,image/heic,image/heif,image/avif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file, 'cover');
        }}
      />

      {/* Mobile Navigation */}
      <Navigation className="md:hidden" />
      </div>
    </div>
  );
}