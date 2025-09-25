# Interactive Map Setup Guide

This guide explains how to set up the interactive Google Maps integration in your Wanderer app.

## 🗺️ What's Been Added

### New Components
- **`InteractiveMap.tsx`** - Clean, reusable map component with Google Maps
- **`MapExample.tsx`** - Example page showing how to use the map
- **Updated `Map.tsx`** - Simplified travel map page using the new component

### Features
- ✅ Interactive Google Maps with zoom and drag
- ✅ Configurable API key via environment variables
- ✅ Example markers with click handlers
- ✅ Responsive design with Tailwind CSS
- ✅ Clean error handling and loading states
- ✅ Custom map styling

## 🚀 Quick Setup

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
2. Create a new project or select existing one
3. Enable the **Maps JavaScript API**
4. Create credentials (API Key)
5. Copy your API key

### 2. Configure Environment Variables

Create a `.env.local` file in the `frontend` directory:

```bash
# frontend/.env.local
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 3. Restart Development Server

```bash
npm run dev
```

## 📱 Usage Examples

### Basic Map
```tsx
import InteractiveMap from '@/components/InteractiveMap';

<InteractiveMap
  center={{ lat: 40.7128, lng: -74.0060 }} // New York City
  zoom={12}
  markers={[
    { lat: 40.7128, lng: -74.0060, title: "NYC" },
    { lat: 40.7589, lng: -73.9851, title: "Times Square" }
  ]}
  onMarkerClick={(marker) => console.log('Clicked:', marker)}
/>
```

### With Custom Styling
```tsx
<InteractiveMap
  center={{ lat: 37.7749, lng: -122.4194 }} // San Francisco
  zoom={13}
  markers={markers}
  height="h-[400px]"
  className="border-2 border-primary rounded-xl"
/>
```

## 🎯 Available Pages

### 1. Travel Map (`/map`)
- Shows travelers from your database on the map
- Click markers to see user profiles
- Search and filter functionality
- Real user data integration

### 2. Map Example (`/map-example`)
- Demonstrates the InteractiveMap component
- Add/remove markers dynamically
- Shows all component features
- Perfect for testing and learning

## 🔧 Component Props

```tsx
interface InteractiveMapProps {
  center?: google.maps.LatLngLiteral;  // Default: NYC
  zoom?: number;                        // Default: 12
  markers?: MapMarker[];               // Array of markers
  onMarkerClick?: (marker: MapMarker) => void;
  className?: string;                  // Additional CSS classes
  height?: string;                     // Height class (default: h-[500px])
}

interface MapMarker {
  lat: number;
  lng: number;
  title: string;
  description?: string;
  icon?: string;                       // URL to custom icon
}
```

## 🎨 Customization

### Map Styling
The map uses a clean, minimal style. You can customize it by modifying the `styles` array in `InteractiveMap.tsx`.

### Marker Icons
```tsx
const marker: MapMarker = {
  lat: 40.7128,
  lng: -74.0060,
  title: "Custom Marker",
  icon: "https://example.com/custom-icon.png" // Custom icon URL
};
```

### Responsive Design
The component is fully responsive and works on:
- Desktop (full sidebar layout)
- Tablet (stacked layout)
- Mobile (optimized for touch)

## 🚨 Troubleshooting

### Map Not Loading
1. **Check API Key**: Make sure `VITE_GOOGLE_MAPS_API_KEY` is set correctly
2. **Restart Server**: After adding env vars, restart with `npm run dev`
3. **Check Console**: Look for API key errors in browser console
4. **Billing**: Ensure billing is enabled in Google Cloud Console

### Common Errors
- **"For development purposes only"**: Enable billing in Google Cloud Console
- **"API key not valid"**: Check API key and enabled APIs
- **"Quota exceeded"**: Check your Google Cloud usage limits

## 🔒 Security Notes

- Never commit your actual API key to version control
- Use `.env.local` for local development
- Restrict your API key to specific domains in production
- Consider using environment-specific API keys

## 🚀 Next Steps

Now that you have a working map, you can:

1. **Add more markers** from your user database
2. **Implement clustering** for many markers
3. **Add custom info windows** for markers
4. **Integrate with geolocation** for user location
5. **Add search functionality** with Places API
6. **Implement directions** between locations

## 📚 Resources

- [Google Maps JavaScript API Docs](https://developers.google.com/maps/documentation/javascript)
- [React Google Maps Wrapper](https://github.com/googlemaps/react-wrapper)
- [Google Cloud Console](https://console.cloud.google.com/)

---

**Happy Mapping! 🗺️✨**
