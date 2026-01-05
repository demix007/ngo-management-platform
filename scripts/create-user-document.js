/**
 * Script to create a user document in Firestore
 * 
 * Usage:
 *   node scripts/create-user-document.js
 * 
 * Make sure you have Firebase Admin SDK set up or use Firebase CLI
 */

// Option 1: Using Firebase Admin SDK (requires service account key)
const admin = require('firebase-admin');

// Initialize Firebase Admin
// You'll need to download service account key from:
// Firebase Console > Project Settings > Service Accounts > Generate New Private Key
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
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
    await db.collection('users').doc(userId).set(userData);
    console.log('✅ User document created successfully!');
    console.log('Document ID:', userId);
    console.log('Email:', userEmail);
    console.log('Role:', 'national_admin');
    console.log('\n🎉 You can now login at: https://blp-imis-e9428.web.app/login');
  } catch (error) {
    console.error('❌ Error creating user document:', error.message);
    process.exit(1);
  }
}

createUserDocument()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

