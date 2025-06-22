// /src/firebaseConfig.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // Import Firestore
import { getStorage } from "firebase/storage";
import { getAuth } from 'firebase/auth';
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAAtT8APXrA2yvehNbvzVDxs6W0gjvIOu8",
  authDomain: "telemedical-project.firebaseapp.com",
  projectId: "telemedical-project",
  storageBucket: "telemedical-project.firebasestorage.app",
  messagingSenderId: "481639725085",
  appId: "1:481639725085:web:4e86318828036af3766ef4",
  measurementId: "G-SEFCKP3S5L"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const db = getFirestore(app);
const storage = getStorage(app); // ✅ Initialize Firebase Storage

const auth = getAuth(app);

export { db, storage, auth }; // ✅ Export both db and storage
