import { getFunctions, httpsCallable } from "firebase/functions"
import app from "@/lib/firebase"

const REGION = "southamerica-east1"

export type PuntoBotAction =
  | "none"
  | "agenda"
  | "chats"
  | "profile"
  | "home"
  | "mi-servicio"
  | "create-service"
  | "statistics"
  | "stories"
  | "search"
  | "nearby"
  | "map"
  | "login"
  | "confirm_booking"
  | "cancel_booking"
  | "open_chat"
  | "reschedule_booking"
  | "request_payment"
  | "complete_listing"
  | "start_quote"
  | "compare_services"
  | "start_booking"
  | "start_listing_help"
  | "set_reminders"
  | "draft_reply"
  | "toggle_favorite"
  | "open_service"
  | "pay_booking"
  | "leave_review"
  | "mark_paid"
  | "complete_booking"
  | "day_summary"

export type PuntoBotButton = {
  label: string
  action: PuntoBotAction
  searchTerm?: string
  city?: string
  bookingId?: string
  partnerId?: string
  partnerName?: string
  date?: string
  time?: string
  serviceId?: string
}

export type PuntoBotChatResult = {
  reply: string
  action: PuntoBotAction
  searchTerm: string
  city: string
  bookingId: string
  partnerId: string
  partnerName: string
  date: string
  time: string
  serviceId: string
  quoteWork: string
  quoteWhere: string
  quoteWhen: string
  listingDescription: string
  draftReply: string
  reminderMinutes: number
  reviewRating: number
  reviewComment: string
  buttons: PuntoBotButton[]
}

export async function askPuntoBotChat(input: {
  message: string
  history: Array<{ role: "user" | "assistant"; content: string }>
  context: Record<string, unknown>
}): Promise<PuntoBotChatResult> {
  const fn = httpsCallable(getFunctions(app, REGION), "puntoBotChat")
  const result = await fn(input)
  const data = (result.data || {}) as Partial<PuntoBotChatResult>
  return {
    reply: String(data.reply || ""),
    action: (data.action as PuntoBotAction) || "none",
    searchTerm: String(data.searchTerm || ""),
    city: String(data.city || ""),
    bookingId: String(data.bookingId || ""),
    partnerId: String(data.partnerId || ""),
    partnerName: String(data.partnerName || ""),
    date: String(data.date || ""),
    time: String(data.time || ""),
    serviceId: String(data.serviceId || ""),
    quoteWork: String(data.quoteWork || ""),
    quoteWhere: String(data.quoteWhere || ""),
    quoteWhen: String(data.quoteWhen || ""),
    listingDescription: String(data.listingDescription || ""),
    draftReply: String(data.draftReply || ""),
    reminderMinutes: Number(data.reminderMinutes || 0),
    reviewRating: Math.min(5, Math.max(1, Number(data.reviewRating) || 5)),
    reviewComment: String(data.reviewComment || ""),
    buttons: Array.isArray(data.buttons)
      ? data.buttons
          .map((button) => {
            const item = button as PuntoBotButton
            return {
              label: String(item.label || ""),
              action: (item.action as PuntoBotAction) || "none",
              searchTerm: item.searchTerm ? String(item.searchTerm) : undefined,
              city: item.city ? String(item.city) : undefined,
              bookingId: item.bookingId ? String(item.bookingId) : undefined,
              partnerId: item.partnerId ? String(item.partnerId) : undefined,
              partnerName: item.partnerName ? String(item.partnerName) : undefined,
              date: item.date ? String(item.date) : undefined,
              time: item.time ? String(item.time) : undefined,
              serviceId: item.serviceId ? String(item.serviceId) : undefined,
            }
          })
          .filter((button) => button.label)
      : [],
  }
}

export function puntoBotErrorMessage(error: unknown) {
  const err = error as { message?: string; code?: string }
  if (err?.code === "functions/unauthenticated") return "Iniciá sesión para usar Punto."
  if (err?.code === "functions/resource-exhausted") {
    return err.message || "La cuenta de OpenAI no tiene crédito."
  }
  if (err?.message) return err.message
  return "No pude hablar con ChatGPT ahora."
}
