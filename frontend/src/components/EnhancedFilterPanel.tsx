import React, { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Star, Users, Zap, Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store/useAppStore';
import { travelStyleOptions } from '@/data/sampleUsers';
import { destinationsWithSeasons } from '@/data/enhancedSampleData';
import { cn } from '@/lib/utils';
import type { FilterSettings, TravelStyle } from '@/types';

interface EnhancedFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterSettings) => void;
}

export const EnhancedFilterPanel: React.FC<EnhancedFilterPanelProps> = ({
  isOpen,
  onClose,
  onApplyFilters
}) => {
  const { filters, setFilters, resetFilters } = useAppStore();
  const [localFilters, setLocalFilters] = useState<FilterSettings>(filters);
  const [hasChanges, setHasChanges] = useState(false);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
    setHasChanges(false);
  }, [filters]);

  // Check if filters have changed
  useEffect(() => {
    const changed = JSON.stringify(localFilters) !== JSON.stringify(filters);
    setHasChanges(changed);
  }, [localFilters, filters]);

  const handleAgeRangeChange = (value: number[]) => {
    setLocalFilters(prev => ({
      ...prev,
      ageRange: [value[0], value[1]] as [number, number]
    }));
  };

  const handleDistanceChange = (value: number[]) => {
    setLocalFilters(prev => ({
      ...prev,
      maxDistance: value[0]
    }));
  };

  const handleTravelStyleToggle = (style: TravelStyle) => {
    setLocalFilters(prev => ({
      ...prev,
      travelStyles: prev.travelStyles.includes(style)
        ? prev.travelStyles.filter(s => s !== style)
        : [...prev.travelStyles, style]
    }));
  };

  const handleDestinationToggle = (destination: string) => {
    setLocalFilters(prev => ({
      ...prev,
      destinations: prev.destinations.includes(destination)
        ? prev.destinations.filter(d => d !== destination)
        : [...prev.destinations, destination]
    }));
  };

  const handleVerifiedToggle = (checked: boolean) => {
    setLocalFilters(prev => ({
      ...prev,
      verified: checked
    }));
  };

  const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
    setLocalFilters(prev => {
      const currentRange = prev.dateRange || ['', ''];
      const newRange = [...currentRange] as [string, string];
      newRange[type === 'start' ? 0 : 1] = value;
      return {
        ...prev,
        dateRange: newRange
      };
    });
  };

  const handleApply = () => {
    setFilters(localFilters);
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    resetFilters();
    setLocalFilters(filters);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setLocalFilters(filters);
    setHasChanges(false);
    onClose();
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.ageRange[0] !== 18 || localFilters.ageRange[1] !== 65) count++;
    if (localFilters.maxDistance !== 50) count++;
    if (localFilters.travelStyles.length > 0) count++;
    if (localFilters.destinations.length > 0) count++;
    if (localFilters.verified) count++;
    if (localFilters.dateRange && (localFilters.dateRange[0] || localFilters.dateRange[1])) count++;
    return count;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border/50 shadow-2xl overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Filter className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground font-display">
                  Advanced Filters
                </h2>
                <p className="text-sm text-muted-foreground">
                  {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} active
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Filter Tabs */}
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            {/* Basic Filters */}
            <TabsContent value="basic" className="space-y-6">
              {/* Age Range */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Age Range
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="px-3">
                    <Slider
                      value={localFilters.ageRange}
                      onValueChange={handleAgeRangeChange}
                      min={18}
                      max={65}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                      <span>{localFilters.ageRange[0]} years</span>
                      <span>{localFilters.ageRange[1]} years</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Distance */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Maximum Distance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="px-3">
                    <Slider
                      value={[localFilters.maxDistance]}
                      onValueChange={handleDistanceChange}
                      min={5}
                      max={500}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-2">
                      <span>5 km</span>
                      <span className="font-medium">{localFilters.maxDistance} km</span>
                      <span>500 km</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Verified Users */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Verification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="verified"
                      checked={localFilters.verified}
                      onCheckedChange={handleVerifiedToggle}
                    />
                    <Label htmlFor="verified" className="text-sm">
                      Show only verified users
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced Filters */}
            <TabsContent value="advanced" className="space-y-6">
              {/* Travel Styles */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Travel Styles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {travelStyleOptions.map((style) => (
                      <div
                        key={style.id}
                        className={cn(
                          "flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors",
                          localFilters.travelStyles.includes(style.id as TravelStyle)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => handleTravelStyleToggle(style.id as TravelStyle)}
                      >
                        <Checkbox
                          checked={localFilters.travelStyles.includes(style.id as TravelStyle)}
                          onChange={() => handleTravelStyleToggle(style.id as TravelStyle)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{style.icon}</span>
                            <span className="text-sm font-medium truncate">
                              {style.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Destinations */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Destinations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                      {destinationsWithSeasons.map((dest) => (
                        <div
                          key={dest.name}
                          className={cn(
                            "flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors",
                            localFilters.destinations.includes(dest.name)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                          onClick={() => handleDestinationToggle(dest.name)}
                        >
                          <Checkbox
                            checked={localFilters.destinations.includes(dest.name)}
                            onChange={() => handleDestinationToggle(dest.name)}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium truncate">
                              {dest.name}
                            </span>
                            <div className="text-xs text-muted-foreground">
                              Best season: {dest.bestSeason}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences */}
            <TabsContent value="preferences" className="space-y-6">
              {/* Date Range */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Travel Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-date" className="text-sm font-medium">
                        From
                      </Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={localFilters.dateRange?.[0] || ''}
                        onChange={(e) => handleDateRangeChange('start', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-date" className="text-sm font-medium">
                        To
                      </Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={localFilters.dateRange?.[1] || ''}
                        onChange={(e) => handleDateRangeChange('end', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sort By */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Sort By</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select defaultValue="compatibility">
                    <SelectTrigger>
                      <SelectValue placeholder="Select sorting option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compatibility">Compatibility</SelectItem>
                      <SelectItem value="distance">Distance</SelectItem>
                      <SelectItem value="age">Age</SelectItem>
                      <SelectItem value="recent">Recently Active</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Active Filters Summary */}
          {getActiveFilterCount() > 0 && (
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Active Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {localFilters.ageRange[0] !== 18 || localFilters.ageRange[1] !== 65 ? (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Age: {localFilters.ageRange[0]}-{localFilters.ageRange[1]}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => setLocalFilters(prev => ({ ...prev, ageRange: [18, 65] }))}
                      />
                    </Badge>
                  ) : null}
                  
                  {localFilters.maxDistance !== 50 ? (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Distance: {localFilters.maxDistance}km
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => setLocalFilters(prev => ({ ...prev, maxDistance: 50 }))}
                      />
                    </Badge>
                  ) : null}
                  
                  {localFilters.travelStyles.map(style => (
                    <Badge key={style} variant="secondary" className="flex items-center gap-1">
                      {style}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => handleTravelStyleToggle(style)}
                      />
                    </Badge>
                  ))}
                  
                  {localFilters.destinations.map(dest => (
                    <Badge key={dest} variant="secondary" className="flex items-center gap-1">
                      {dest}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => handleDestinationToggle(dest)}
                      />
                    </Badge>
                  ))}
                  
                  {localFilters.verified ? (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Verified
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => handleVerifiedToggle(false)}
                      />
                    </Badge>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1"
              disabled={!hasChanges}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1"
              disabled={!hasChanges}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
