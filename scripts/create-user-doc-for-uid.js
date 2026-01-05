/**
 * Script to create a user document in Firestore for a specific UID
 * 
 * Usage:
 *   node scripts/create-user-doc-for-uid.js <UID> <email> [role] [displayName]
 * 
 * Example:
 *   node scripts/create-user-doc-for-uid.js 7PectH7yyZbR67Qq2vOMl8fyU5h1 user@example.com national_admin "Admin User"
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get command line arguments
const args = process.argv.slice(2);
const userId = args[0];
const userEmail = args[1] || '';
const role = args[2] || 'field_officer';
const displayName = args[3] || userEmail?.split('@')[0] || 'User';

if (!userId) {
  console.error('❌ Error: User ID (UID) is required');
  console.error('');
  console.error('Usage:');
  console.error('  node scripts/create-user-doc-for-uid.js <UID> <email> [role] [displayName]');
  console.error('');
  console.error('Example:');
  console.error('  node scripts/create-user-doc-for-uid.js 7PectH7yyZbR67Qq2vOMl8fyU5h1 user@example.com national_admin "Admin User"');
  process.exit(1);
}

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
  const userData = {
    email: userEmail,
    displayName: displayName,
    role: role,
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
      console.log('\n   To update it, modify the document in Firebase Console or create an update script.');
      return;
    }

    // Create the document
    await docRef.set(userData);
    
    console.log('✅ User document created successfully!');
    console.log('   Document ID:', userId);
    console.log('   Email:', userEmail || '(not set)');
    console.log('   Display Name:', displayName);
    console.log('   Role:', role);
    console.log('   Is Active: true');
    console.log('\n🎉 You can now login at: https://blp-imis-c3e61.web.app/login');
  } catch (error) {
    const errorCode = error.code || error.message;
    
    if (errorCode === 5 || error.message?.includes('NOT_FOUND')) {
      console.error('❌ Firestore database not found!');
      console.error('');
      console.error('   This usually means Firestore hasn\'t been initialized in your project.');
      console.error('   You need to create the Firestore database first:');
      console.error('');
      console.error('   Option 1: Via Firebase Console (Recommended)');
      console.error('   1. Go to: https://console.firebase.google.com/project/blp-imis-c3e61/firestore');
      console.error('   2. Click "Create database"');
      console.error('   3. Choose "Start in test mode" or "Start in production mode"');
      console.error('   4. Select a location (e.g., us-central1)');
      console.error('   5. Click "Enable"');
      console.error('   6. Wait 30-60 seconds for initialization');
      console.error('   7. Run this script again.');
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

