import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDPphDVxi7ezadetzwG9nwjJbMPkEETRik",
  authDomain: "omni-signal-app.firebaseapp.com",
  projectId: "omni-signal-app",
  storageBucket: "omni-signal-app.firebasestorage.app",
  messagingSenderId: "417763692600",
  appId: "1:417763692600:web:acd5fad92f34abaf9196cd",
  measurementId: "G-HXN3YY0QY0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged };
