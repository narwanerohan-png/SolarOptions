import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, linkWithCredential } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Build a dynamic config that supports environment variable overrides and smart domain detection
const getDynamicFirebaseConfig = () => {
  // Base configuration from firebase-applet-config.json
  const config = { ...firebaseConfig } as any;

  // 1. Support overriding any property with VITE_ environment variables for production
  const envConfig: Record<string, string | undefined> = {
    apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
    authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: (import.meta as any).env.VITE_FIREBASE_APP_ID,
    measurementId: (import.meta as any).env.VITE_FIREBASE_MEASUREMENT_ID,
    firestoreDatabaseId: (import.meta as any).env.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
  };

  Object.keys(envConfig).forEach((key) => {
    if (envConfig[key]) {
      config[key] = envConfig[key];
    }
  });

  // 2. Intelligent Custom Domain detection:
  // Using custom host-based authDomains can lead to proxy issues, Vercel routing loops, and SSL/CORS rejections
  // during signInWithPopup, which opens the homepage inside the popup and leaves the parent tab hanging.
  // We prioritize the fully authorized firebaseapp.com domain unless VITE_FIREBASE_AUTH_DOMAIN is explicitly configured.
  if (typeof window !== 'undefined') {
    const overrideAuthDomain = (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN;
    if (overrideAuthDomain) {
      config.authDomain = overrideAuthDomain;
      console.log(`[Firebase Auth Domain] Overridden by environment variable: "${overrideAuthDomain}"`);
    } else {
      // Keep native dependable firebaseapp.com domain to ensure secure and seamless authorization
      console.log(`[Firebase Auth Domain] Utilizing dependable default authorization domain: "${config.authDomain}"`);
    }
  }

  return config;
};

const finalConfig = getDynamicFirebaseConfig();

const app = !getApps().length ? initializeApp(finalConfig) : getApp();
export const auth = getAuth(app);
export const db = finalConfig.firestoreDatabaseId 
  ? getFirestore(app, finalConfig.firestoreDatabaseId)
  : getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { signInWithPopup, signInWithEmailAndPassword, linkWithCredential, GoogleAuthProvider };

