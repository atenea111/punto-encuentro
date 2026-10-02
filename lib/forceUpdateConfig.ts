import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

const PUBLIC_CONFIG = doc(db, "app_config", "android")

/** Documento legible por todos los usuarios (reglas Firestore). */
export async function syncPublicAndroidMinVersion(minVersionCode: number) {
  await setDoc(
    PUBLIC_CONFIG,
    {
      minVersionCode,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

export async function fetchPublicAndroidMinVersion(): Promise<number> {
  try {
    const snap = await getDoc(PUBLIC_CONFIG)
    if (snap.exists()) {
      const value = Number(snap.data().minVersionCode)
      if (!Number.isNaN(value) && value > 0) return value
    }
  } catch (error) {
    console.error("No se pudo leer app_config/android:", error)
  }
  return 0
}
