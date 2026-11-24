import { getFunctions, httpsCallable } from "firebase/functions"
import { Capacitor } from "@capacitor/core"
import { Browser } from "@capacitor/browser"
import app from "@/lib/firebase"

const REGION = "southamerica-east1"

function functionsClient() {
  return getFunctions(app, REGION)
}

export async function openExternalUrl(url: string) {
  if (typeof window === "undefined" || !url) return
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url })
    return
  }
  window.open(url, "_blank", "noopener,noreferrer")
}

export async function startMercadoPagoOAuth() {
  const start = httpsCallable(functionsClient(), "mpOAuthStart")
  const result = await start()
  const url = (result.data as { url?: string })?.url
  if (!url) throw new Error("No se pudo abrir Mercado Pago.")
  await openExternalUrl(url)
}

export async function disconnectMercadoPago() {
  const fn = httpsCallable(functionsClient(), "mpDisconnect")
  await fn()
}

export async function createMercadoPagoCheckout(bookingId: string) {
  const fn = httpsCallable(functionsClient(), "mpCreateCheckout")
  const result = await fn({ bookingId })
  return result.data as { initPoint?: string | null; alreadyPaid?: boolean }
}

export function callableErrorMessage(error: unknown) {
  const anyErr = error as { message?: string; code?: string }
  if (anyErr?.message) return anyErr.message
  return "No se pudo completar la operación con Mercado Pago."
}
