/**
 * Diagnostic script to check Firestore setup
 * 
 * Usage:
 *   node scripts/diagnose-firestore.js
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Firestore Diagnostic Tool');
console.log('');

// Check service account
let serviceAccount;
try {
  const serviceAccountPath = join(__dirname, '..', 'serviceAccountKey.json');
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  console.log('✅ Service account key found');
  console.log('   Project ID:', serviceAccount.project_id);
  console.log('   Client Email:', serviceAccount.client_email);
} catch (error) {
  console.error('❌ Service account key not found:', error.message);
  process.exit(1);
}

// Initialize Firebase Admin
let app;
try {
  if (!admin.apps.length) {
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    app = admin.app();
  }
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();

async function diagnose() {
  console.log('');
  console.log('Testing Firestore connection...');
  console.log('');

  // Test 1: Try to list collections (this will fail if database doesn't exist)
  try {
    const collections = await db.listCollections();
    console.log('✅ Firestore database exists and is accessible!');
    console.log('   Collections found:', collections.length);
    collections.forEach(col => {
      console.log('   -', col.id);
    });
    console.log('');

    // Test 2: Check if users collection exists
    const usersCollection = db.collection('users');
    const usersSnapshot = await usersCollection.limit(1).get();
    console.log('✅ "users" collection exists');
    console.log('   Documents in collection:', usersSnapshot.size > 0 ? 'At least 1' : '0 (empty)');
    console.log('');

    // Test 3: Check for specific user document
    const userId = 'q7z1ILLLCZMNGSmsayD5aXNMdki1';
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      console.log('✅ User document FOUND!');
      console.log('   Document ID:', userDoc.id);
      const data = userDoc.data();
      console.log('   Email:', data?.email || 'MISSING');
      console.log('   Role:', data?.role || 'MISSING');
      console.log('   Is Active:', data?.isActive ?? 'MISSING');
    } else {
      console.log('❌ User document NOT FOUND');
      console.log('   Looking for document ID:', userId);
      console.log('   Path: users/' + userId);
      console.log('');
      console.log('   To create it, run: npm run create-user-doc');
    }

  } catch (error) {
    const errorCode = error.code || error.message;
    console.error('❌ Firestore connection failed!');
    console.error('   Error code:', error.code || 'N/A');
    console.error('   Error message:', error.message);
    console.error('');

    if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
      console.error('   This means the Firestore database has not been created yet.');
      console.error('');
      console.error('   To create it:');
      console.error('   1. Go to: https://console.firebase.google.com/project/blp-imis/firestore');
      console.error('   2. Click "Create database"');
      console.error('   3. Choose "Start in test mode"');
      console.error('   4. Select location (e.g., us-central1)');
      console.error('   5. Click "Enable"');
      console.error('   6. Wait 30-60 seconds for initialization');
      console.error('   7. Run this script again');
    } else if (error.code === 7 || error.message?.includes('PERMISSION_DENIED')) {
      console.error('   This means the service account lacks permissions.');
      console.error('   Check IAM permissions in Google Cloud Console.');
    } else {
      console.error('   Unexpected error. Check Firebase project settings.');
    }
  } finally {
    if (app) {
      await app.delete();
    }
  }
}

diagnose()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

