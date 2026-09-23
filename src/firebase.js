// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBXmJ91NphDqwSOLuHhLFzGhUJpF32vGqI",
  authDomain: "library-book-system-e6395.firebaseapp.com",
  projectId: "library-book-system-e6395",
  storageBucket: "library-book-system-e6395.firebasestorage.app",
  messagingSenderId: "125909771004",
  appId: "1:125909771004:web:dcd1eb6a5766bdb3d0ed79",
  measurementId: "G-1DVR3VZKZX",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Analytics only works in the browser (not during SSR/build), so guard it
isSupported().then((supported) => {
  if (supported) getAnalytics(app);
});

// Auth instance used for Google Sign-In
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// Force the account picker every time, instead of silently reusing the
// last Google account the browser remembers.
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Firestore — used to persist each Google user's role ('admin' | 'student').
// NOTE: temporarily using plain getFirestore() (no offline persistence)
// while debugging a sync issue — writes seemed to succeed locally but
// weren't reaching the server. Once confirmed working, we can switch back
// to initializeFirestore + persistentLocalCache.
export const db = getFirestore(app);

export default app;
