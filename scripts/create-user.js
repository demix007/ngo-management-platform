/**
 * Script to create a user in Firebase Authentication and Firestore
 * 
 * Usage:
 *   node scripts/create-user.js <email> <password> <role> [displayName] [state] [lga]
 * 
 * Example:
 *   node scripts/create-user.js admin@ngo.org password123 national_admin "Admin User" "Lagos" "Ikeja"
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin (you'll need to download service account key)
// Download from: Firebase Console > Project Settings > Service Accounts > Generate New Private Key
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function createUser(email, password, role, displayName, state, lga) {
  try {
    // Create user in Firebase Authentication
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: displayName || email.split('@')[0],
      emailVerified: false,
    });

    console.log('✅ User created in Firebase Auth:', userRecord.uid);

    // Create user document in Firestore
    const userDoc = {
      email: email,
      displayName: displayName || email.split('@')[0],
      role: role,
      state: state || null,
      lga: lga || null,
      isActive: true,
      twoFactorEnabled: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('users').doc(userRecord.uid).set(userDoc);
    console.log('✅ User document created in Firestore');

    console.log('\n📋 User Details:');
    console.log('  UID:', userRecord.uid);
    console.log('  Email:', email);
    console.log('  Role:', role);
    console.log('  Display Name:', displayName || email.split('@')[0]);
    if (state) console.log('  State:', state);
    if (lga) console.log('  LGA:', lga);

    console.log('\n✅ User created successfully!');
    return userRecord.uid;
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    throw error;
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
  console.log('Usage: node scripts/create-user.js <email> <password> <role> [displayName] [state] [lga]');
  console.log('\nRoles: national_admin, state_admin, field_officer, m_e, finance, donor');
  process.exit(1);
}

const [email, password, role, displayName, state, lga] = args;

// Validate role
const validRoles = ['national_admin', 'state_admin', 'field_officer', 'm_e', 'finance', 'donor'];
if (!validRoles.includes(role)) {
  console.error(`❌ Invalid role. Must be one of: ${validRoles.join(', ')}`);
  process.exit(1);
}

// Validate password
if (password.length < 6) {
  console.error('❌ Password must be at least 6 characters long');
  process.exit(1);
}

createUser(email, password, role, displayName, state, lga)
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  });

