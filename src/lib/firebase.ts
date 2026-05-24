import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
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
  // If the website runs on solaroptions.in or www.solaroptions.in, and the user hasn't explicitly
  // overridden VITE_FIREBASE_AUTH_DOMAIN, set authDomain to the current custom domain.
  // This allows Firebase Auth to securely load the auth handler widget from the custom domain,
  // prompting the browser with "Continue to SolarOptions" rather than the fallback.
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname.toLowerCase();
    const isSolaroptionsDomain = hostname === 'solaroptions.in' || hostname === 'www.solaroptions.in' || hostname.endsWith('.solaroptions.in');
    
    if (isSolaroptionsDomain) {
      if (!(import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN) {
        config.authDomain = hostname;
        console.log(`[Firebase Custom Auth Domain] Detected SolarOptions domain: "${hostname}". Dynamically routing authorization through this custom domain.`);
      }
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

export { signInWithPopup };
