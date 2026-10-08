import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  AuthError,
} from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import localFirebaseConfig from '../../firebase-applet-config.json';

// Support both local JSON config and environment variables (for Vercel/production deployments)
const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || localFirebaseConfig.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || localFirebaseConfig.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || localFirebaseConfig.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || localFirebaseConfig.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || localFirebaseConfig.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || localFirebaseConfig.appId,
  firestoreDatabaseId: metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID || localFirebaseConfig.firestoreDatabaseId,
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with force long-polling to prevent proxy/iframe streaming connection timeout
initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

// CRITICAL: Must include firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface AuthErrorDetails {
  code: string;
  title: string;
  message: string;
  actionHint?: string;
  isDomainError?: boolean;
  isOperationDisabled?: boolean;
}

/**
 * Parses Firebase Auth errors and maps them to human-readable actionable messages.
 */
export function parseAuthError(error: any): AuthErrorDetails {
  const code = error?.code || (error instanceof Error ? error.message : String(error));
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'your-domain';

  switch (code) {
    case 'auth/unauthorized-domain':
      return {
        code,
        title: 'Domain Not Authorized in Firebase',
        message: `The domain "${currentHostname}" is not listed in your Firebase project's Authorized Domains list.`,
        actionHint: `Go to Firebase Console -> Authentication -> Settings -> Authorized domains, click "Add Domain", and enter "${currentHostname}". Also add your Vercel/custom domain.`,
        isDomainError: true,
      };

    case 'auth/operation-not-allowed':
      return {
        code,
        title: 'Authentication Provider Disabled',
        message: 'This sign-in method is currently disabled in your Firebase project configuration.',
        actionHint: 'Go to Firebase Console -> Authentication -> Sign-in method, and ensure both "Email/Password" and "Google" providers are ENABLED.',
        isOperationDisabled: true,
      };

    case 'auth/popup-closed-by-user':
      return {
        code,
        title: 'Google Sign-In Cancelled',
        message: 'The Google Sign-In popup window was closed before completing authentication.',
        actionHint: 'Please try clicking "Sign in with Google" again and complete the account selection prompt.',
      };

    case 'auth/popup-blocked':
      return {
        code,
        title: 'Popup Window Blocked',
        message: 'Your browser blocked the Google Sign-In popup window.',
        actionHint: 'Please allow popups for this site in your browser address bar and try signing in again.',
      };

    case 'auth/email-already-in-use':
      return {
        code,
        title: 'Email Already Registered',
        message: 'An account with this email address already exists.',
        actionHint: 'Please sign in with your password or use Google Sign-In.',
      };

    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return {
        code,
        title: 'Invalid Email or Password',
        message: 'The email address or password you entered is incorrect.',
        actionHint: 'Please check your credentials or click "Forgot Password" to reset your access.',
      };

    case 'auth/weak-password':
      return {
        code,
        title: 'Password Too Weak',
        message: 'The password provided is too weak.',
        actionHint: 'Please choose a stronger password with at least 6 characters, including numbers or symbols.',
      };

    case 'auth/invalid-email':
      return {
        code,
        title: 'Invalid Email Address',
        message: 'The email address format is invalid.',
        actionHint: 'Please enter a valid email address (e.g., user@example.com).',
      };

    case 'auth/network-request-failed':
      return {
        code,
        title: 'Network Request Failed',
        message: 'Unable to communicate with Firebase Authentication servers.',
        actionHint: 'Please check your internet connection and verify your domain network access.',
      };

    default:
      return {
        code,
        title: 'Authentication Error',
        message: error?.message || 'An unexpected error occurred during authentication.',
        actionHint: 'Verify that your Firebase Auth setup matches your project credentials and environment configuration.',
      };
  }
}

export interface FirebaseStartupStatus {
  isConfigured: boolean;
  projectId: string;
  authDomain: string;
  hasApiKey: boolean;
  currentHost: string;
  isDomainLikelyAuthorized: boolean;
  statusMessage: string;
}

/**
 * Startup diagnostic checks for Firebase Auth and Firestore configuration.
 */
export function checkFirebaseStartupConfig(): FirebaseStartupStatus {
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const hasApiKey = Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey.length > 10);
  const projectId = firebaseConfig.projectId || '';
  const authDomain = firebaseConfig.authDomain || '';

  // Basic sanity checks
  const isConfigured = hasApiKey && Boolean(projectId) && Boolean(authDomain);

  // Check if domain is standard dev / firebase / vercel host
  const isDomainLikelyAuthorized =
    currentHost === 'localhost' ||
    currentHost === '127.0.0.1' ||
    currentHost.endsWith('.firebaseapp.com') ||
    currentHost.endsWith('.web.app') ||
    currentHost.endsWith('.run.app') ||
    currentHost.endsWith('.vercel.app');

  let statusMessage = 'Firebase Authentication initialized successfully.';
  if (!isConfigured) {
    statusMessage = 'Firebase configuration is missing or incomplete. Check firebase-applet-config.json or environment variables.';
  } else if (!isDomainLikelyAuthorized) {
    statusMessage = `Warning: Hosting domain (${currentHost}) may require addition to Firebase Authorized Domains in Firebase Console.`;
  }

  return {
    isConfigured,
    projectId,
    authDomain,
    hasApiKey,
    currentHost,
    isDomainLikelyAuthorized,
    statusMessage,
  };
}

// Validate connection to Firestore on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export async function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function loginWithEmail(email: string, pass: string) {
  return signInWithEmailAndPassword(auth, email, pass);
}

export async function registerWithEmail(email: string, pass: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  if (credential.user) {
    await sendEmailVerification(credential.user);
  }
  return credential;
}

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export async function logoutFirebase() {
  return signOut(auth);
}


