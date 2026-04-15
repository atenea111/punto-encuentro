import { initializeApp } from 'firebase/app'
import {
  getAuth,
  initializeAuth,
  setPersistence,
  browserLocalPersistence,
  type Auth,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Capacitor } from '@capacitor/core'

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

// Auth: en app nativa (Capacitor/Android) la sesión se pierde si usamos getAuth + setPersistence.
// Inicializar con persistence desde el inicio en nativo evita que al cerrar/abrir pida login de nuevo.
export const auth: Auth = Capacitor.isNativePlatform()
  ? initializeAuth(app, { persistence: browserLocalPersistence })
  : (() => {
      const a = getAuth(app)
      setPersistence(a, browserLocalPersistence).catch((error) => {
        console.error('Error setting persistence:', error)
      })
      return a
    })()
export const db = getFirestore(app)
export const storage = getStorage(app)

export const uploadFile = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}
export default app

