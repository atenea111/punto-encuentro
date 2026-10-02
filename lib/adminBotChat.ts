import { getFunctions, httpsCallable } from "firebase/functions"
import app from "@/lib/firebase"

const REGION = "southamerica-east1"

export type AdminBotChatResult = {
  reply: string
  action: "none" | "open_tab" | "draft_push"
  tab: string
  notifTitle: string
  notifBody: string
  notifAudience: "all" | "zone" | "category"
  notifZone: string
  notifCategory: string
}

export async function askAdminBotChat(input: {
  message: string
  history: Array<{ role: "user" | "assistant"; content: string }>
  context: Record<string, unknown>
}): Promise<AdminBotChatResult> {
  const fn = httpsCallable(getFunctions(app, REGION), "adminBotChat")
  const result = await fn(input)
  const data = (result.data || {}) as Partial<AdminBotChatResult>
  const audience = data.notifAudience
  return {
    reply: String(data.reply || ""),
    action: data.action === "open_tab" || data.action === "draft_push" ? data.action : "none",
    tab: String(data.tab || ""),
    notifTitle: String(data.notifTitle || ""),
    notifBody: String(data.notifBody || ""),
    notifAudience: audience === "zone" || audience === "category" ? audience : "all",
    notifZone: String(data.notifZone || ""),
    notifCategory: String(data.notifCategory || ""),
  }
}

export function adminBotErrorMessage(error: unknown) {
  const err = error as { message?: string; code?: string }
  if (err?.code === "functions/unauthenticated") return "Iniciá sesión como admin."
  if (err?.code === "functions/permission-denied") return "Esta cuenta no es admin."
  if (err?.code === "functions/resource-exhausted") return err.message || "La cuenta de OpenAI no tiene crédito."
  if (err?.message) return err.message
  return "No pude hablar con ChatGPT ahora."
}
