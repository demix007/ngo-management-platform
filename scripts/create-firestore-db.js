/**
 * Script to create Firestore database using Firebase Management API
 * 
 * Usage:
 *   node scripts/create-firestore-db.js
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
let app;
try {
  const serviceAccountPath = join(__dirname, '..', 'serviceAccountKey.json');
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  
  if (!admin.apps.length) {
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    app = admin.app();
  }
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

async function createFirestoreDatabase() {
  const projectId = 'blp-imis';
  const locationId = 'us-central1'; // Default location, can be changed
  
  console.log('🔧 Attempting to create Firestore database...');
  console.log('   Project:', projectId);
  console.log('   Location:', locationId);
  console.log('');
  
  try {
    // Try to access Firestore - if it fails, database doesn't exist
    const db = admin.firestore();
    
    // Try a simple operation to check if database exists
    const testRef = db.collection('_test').doc('_check');
    await testRef.get();
    
    console.log('✅ Firestore database already exists!');
    console.log('   You can now run: npm run create-user-doc');
    return true;
  } catch (error) {
    if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
      console.log('❌ Firestore database not found.');
      console.log('');
      console.log('📋 To create the database, please use one of these methods:');
      console.log('');
      console.log('   Method 1: Firebase Console (Easiest - 2 minutes)');
      console.log('   1. Open: https://console.firebase.google.com/project/blp-imis/firestore');
      console.log('   2. Click "Create database"');
      console.log('   3. Choose "Start in test mode" (for quick setup)');
      console.log('   4. Select location:', locationId);
      console.log('   5. Click "Enable"');
      console.log('   6. Wait ~30 seconds, then run: npm run create-user-doc');
      console.log('');
      console.log('   Method 2: Firebase CLI');
      console.log('   Run: firebase init firestore');
      console.log('   Follow the prompts to create the database.');
      console.log('');
      console.log('   After creating the database, run: npm run create-user-doc');
      return false;
    } else {
      throw error;
    }
  }
}

createFirestoreDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });

