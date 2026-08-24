import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  type Firestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA0a45PvGAEwezMaV-DnEs4f2wxcDRlIys',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'metriaebaty.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'metriaebaty',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'metriaebaty.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '985210980979',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:985210980979:web:a3502b0141b80f8458f806',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-50L1HR027K',
};

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app);
