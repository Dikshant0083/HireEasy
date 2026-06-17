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
 * Sign in with Google.
 * - Tries popup first (works on most browsers when triggered by user click).
 * - If popup is blocked, automatically falls back to redirect.
 */
export async function signInWithGoogle() {
  try {
    // Always try popup first — works when called directly from a user click
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (err) {
    if (
      err.code === 'auth/popup-blocked' ||
      err.code === 'auth/popup-cancelled-by-user' ||
      err.code === 'auth/cancelled-popup-request'
    ) {
      // Popup was blocked — fall back to redirect
      console.log('Popup blocked, switching to redirect...');
      await signInWithRedirect(auth, googleProvider);
      return null; // page will reload
    }
    throw err; // re-throw other errors
  }
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
