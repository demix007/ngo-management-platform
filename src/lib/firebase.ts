import { initializeApp, getApps } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import type { FirebaseStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import type { Functions } from "firebase/functions";
import { getAnalytics, type Analytics } from "firebase/analytics";


// Firebase configuration with environment variable support
// In production, use environment variables for better security
// Fallback to hardcoded values for development convenience
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCuycS1efFiGsniSCSebJwfevYFjxnPPcs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "blp-imis-c3e61.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "blp-imis-c3e61",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "blp-imis-c3e61.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "794637248738",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:794637248738:web:88fb38b37b67d7207116bb",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-PWDZQ8X59D"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let functions: Functions;
let analytics: Analytics;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  analytics = getAnalytics(app);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(app);

  // Enable offline persistence for Firestore
  if (typeof window !== "undefined") {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === "failed-precondition") {
        console.warn(
          "Multiple tabs open, persistence can only be enabled in one tab at a time."
        );
      } else if (err.code === "unimplemented") {
        console.warn(
          "The current browser does not support all of the features required for persistence."
        );
      }
    });
  }

  // Connect to emulators in development (set VITE_USE_EMULATORS=true in .env)
  // Note: In production, replace the config values above with actual environment variables
  // or use a build-time replacement strategy
}

export { app, auth, db, storage, functions, analytics };
export type { FirebaseApp, Auth, Firestore, FirebaseStorage, Functions };
