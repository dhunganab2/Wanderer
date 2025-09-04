import React, { useState } from 'react';
import { 
  X, 
  Sliders, 
  MapPin, 
  Calendar, 
  Users, 
  Star,
  Search,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator as _Separator } from '@/components/ui/separator';
import { cn as _cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { travelStyleOptions } from '@/data/sampleUsers';
import type { FilterSettings, TravelStyle } from '@/types';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterSettings) => void;
}

const destinations = [
  'Tokyo, Japan', 'Bali, Indonesia', 'Paris, France', 'New York, USA',
  'Barcelona, Spain', 'Thailand', 'Morocco', 'Iceland', 'New Zealand',
  'Peru', 'Vietnam', 'Greece', 'Portugal', 'Costa Rica', 'Nepal',
  'South Korea', 'Turkey', 'Egypt', 'Norway', 'Australia'
];

export const FilterPanel: React.FC<FilterPanelProps> = ({ 
  isOpen, 
  onClose, 
  onApplyFilters 
}) => {
  const { filters: storeFilters, setFilters, resetFilters } = useAppStore();
  const [localFilters, setLocalFilters] = useState<FilterSettings>(storeFilters);
  const [destinationSearch, setDestinationSearch] = useState('');

  const filteredDestinations = destinations.filter(dest =>
    dest.toLowerCase().includes(destinationSearch.toLowerCase())
  );

  const handleAgeRangeChange = (value: number[]) => {
    setLocalFilters({
      ...localFilters,
      ageRange: [value[0], value[1]]
    });
  };

  const handleDistanceChange = (value: number[]) => {
    setLocalFilters({
      ...localFilters,
      maxDistance: value[0]
    });
  };

  const toggleTravelStyle = (style: TravelStyle) => {
    const newStyles = localFilters.travelStyles.includes(style)
      ? localFilters.travelStyles.filter(s => s !== style)
      : [...localFilters.travelStyles, style];
    
    setLocalFilters({
      ...localFilters,
      travelStyles: newStyles
    });
  };

  const toggleDestination = (destination: string) => {
    const newDestinations = localFilters.destinations.includes(destination)
      ? localFilters.destinations.filter(d => d !== destination)
      : [...localFilters.destinations, destination];
    
    setLocalFilters({
      ...localFilters,
      destinations: newDestinations
    });
  };

  const handleApply = () => {
    setFilters(localFilters);
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    resetFilters();
    setLocalFilters({
      ageRange: [18, 65],
      maxDistance: 50,
      travelStyles: [],
      destinations: [],
      verified: false,
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.ageRange[0] !== 18 || localFilters.ageRange[1] !== 65) count++;
    if (localFilters.maxDistance !== 50) count++;
    if (localFilters.travelStyles.length > 0) count++;
    if (localFilters.destinations.length > 0) count++;
    if (localFilters.verified) count++;
    return count;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border shadow-2xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <Sliders className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground font-display">
                Filters
              </h2>
              {getActiveFilterCount() > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {getActiveFilterCount()} active
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Age Range */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Age Range
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="px-2">
                  <Slider
                    value={localFilters.ageRange}
                    onValueChange={handleAgeRangeChange}
                    max={65}
                    min={18}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{localFilters.ageRange[0]} years</span>
                  <span>{localFilters.ageRange[1]} years</span>
                </div>
              </CardContent>
            </Card>

            {/* Distance */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Maximum Distance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="px-2">
                  <Slider
                    value={[localFilters.maxDistance]}
                    onValueChange={handleDistanceChange}
                    max={200}
                    min={5}
                    step={5}
                    className="w-full"
                  />
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Within {localFilters.maxDistance} km
                </div>
              </CardContent>
            </Card>

            {/* Travel Styles */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Travel Styles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {travelStyleOptions.map((style) => (
                    <div key={style.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={style.id}
                        checked={localFilters.travelStyles.includes(style.id as TravelStyle)}
                        onCheckedChange={() => toggleTravelStyle(style.id as TravelStyle)}
                      />
                      <Label 
                        htmlFor={style.id}
                        className="flex-1 flex items-center gap-2 cursor-pointer"
                      >
                        <span className="text-lg">{style.icon}</span>
                        <div>
                          <div className="font-medium">{style.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {style.description}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Destinations */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Destinations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search destinations */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search destinations..."
                    value={destinationSearch}
                    onChange={(e) => setDestinationSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Selected destinations */}
                {localFilters.destinations.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Selected:</Label>
                    <div className="flex flex-wrap gap-2">
                      {localFilters.destinations.map((destination) => (
                        <Badge 
                          key={destination}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => toggleDestination(destination)}
                        >
                          {destination}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available destinations */}
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {filteredDestinations
                    .filter(dest => !localFilters.destinations.includes(dest))
                    .slice(0, 10)
                    .map((destination) => (
                      <Button
                        key={destination}
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleDestination(destination)}
                        className="w-full justify-start text-sm h-8"
                      >
                        {destination}
                      </Button>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Verified Users */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="verified"
                    checked={localFilters.verified}
                    onCheckedChange={(checked) => 
                      setLocalFilters({
                        ...localFilters,
                        verified: checked as boolean
                      })
                    }
                  />
                  <Label htmlFor="verified" className="flex items-center gap-2 cursor-pointer">
                    <Star className="w-4 h-4 text-primary" />
                    <div>
                      <div className="font-medium">Verified users only</div>
                      <div className="text-xs text-muted-foreground">
                        Show only verified travelers
                      </div>
                    </div>
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-border bg-muted/20">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button 
                variant="hero" 
                onClick={handleApply}
                className="flex-1"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
