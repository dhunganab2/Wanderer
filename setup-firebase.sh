#!/bin/bash

echo "🔥 Firebase Setup Script for Wanderer App"
echo "=========================================="
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
    echo "✅ Firebase CLI installed"
else
    echo "✅ Firebase CLI already installed"
fi

echo ""
echo "🔑 Logging into Firebase..."
firebase login --interactive

echo ""
echo "📋 Setting up Firebase project..."

# Check if firebase.json exists
if [ ! -f "firebase.json" ]; then
    echo "❌ firebase.json not found. Initializing project..."
    firebase init firestore
else
    echo "✅ firebase.json found"
fi

echo ""
echo "🚀 Deploying Firestore rules..."
firebase deploy --only firestore:rules

echo ""
echo "✅ Firebase setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Visit https://console.firebase.google.com/"
echo "2. Select your project 'wanderer-8ecac'"
echo "3. Go to Authentication > Sign-in method"
echo "4. Enable Email/Password and Google authentication"
echo "5. Go to Firestore Database and verify rules are deployed"
echo ""
echo "🎉 Your app should now work with Firebase!"
echo "Run 'npm run dev' to test the application."