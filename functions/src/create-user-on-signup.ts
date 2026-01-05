/**
 * Cloud Function to automatically create user document in Firestore
 * when a new user signs up via Firebase Authentication
 * 
 * This allows self-registration while maintaining security
 */

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

// Admin is initialized in index.ts, so we don't need to initialize here
// If this file is loaded independently, initialize with a guard
if (!admin.apps.length) {
  admin.initializeApp()
}

export const createUserDocument = functions.auth.user().onCreate(async (user) => {
  const db = admin.firestore()
  const userRef = db.collection('users').doc(user.uid)

  // Check if user document already exists
  const userDoc = await userRef.get()
  if (userDoc.exists) {
    console.log(`User document already exists for ${user.uid}`)
    return null
  }

  // Create user document with default values
  // Note: Role should be set manually by admin or through a registration form
  const userData = {
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
    role: 'field_officer', // Default role - should be updated by admin
    isActive: false, // Default to inactive until approved by admin
    twoFactorEnabled: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }

  try {
    await userRef.set(userData)
    console.log(`User document created for ${user.uid}`)
    return null
  } catch (error) {
    console.error(`Error creating user document for ${user.uid}:`, error)
    throw error
  }
})

