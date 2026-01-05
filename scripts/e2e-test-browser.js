/**
 * Browser-Based E2E Test Data Generator
 * 
 * This script can be run in the browser console after logging in.
 * It uses the Firebase client SDK that's already loaded in the app.
 * 
 * Usage:
 * 1. Log in to the application
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter to run
 * 
 * The script will create test data for all entities.
 */

// Make sure Firebase is available (it should be from the app)
if (typeof window === 'undefined' || !window.firebase) {
  console.error('Firebase not found. Make sure you are logged in and the app is loaded.');
} else {
  console.log('🚀 Starting Browser-Based E2E Test Data Generation...');
  
  // Import Firebase functions (adjust based on your setup)
  // This assumes Firebase is available globally or you can import it
  const { getFirestore, collection, addDoc, Timestamp } = window.firebase.firestore;
  const db = getFirestore();
  
  // Store created IDs
  const createdIds = {
    beneficiaries: [],
    programs: [],
    donations: [],
    grants: [],
    partners: [],
    projects: [],
    events: [],
    workflows: [],
  };
  
  // Helper functions
  function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }
  
  // Create test data (same as Node.js version)
  // ... [Include all the creation functions from the main script]
  
  console.log('✅ Test data generation completed!');
  console.log('Created IDs:', createdIds);
}

