import { useState, useEffect, useCallback } from "react"
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export type AppSettings = {
  emailNotifications: boolean
  pushNotifications: boolean
  appointmentReminders: boolean
  autoAcceptBookings: boolean
  emailVerificationRequired: boolean
  openRegistration: boolean
  sessionTimeout: number
  commissionRate: number
  minPrice: number
  maxPrice: number
  appName: string
  appDescription: string
  appEmail: string
  /** Android versionCode mínimo (Play). 0 = no forzar actualización. */
  minAndroidVersionCode: number
  forceUpdateMessage: string
  /** Si true, bloquea también quienes tengan exactamente el mínimo (solo pruebas). */
  forceUpdateBlockAtMinimum: boolean
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  emailNotifications: true,
  pushNotifications: true,
  appointmentReminders: true,
  autoAcceptBookings: false,
  emailVerificationRequired: true,
  openRegistration: true,
  sessionTimeout: 60,
  commissionRate: 10,
  minPrice: 50,
  maxPrice: 10000,
  appName: "Punto Encuentro",
  appDescription: "Plataforma de servicios profesionales",
  appEmail: "contacto@puntoencuentro.com",
  minAndroidVersionCode: 0,
  forceUpdateMessage:
    "Hay una nueva versión disponible. Actualizá la app desde Google Play para continuar.",
  forceUpdateBlockAtMinimum: false,
}

const SETTINGS_DOC = doc(db, "settings", "app")

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS)
  const [loading, setLoading] = useState(true)

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      const snap = await getDoc(SETTINGS_DOC)
      if (snap.exists()) {
        setSettings({ ...DEFAULT_APP_SETTINGS, ...(snap.data() as Partial<AppSettings>) })
      }
    } catch (error) {
      console.error("Error loading app settings:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    const unsubscribe = onSnapshot(
      SETTINGS_DOC,
      (snap) => {
        if (snap.exists()) {
          setSettings({ ...DEFAULT_APP_SETTINGS, ...(snap.data() as Partial<AppSettings>) })
        } else {
          setSettings(DEFAULT_APP_SETTINGS)
        }
        setLoading(false)
      },
      (error) => {
        console.error("Error loading app settings:", error)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  const saveSettings = async (partial: Partial<AppSettings>) => {
    try {
      const next = { ...settings, ...partial, updatedAt: new Date() }
      await setDoc(SETTINGS_DOC, next, { merge: true })
      setSettings(next)
      return { success: true as const }
    } catch (error: unknown) {
      return { success: false as const, error: (error as Error).message }
    }
  }

  return {
    settings,
    setSettings,
    loading,
    loadSettings,
    saveSettings,
  }
}
