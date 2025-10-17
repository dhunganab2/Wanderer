# Frontend Archive

This directory contains deprecated/old versions of frontend components and pages that have been replaced by newer implementations.

## Archived Files

### Pages (Deprecated)
- **Discover.tsx** - Original discovery/swipe page
- **Messages.tsx** - Original messaging interface
- **MapExample.tsx** - Map component demo/example page
- **GlobeDemo.tsx** - 3D globe visualization demo

**Current Versions:**
- Discovery: `pages/Discover.tsx` (formerly EnhancedDiscover)
- Messages: `pages/Messages.tsx` (formerly EnhancedMessages)
- Map: `pages/Map.tsx` (production map page)

### Components (Deprecated)
- **ThreeNormalMapExample.tsx** - 3D globe example component used in GlobeDemo

## Why These Were Archived

### Discover.tsx & Messages.tsx (Original Versions)
- Basic implementations without advanced filtering
- Limited real-time features
- Replaced by enhanced versions with:
  - Advanced matching algorithms
  - Location-based discovery
  - Better UI/UX with skeletons and loading states
  - Real-time WebSocket integration

### MapExample.tsx & GlobeDemo.tsx
- Demo/example pages for testing
- Not part of production user flow
- Kept for reference on 3D globe implementation

## File Organization Notes

The enhanced versions have now become the standard versions:
- `EnhancedDiscover.tsx` → `Discover.tsx`
- `EnhancedMessages.tsx` → `Messages.tsx`

Old routes in App.tsx (`/discover-old`, `/messages-old`, `/globe`) have been removed.

## Should You Delete These?

**No, keep them for reference.** They contain:
- Previous UI/UX approaches
- Alternative component patterns
- Code that might be useful for A/B testing or rollbacks

These files are:
- ✅ Not imported anywhere in the codebase
- ✅ Not affecting bundle size (tree-shaking removes them)
- ✅ Properly documented and organized
- ✅ Safe to keep for historical reference

## Migration Notes

If you need to reference the old UI:
- Check git history for complete component evolution
- All deprecated routes have been removed from `App.tsx`
- Frontend services remain unchanged and compatible
