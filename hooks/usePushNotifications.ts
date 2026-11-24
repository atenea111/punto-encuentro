"use client"

import { useEffect, useRef } from "react"
import { Capacitor, type PluginListenerHandle } from "@capacitor/core"
import { arrayUnion, doc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { parsePushPayload, savePendingPush, type PushPayload } from "@/lib/pushNotifications"

async function persistToken(userId: string, token: string) {
  await setDoc(
    doc(db, "users", userId),
    {
      fcmToken: token,
      fcmTokens: arrayUnion(token),
      fcmPlatform: Capacitor.getPlatform(),
      fcmUpdatedAt: new Date(),
    },
    { merge: true }
  )
}

export function usePushNotifications(
  userId: string | undefined,
  onOpen?: (payload: PushPayload) => void
) {
  const onOpenRef = useRef(onOpen)
  onOpenRef.current = onOpen

  useEffect(() => {
    if (!userId || !Capacitor.isNativePlatform()) return

    let cancelled = false
    const listeners: PluginListenerHandle[] = []
    const trackListener = async (pending: Promise<PluginListenerHandle>) => {
      const handle = await pending
      if (cancelled) {
        await handle.remove()
      } else {
        listeners.push(handle)
      }
    }

    const setup = async () => {
      const { PushNotifications } = await import("@capacitor/push-notifications")

      let receive = "denied"
      try {
        const current = await PushNotifications.checkPermissions()
        receive = current.receive
        if (receive !== "granted") {
          const requested = await PushNotifications.requestPermissions()
          receive = requested.receive
        }
      } catch (error) {
        console.error("Permiso de notificaciones no disponible:", error)
        return
      }

      if (cancelled || receive !== "granted") return

      // Registrar los listeners antes de solicitar el token evita perder eventos.
      // En iOS AppDelegate convierte el registro APNs en un token FCM.
      await trackListener(PushNotifications.addListener("registration", (token) => {
        if (!cancelled && token.value) {
          void persistToken(userId, token.value).catch((error) => {
            console.error("Error guardando token FCM:", error)
          })
        }
      }))

      await trackListener(PushNotifications.addListener("registrationError", (error) => {
        console.error("Error registrando push:", error)
      }))

      await trackListener(PushNotifications.addListener("pushNotificationReceived", () => {
        // Con la app abierta Android igual puede mostrar el aviso nativo.
      }))

      await trackListener(PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
        if (cancelled) return
        const payload = parsePushPayload((action.notification.data || {}) as Record<string, string>)
        if (!payload) return
        savePendingPush(payload)
        onOpenRef.current?.(payload)
      }))

      if (!cancelled) await PushNotifications.register()
    }

    setup().catch((error) => {
      console.error("Error iniciando notificaciones:", error)
    })

    return () => {
      cancelled = true
      for (const listener of listeners) {
        void listener.remove().catch((error) => {
          console.error("Error cerrando listener push:", error)
        })
      }
    }
  }, [userId])
}
