import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyDtcg_xQXLi0IX9C3B0D7k5AznagrOLMk0",
  authDomain: "punto-encuentro-aa7a2.firebaseapp.com",
  projectId: "punto-encuentro-aa7a2",
  storageBucket: "punto-encuentro-aa7a2.firebasestorage.app",
  messagingSenderId: "1053356946867",
  appId: "1:1053356946867:web:98e2802eab8bd3055887c6",
  measurementId: "G-BGYRMEQQZB"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Configure persistence
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting persistence:', error)
})

export default app

