#!/bin/bash
# Simple script to create user document using Firebase CLI
# This uses firebase-tools to interact with Firestore

echo "Creating user document in Firestore..."
echo ""

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Run: firebase login"
    exit 1
fi

# Create the document using Firebase CLI
# Note: Firebase CLI doesn't have a direct command for this,
# so we'll use a Node.js script with the Firebase Admin SDK instead
echo "⚠️  Firebase CLI doesn't support direct document creation."
echo "   Please use: node scripts/create-user-doc.js"
echo ""
echo "   Or follow the steps in CLI_CREATE_USER_DOC.md"

