export const PENDING_PUSH_KEY = "pe_pending_push"

export type PushPayload = {
  type: "admin" | "booking" | "chat" | "payment_request" | "support_reply"
  ticketId?: string
  recipientId?: string
  title?: string
  body?: string
  partnerId?: string
  partnerName?: string
  chatId?: string
  bookingId?: string
}

export function parsePushPayload(data?: Record<string, string> | null): PushPayload | null {
  if (!data?.type) return null
  if (data.type === "support_reply") {
    if (!data.ticketId || !/^[A-Za-z0-9]{20}$/.test(data.ticketId) || !data.recipientId) return null
    return { type: data.type, ticketId: data.ticketId, recipientId: data.recipientId }
  }
  if (
    data.type !== "admin"
    && data.type !== "booking"
    && data.type !== "chat"
    && data.type !== "payment_request"
  ) {
    return null
  }
  return {
    type: data.type,
    title: data.title || "",
    body: data.body || "",
    partnerId: data.partnerId || "",
    partnerName: data.partnerName || "",
    chatId: data.chatId || "",
    bookingId: data.bookingId || "",
  }
}

export function supportPushUrl(payload: PushPayload, uid?: string): string | null {
  if (payload.type !== "support_reply" || !uid || payload.recipientId !== uid) return null
  if (!payload.ticketId || !/^[A-Za-z0-9]{20}$/.test(payload.ticketId)) return null
  return "/ayuda/?consulta=" + payload.ticketId
}

export function savePendingPush(payload: PushPayload) {
  if (typeof window === "undefined") return
  localStorage.setItem(PENDING_PUSH_KEY, JSON.stringify(payload))
}

export function readPendingPush(): PushPayload | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(PENDING_PUSH_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PushPayload
  } catch {
    return null
  }
}

export function clearPendingPush() {
  if (typeof window === "undefined") return
  localStorage.removeItem(PENDING_PUSH_KEY)
}
