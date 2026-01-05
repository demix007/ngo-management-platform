/**
 * Script to check Firestore permissions and database configuration
 * 
 * Usage:
 *   node scripts/check-firestore-permissions.js
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
      credential: admin.credential.cert(serviceAccount),
      // Explicitly set the database URL
      databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
    });
  } else {
    app = admin.app();
  }
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();

async function checkPermissions() {
  console.log('🔍 Checking Firestore Permissions and Configuration');
  console.log('');

  const projectId = 'blp-imis';
  const userId = 'q7z1ILLLCZMNGSmsayD5aXNMdki1';

  // Try different approaches to access Firestore
  console.log('Test 1: List collections (default database)...');
  try {
    const collections = await db.listCollections();
    console.log('✅ Successfully connected to Firestore!');
    console.log('   Collections found:', collections.length);
    collections.forEach(col => {
      console.log('   -', col.id);
    });
    console.log('');

    // Check for users collection
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.limit(5).get();
    console.log('✅ "users" collection accessible');
    console.log('   Documents found:', usersSnapshot.size);
    console.log('');

    // Check specific user
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      console.log('✅ User document found!');
      const data = userDoc.data();
      console.log('   ID:', userDoc.id);
      console.log('   Email:', data?.email);
      console.log('   Role:', data?.role);
    } else {
      console.log('❌ User document NOT found');
      console.log('   Looking for: users/' + userId);
      console.log('   Run: npm run create-user-doc');
    }
    return true;

  } catch (error) {
    console.log('❌ Failed to connect');
    console.log('   Error code:', error.code || 'N/A');
    console.log('   Error message:', error.message);
    console.log('');

    // Check if it's a permissions issue
    if (error.code === 7 || error.message?.includes('PERMISSION_DENIED')) {
      console.log('⚠️  PERMISSION DENIED - Service account lacks permissions');
      console.log('');
      console.log('   To fix:');
      console.log('   1. Go to: https://console.cloud.google.com/iam-admin/iam?project=blp-imis');
      console.log('   2. Find: firebase-adminsdk-fbsvc@blp-imis.iam.gserviceaccount.com');
      console.log('   3. Ensure it has "Firebase Admin" or "Editor" role');
      console.log('   4. Or grant "Cloud Datastore User" role');
    } else if (error.code === 5 || error.message?.includes('NOT_FOUND')) {
      console.log('⚠️  NOT_FOUND - Database may not be accessible yet');
      console.log('');
      console.log('   Possible causes:');
      console.log('   1. Database was just created (wait 2-3 minutes)');
      console.log('   2. Database is in a different location');
      console.log('   3. Service account needs permissions');
      console.log('');
      console.log('   Try:');
      console.log('   - Wait 2-3 minutes and run this script again');
      console.log('   - Check database location in Firebase Console');
      console.log('   - Verify service account has proper IAM roles');
    }

    return false;
  } finally {
    if (app) {
      await app.delete();
    }
  }
}

checkPermissions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

