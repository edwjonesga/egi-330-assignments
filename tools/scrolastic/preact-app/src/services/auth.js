import {
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword
} from "firebase/auth";
import { auth } from './firebase';

const onAuthStateChanged = (callback) => {
  return firebaseOnAuthStateChanged(auth, callback);
}

const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

const signInWithEmailAndPassword = (email, password) => {
  return firebaseSignInWithEmailAndPassword(auth, email, password);
}

const signOut = () => {
  return firebaseSignOut(auth);
};

export { onAuthStateChanged, signInWithGoogle, signOut, signInWithEmailAndPassword };
