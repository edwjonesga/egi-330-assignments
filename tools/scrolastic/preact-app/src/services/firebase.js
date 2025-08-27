import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBu2c3NBQKg8_ezfKGWfLNcaJ6L1FX1LDE",
  authDomain: "scrolastic.firebaseapp.com",
  projectId: "scrolastic",
  storageBucket: "scrolastic.appspot.com",
  messagingSenderId: "646729855902",
  appId: "1:646729855902:web:4006e3ae83d97f9aa19c8f",
  measurementId: "G-48XKBZVTL1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const functions = getFunctions(app);
export const firestore = getFirestore(app);

export const connectToEmulators = (local) => {
  if (local || window.location.hostname === "localhost") {
    connectFunctionsEmulator(functions, "localhost", 5001);
    connectFirestoreEmulator(firestore, "localhost", 8080);
  }
};
