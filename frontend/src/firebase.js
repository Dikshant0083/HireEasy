import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyB9kH8knUsgg2xbylO_pArTInpCq61a1Vw',
  authDomain: 'resumeanalyzer-50e48.firebaseapp.com',
  databaseURL: 'https://resumeanalyzer-50e48-default-rtdb.firebaseio.com',
  projectId: 'resumeanalyzer-50e48',
  storageBucket: 'resumeanalyzer-50e48.firebasestorage.app',
  messagingSenderId: '734092078043',
  appId: '1:734092078043:web:62db51a75673753bfbd5fe',
  measurementId: 'G-H9KB7957M8',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sign in with Google: popup first (keeps the page and form state), and if the
 * browser blocks popups (Chrome often does per site) fall back to a full-page
 * redirect. Returns the popup result, or null when the page is redirecting;
 * the redirect result is picked up by getRedirectResult on the auth pages.
 */
export async function signInWithGoogle() {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err) {
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
}

// Where to go after sign-in has to survive the full-page Google redirect.
const AFTER_AUTH_KEY = 'hireeasy_after_auth';
export function rememberAfterAuth(dest, reason) {
  try { sessionStorage.setItem(AFTER_AUTH_KEY, JSON.stringify({ dest, reason })); } catch (_) {}
}
export function takeAfterAuth() {
  try {
    const v = JSON.parse(sessionStorage.getItem(AFTER_AUTH_KEY) || 'null');
    sessionStorage.removeItem(AFTER_AUTH_KEY);
    return v;
  } catch (_) { return null; }
}

export {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
};

export default app;
