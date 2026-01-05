/**
 * Script to verify user document exists in Firestore
 * 
 * Usage:
 *   node scripts/verify-user-doc.js
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

const db = admin.firestore();

async function verifyUserDocument() {
  const userId = 'q7z1ILLLCZMNGSmsayD5aXNMdki1';
  const userEmail = 'ayodejiabidemi007@gmail.com';

  console.log('🔍 Verifying user document in Firestore...');
  console.log('   User ID:', userId);
  console.log('   Email:', userEmail);
  console.log('');

  try {
    // Check if document exists
    const docRef = db.collection('users').doc(userId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.log('❌ Document NOT FOUND!');
      console.log('');
      console.log('   The document with ID "' + userId + '" does not exist in the "users" collection.');
      console.log('');
      console.log('   To fix this:');
      console.log('   1. Go to: https://console.firebase.google.com/project/blp-imis/firestore/data');
      console.log('   2. Click on "users" collection');
      console.log('   3. Check if a document with ID "' + userId + '" exists');
      console.log('   4. If not, create it with that exact ID');
      console.log('   5. Or run: npm run create-user-doc');
      return false;
    }

    const userData = docSnap.data();
    console.log('✅ Document FOUND!');
    console.log('');
    console.log('   Document Data:');
    console.log('   - ID:', docSnap.id);
    console.log('   - Email:', userData?.email || '❌ MISSING');
    console.log('   - Display Name:', userData?.displayName || '❌ MISSING');
    console.log('   - Role:', userData?.role || '❌ MISSING (REQUIRED!)');
    console.log('   - Is Active:', userData?.isActive ?? '❌ MISSING');
    console.log('   - Two Factor Enabled:', userData?.twoFactorEnabled ?? '❌ MISSING');
    console.log('   - Created At:', userData?.createdAt ? userData.createdAt.toDate().toISOString() : '❌ MISSING');
    console.log('   - Updated At:', userData?.updatedAt ? userData.updatedAt.toDate().toISOString() : '❌ MISSING');
    console.log('');

    // Check required fields
    const requiredFields = ['email', 'role', 'isActive', 'twoFactorEnabled'];
    const missingFields = requiredFields.filter(field => userData?.[field] === undefined);

    if (missingFields.length > 0) {
      console.log('⚠️  WARNING: Missing required fields:');
      missingFields.forEach(field => {
        console.log('   -', field);
      });
      console.log('');
      console.log('   The document exists but is missing required fields.');
      console.log('   This may cause login to fail.');
      return false;
    }

    // Check role value
    const validRoles = ['national_admin', 'state_admin', 'field_officer', 'm_e', 'finance', 'donor'];
    if (!validRoles.includes(userData?.role)) {
      console.log('⚠️  WARNING: Invalid role value:', userData?.role);
      console.log('   Valid roles are:', validRoles.join(', '));
      return false;
    }

    console.log('✅ All required fields are present!');
    console.log('✅ Document structure is correct!');
    console.log('');
    console.log('🎉 Your user document is ready for login!');
    return true;

  } catch (error) {
    console.error('❌ Error checking document:', error.message);
    if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
      console.error('');
      console.error('   Firestore database may not be initialized.');
      console.error('   Run: npm run setup-firestore');
    }
    return false;
  } finally {
    if (app) {
      await app.delete();
    }
  }
}

verifyUserDocument()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

