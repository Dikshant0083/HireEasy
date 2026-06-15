import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
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

export {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
};

export default app;
