import { Capacitor } from "@capacitor/core"

/** URL del panel en Vercel. Cambiá esta variable al desplegar. */
export const ADMIN_WEB_URL =
  process.env.NEXT_PUBLIC_ADMIN_URL || "https://punto-encuentro-pied.vercel.app/admin"

export function isNativeApp() {
  return Capacitor.isNativePlatform()
}
