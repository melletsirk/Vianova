// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCi1McJ5npdsoww9qiOVcyj_0gGFsjvqM4",
  authDomain: "vianovadb.firebaseapp.com",
  projectId: "vianovadb",
  storageBucket: "vianovadb.firebasestorage.app",
  messagingSenderId: "718350529823",
  appId: "1:718350529823:web:fda1e840eae4755c312c2a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);