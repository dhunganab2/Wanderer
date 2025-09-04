import React, { useState, useRef } from 'react';
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
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DesktopNavigation, Navigation } from '@/components/Navigation';
import { useAppStore } from '@/store/useAppStore';
import { sampleUsers, travelStyleOptions } from '@/data/sampleUsers';
import { cn } from '@/lib/utils';

export default function Profile() {
  const { currentUser, setCurrentUser } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(currentUser || sampleUsers[0]);
  const [isUploading, setIsUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Use first sample user as current user if none set
  const user = currentUser || sampleUsers[0];

  const handleSave = () => {
    setCurrentUser(editForm);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm(user);
    setIsEditing(false);
  };

  const handleImageUpload = (file: File, type: 'avatar' | 'cover') => {
    if (file && file.type.startsWith('image/')) {
      setIsUploading(true);
      
      // Create object URL for preview
      const imageUrl = URL.createObjectURL(file);
      
      // Simulate upload delay
      setTimeout(() => {
        setEditForm({
          ...editForm,
          [type === 'avatar' ? 'avatar' : 'coverImage']: imageUrl
        });
        setIsUploading(false);
      }, 1000);
    }
  };

  const handleAvatarClick = () => {
    if (isEditing) {
      avatarInputRef.current?.click();
    }
  };

  const handleCoverClick = () => {
    if (isEditing) {
      coverInputRef.current?.click();
    }
  };

  const addTravelStyle = (styleId: string) => {
    if (!editForm.travelStyle.includes(styleId as any)) {
      setEditForm({
        ...editForm,
        travelStyle: [...editForm.travelStyle, styleId as any]
      });
    }
  };

  const removeTravelStyle = (styleId: string) => {
    setEditForm({
      ...editForm,
      travelStyle: editForm.travelStyle.filter(style => style !== styleId)
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Navigation */}
      <DesktopNavigation className="hidden md:flex" />
      
      <div className="pt-20 pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="relative mb-8">
            {/* Cover Photo */}
            <div 
              className={cn(
                "h-48 md:h-64 rounded-2xl overflow-hidden relative group",
                isEditing && "cursor-pointer"
              )}
              onClick={handleCoverClick}
            >
              <img 
                src={editForm.coverImage || editForm.avatar} 
                alt="Cover"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {isEditing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white/20 backdrop-blur-md rounded-full p-4">
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                    ) : (
                      <div className="text-center">
                        <Camera className="w-8 h-8 text-white mx-auto mb-2" />
                        <p className="text-white text-sm font-medium">Change Cover</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Hidden file inputs */}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, 'cover');
              }}
            />
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, 'avatar');
              }}
            />

            {/* Profile Info */}
            <div className="relative -mt-16 ml-6">
              <div className="flex items-end gap-6">
                {/* Avatar */}
                <div 
                  className={cn(
                    "relative group",
                    isEditing && "cursor-pointer"
                  )}
                  onClick={handleAvatarClick}
                >
                  <img 
                    src={editForm.avatar} 
                    alt={editForm.name}
                    className="w-32 h-32 rounded-2xl border-4 border-background shadow-strong group-hover:scale-105 transition-transform duration-300"
                  />
                  {user.verified && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                      <Verified className="w-4 h-4 text-white" fill="currentColor" />
                    </div>
                  )}
                  {isEditing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                      <div className="bg-white/20 backdrop-blur-md rounded-full p-2">
                        {isUploading ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                        ) : (
                          <Camera className="w-6 h-6 text-white" />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Name and Actions */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                              <Input
                                id="name"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="text-xl font-bold font-display mt-1"
                                placeholder="Your name"
                              />
                            </div>
                            <div className="w-20">
                              <Label htmlFor="age" className="text-sm font-medium">Age</Label>
                              <Input
                                id="age"
                                type="number"
                                value={editForm.age}
                                onChange={(e) => setEditForm({ ...editForm, age: parseInt(e.target.value) || 18 })}
                                className="text-xl font-bold font-display mt-1"
                                min="18"
                                max="100"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                            <Input
                              id="location"
                              value={editForm.location}
                              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                              className="mt-1"
                              placeholder="Your location"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <h1 className="text-3xl font-bold text-foreground font-display mb-2">
                            {user.name}, {user.age}
                          </h1>
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {user.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Member since {new Date(user.joinDate).getFullYear()}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-4 md:mt-0">
                      {!isEditing ? (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-6"
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit Profile
                          </Button>
                          <Button variant="ghost" size="icon" className="hidden md:flex">
                            <Share2 className="w-5 h-5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="hidden md:flex">
                            <MoreHorizontal className="w-5 h-5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            onClick={handleCancel}
                            className="px-6"
                            disabled={isUploading}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                          <Button
                            variant="hero"
                            onClick={handleSave}
                            className="px-6"
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <Tabs defaultValue="about" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-96">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="travel">Travel</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* About Tab */}
            <TabsContent value="about" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    About Me
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={editForm.bio}
                          onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                          className="mt-2"
                          rows={4}
                          maxLength={300}
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          {editForm.bio.length}/300 characters
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-foreground leading-relaxed">{user.bio}</p>
                  )}

                  {/* Travel Styles */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Travel Style</h3>
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {editForm.travelStyle.map((style) => {
                            const styleOption = travelStyleOptions.find(s => s.id === style);
                            return (
                              <Badge 
                                key={style} 
                                variant="secondary" 
                                className="flex items-center gap-2 px-3 py-1"
                              >
                                <span>{styleOption?.icon}</span>
                                {styleOption?.label}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                  onClick={() => removeTravelStyle(style)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </Badge>
                            );
                          })}
                        </div>
                        
                        <div className="border-t pt-4">
                          <p className="text-sm text-muted-foreground mb-3">Add more styles:</p>
                          <div className="flex flex-wrap gap-2">
                            {travelStyleOptions
                              .filter(style => !editForm.travelStyle.includes(style.id as any))
                              .map((style) => (
                                <Button
                                  key={style.id}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addTravelStyle(style.id)}
                                  className="flex items-center gap-2"
                                >
                                  <span>{style.icon}</span>
                                  {style.label}
                                  <Plus className="w-3 h-3" />
                                </Button>
                              ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {user.travelStyle.map((style) => {
                          const styleOption = travelStyleOptions.find(s => s.id === style);
                          return (
                            <Badge key={style} variant="secondary" className="flex items-center gap-2">
                              <span>{styleOption?.icon}</span>
                              {styleOption?.label}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Interests */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.interests.map((interest) => (
                        <Badge key={interest} variant="outline">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Next Trip */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Next Adventure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="nextDestination" className="text-sm font-medium">Destination</Label>
                        <Input
                          id="nextDestination"
                          value={editForm.nextDestination}
                          onChange={(e) => setEditForm({ ...editForm, nextDestination: e.target.value })}
                          className="mt-1"
                          placeholder="Where are you going next?"
                        />
                      </div>
                      <div>
                        <Label htmlFor="travelDates" className="text-sm font-medium">Travel Dates</Label>
                        <Input
                          id="travelDates"
                          value={editForm.travelDates}
                          onChange={(e) => setEditForm({ ...editForm, travelDates: e.target.value })}
                          className="mt-1"
                          placeholder="When are you traveling?"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {user.nextDestination}
                        </h3>
                        <p className="text-muted-foreground">{user.travelDates}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Trip
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Photos Tab */}
            <TabsContent value="photos">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      My Photos ({editForm.photos?.length || 0})
                    </span>
                    {isEditing && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // In a real app, this would open a file picker
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.multiple = true;
                          input.onchange = (e) => {
                            const files = Array.from((e.target as HTMLInputElement).files || []);
                            files.forEach(file => {
                              if (file.type.startsWith('image/')) {
                                const imageUrl = URL.createObjectURL(file);
                                setEditForm(prev => ({
                                  ...prev,
                                  photos: [...(prev.photos || []), imageUrl]
                                }));
                              }
                            });
                          };
                          input.click();
                        }}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photos
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {editForm.photos?.map((photo, index) => (
                      <div key={index} className="aspect-square rounded-xl overflow-hidden group relative">
                        <img 
                          src={photo} 
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                        {isEditing && (
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setEditForm(prev => ({
                                ...prev,
                                photos: prev.photos?.filter((_, i) => i !== index) || []
                              }));
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    {/* Add Photo Placeholder - Only show when editing */}
                    {isEditing && (
                      <div 
                        className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file && file.type.startsWith('image/')) {
                              const imageUrl = URL.createObjectURL(file);
                              setEditForm(prev => ({
                                ...prev,
                                photos: [...(prev.photos || []), imageUrl]
                              }));
                            }
                          };
                          input.click();
                        }}
                      >
                        <div className="text-center">
                          <Plus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Add Photo</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {!isEditing && (!editForm.photos || editForm.photos.length === 0) && (
                    <div className="text-center py-12">
                      <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No photos yet</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setIsEditing(true)}
                      >
                        Add Your First Photo
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Travel Tab */}
            <TabsContent value="travel" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Travel Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">12</div>
                      <div className="text-sm text-muted-foreground">Countries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">28</div>
                      <div className="text-sm text-muted-foreground">Cities</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">156</div>
                      <div className="text-sm text-muted-foreground">Connections</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">4.9</div>
                      <div className="text-sm text-muted-foreground">Rating</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bucket List</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Your travel bucket list will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Account Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Settings and preferences will be available here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Mobile Navigation */}
      <Navigation className="md:hidden" />
    </div>
  );
}
