/**
 * Script to create a user document in Firestore using Firebase Admin SDK
 * 
 * Prerequisites:
 *   1. Install firebase-admin: npm install firebase-admin
 *   2. Download service account key from Firebase Console:
 *      Project Settings > Service Accounts > Generate New Private Key
 *   3. Save it as serviceAccountKey.json in project root
 * 
 * Usage:
 *   node scripts/create-user-doc.js
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
  console.error('❌ Error initializing Firebase Admin:');
  console.error('   Make sure you have serviceAccountKey.json in the project root.');
  console.error('   Download it from: Firebase Console > Project Settings > Service Accounts');
  console.error('\n   Error:', error.message);
  process.exit(1);
}

const db = admin.firestore();

async function createUserDocument() {
  const userId = 'q7z1ILLLCZMNGSmsayD5aXNMdki1';
  const userEmail = 'ayodejiabidemi007@gmail.com';

  const userData = {
    email: userEmail,
    displayName: 'Admin User',
    role: 'national_admin',
    isActive: true,
    twoFactorEnabled: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    // Check if document already exists
    const docRef = db.collection('users').doc(userId);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      console.log('⚠️  User document already exists!');
      console.log('   Document ID:', userId);
      console.log('   Current data:', docSnap.data());
      console.log('\n   To update it, use: node scripts/update-user-doc.js');
      return;
    }

    // Create the document
    await docRef.set(userData);
    
    console.log('✅ User document created successfully!');
    console.log('   Document ID:', userId);
    console.log('   Email:', userEmail);
    console.log('   Role: national_admin');
    console.log('\n🎉 You can now login at: https://blp-imis-e9428.web.app/login');
  } catch (error) {
    const errorCode = error.code || error.message;
    
    if (errorCode === 5 || error.message?.includes('NOT_FOUND')) {
      console.error('❌ Firestore database not found!');
      console.error('');
      console.error('   This usually means Firestore hasn\'t been initialized in your project.');
      console.error('   You need to create the Firestore database first:');
      console.error('');
      console.error('   Option 1: Via Firebase Console (Recommended)');
      console.error('   1. Go to: https://console.firebase.google.com/project/blp-imis/firestore');
      console.error('   2. Click "Create database"');
      console.error('   3. Choose "Start in production mode" or "Start in test mode"');
      console.error('   4. Select a location (e.g., us-central1)');
      console.error('   5. Click "Enable"');
      console.error('');
      console.error('   Option 2: Via Firebase CLI');
      console.error('   firebase init firestore');
      console.error('');
      console.error('   After creating the database, run this script again.');
    } else {
      console.error('❌ Error creating user document:', error.message);
      console.error('   Error code:', error.code || 'N/A');
      if (error.details) {
        console.error('   Details:', error.details);
      }
    }
    process.exit(1);
  } finally {
    if (app) {
      await app.delete();
    }
  }
}

createUserDocument()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

