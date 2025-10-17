# Backend Archive

This directory contains deprecated/old versions of backend files that have been replaced by newer implementations.

## Archived Files

### AI Routes & Controllers (Deprecated)
- **ai.js** - Original AI route (v1) - Replaced by aiV3.js
- **aiV2.js** - Second iteration AI route - Replaced by aiV3.js
- **aiController.js** - Original AI controller - Replaced by QuickResponseAIService
- **aiControllerV2.js** - Second iteration controller - Replaced by QuickResponseAIService

**Current Version:** `routes/aiV3.js` using `QuickResponseAIService`

### AI Services (Deprecated)
- **ImprovedAITravelService.js** - Second generation AI service
- **aiTravelService.js** - Original AI travel service

**Current Version:** `ai-agents/QuickResponseAIService.js` with multi-agent architecture

## Why These Were Archived

These files represent the evolution of the Wanderer AI system:

1. **v1 (ai.js, aiController.js)**: Basic AI integration with single-agent responses
2. **v2 (aiV2.js, aiControllerV2.js)**: Improved conversational flow with better context handling
3. **v3 (aiV3.js, QuickResponseAIService)**: Current production version with:
   - Multi-agent architecture (ChatManager, DataScout, etc.)
   - Instant response system (<100ms)
   - Background processing with real-time updates
   - API key rotation and intelligent fallbacks

## Should You Delete These?

**No, keep them for reference.** They contain:
- Historical context for architectural decisions
- Alternative implementation approaches
- Code that might be useful for future features

These files are:
- ✅ Not imported anywhere in the codebase
- ✅ Not affecting bundle size (they're in `_archive`)
- ✅ Properly documented and organized
- ✅ Safe to keep for historical reference

## Migration Notes

If you need to reference the old AI system:
- Check git history for complete evolution
- See `backend/README.md` for current AI architecture
- Refer to `ai-agents/README.md` for multi-agent system details
