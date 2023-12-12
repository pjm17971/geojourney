import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBwbJqfeNwtFlVW1vDUZ6XLrtquD0I62Uo',
  authDomain: 'geo-journey.firebaseapp.com',
  projectId: 'geo-journey',
  storageBucket: 'geo-journey.appspot.com',
  messagingSenderId: '809194367033',
  appId: '1:809194367033:web:9179021072df345deac5e8',
  measurementId: 'G-JW9TRNQY7K',
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Firebase services
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);
