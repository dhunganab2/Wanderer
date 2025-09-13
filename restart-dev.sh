#!/bin/bash

echo "🔄 Restarting development server with cache clearing..."

# Kill any existing dev server
pkill -f "vite"

# Clear Vite cache
rm -rf node_modules/.vite

# Clear browser cache (if possible)
echo "Please clear your browser cache manually:"
echo "1. Open Chrome DevTools (F12)"
echo "2. Right-click the refresh button"
echo "3. Select 'Empty Cache and Hard Reload'"
echo "4. Or use Ctrl+Shift+R (Cmd+Shift+R on Mac)"

# Start dev server
npm run dev
