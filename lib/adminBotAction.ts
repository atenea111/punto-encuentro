export type AdminBotTab =
  | "dashboard"
  | "users"
  | "services"
  | "bookings"
  | "moderation"
  | "categories"
  | "reports"
  | "analytics"
  | "notifications"
  | "settings"

export type AdminBotAction = {
  type: "open_tab"
  tab: AdminBotTab
} | {
  type: "draft_push"
  title: string
  body: string
  audience: "all" | "zone" | "category"
  zone?: string
  category?: string
}

const STORAGE_KEY = "pe-admin-bot-action"
export const ADMIN_BOT_EVENT = "pe:admin-bot-action"

export function queueAdminBotAction(action: AdminBotAction) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(action))
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(ADMIN_BOT_EVENT))
}

export function peekAdminBotAction(): AdminBotAction | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AdminBotAction
  } catch {
    return null
  }
}

export function consumeAdminBotAction(): AdminBotAction | null {
  const action = peekAdminBotAction()
  if (typeof window === "undefined") return null
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  return action
}
