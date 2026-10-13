import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBRKbWKaVHnmJdHCPgAA9ULsEp6G1PZLZU",
  authDomain: "mbi-bricks-management.firebaseapp.com",
  projectId: "mbi-bricks-management",
  storageBucket: "mbi-bricks-management.firebasestorage.app",
  messagingSenderId: "747178592792",
  appId: "1:747178592792:web:d343235b9358b2bdd7916d",
  measurementId: "G-DP3NQV6DLF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
const db = getFirestore(app);

let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export { app, auth, googleProvider, db, analytics, firebaseConfig };

