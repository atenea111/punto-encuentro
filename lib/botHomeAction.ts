export type BotHomeAction =
  | { type: "search"; term: string; city?: string }
  | { type: "nearby" }
  | { type: "map" }

const STORAGE_KEY = "pe-bot-home-action"
export const BOT_HOME_EVENT = "pe:bot-home-action"

export function queueBotHomeAction(action: BotHomeAction) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(action))
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(BOT_HOME_EVENT))
}

export function consumeBotHomeAction(): BotHomeAction | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    sessionStorage.removeItem(STORAGE_KEY)
    return JSON.parse(raw) as BotHomeAction
  } catch {
    return null
  }
}
