import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDT1Lbyw2-vBc0NjhE272VSgFdBRwkdnLM',
  authDomain: 'd1-rental-tracker.firebaseapp.com',
  projectId: 'd1-rental-tracker',
  storageBucket: 'd1-rental-tracker.firebasestorage.app',
  messagingSenderId: '893221518173',
  appId: '1:893221518173:web:6922e3cfb60c6c1c5ec6b4',
  measurementId: 'G-TMWV6ZYVGY',
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)

// Firestore instance
export const db = getFirestore(app)
