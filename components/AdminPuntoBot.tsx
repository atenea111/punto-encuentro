"use client"

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { RotateCcw, Send, Sparkles, X } from "lucide-react"
import { PuntoBotIcon } from "@/components/PuntoBotIcon"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { queueAdminBotAction, type AdminBotTab } from "@/lib/adminBotAction"
import { adminBotErrorMessage, askAdminBotChat } from "@/lib/adminBotChat"

type ChatMessage = { role: "bot" | "user"; content: string }

const TABS: AdminBotTab[] = [
  "dashboard",
  "users",
  "services",
  "bookings",
  "moderation",
  "categories",
  "reports",
  "analytics",
  "notifications",
  "settings",
]

export function AdminPuntoBot({ context }: { context: Record<string, unknown> }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, isTyping])

  useEffect(() => {
    if (!isOpen || messages.length > 0) return
    setMessages([
      {
        role: "bot",
        content: "Soy Punto para el panel. Puedo resumirte el día, priorizar denuncias o armarte un push para que lo revises antes de enviar.",
      },
    ])
  }, [isOpen, messages.length])

  const chips = useMemo(
    () => [
      { text: "Resumen del día", q: "¿Qué debo atender hoy en el panel? Priorizá alertas y denuncias." },
      { text: "Armar un push", q: "Armame un push corto para usuarios, con título y mensaje. Quiero revisarlo antes de enviarlo." },
      { text: "Denuncias", q: "Resumime las denuncias y abrime la sección de moderación." },
    ],
    []
  )

  const sendRef = useRef<(question: string) => Promise<void>>(async () => {})

  const send = async (question: string) => {
    const trimmed = question.trim()
    if (!trimmed || isTyping) return
    const history = messages
      .filter((item) => item.content)
      .slice(-10)
      .map((item) => ({
        role: (item.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: item.content,
      }))
    setMessages((prev) => [...prev, { role: "user", content: trimmed }])
    setDraft("")
    setIsTyping(true)
    try {
      const result = await askAdminBotChat({ message: trimmed, history, context })
      setMessages((prev) => [...prev, { role: "bot", content: result.reply }])
      if (result.action === "open_tab" && TABS.includes(result.tab as AdminBotTab)) {
        queueAdminBotAction({ type: "open_tab", tab: result.tab as AdminBotTab })
      }
      if (result.action === "draft_push" && result.notifTitle && result.notifBody) {
        queueAdminBotAction({
          type: "draft_push",
          title: result.notifTitle,
          body: result.notifBody,
          audience: result.notifAudience,
          zone: result.notifZone,
          category: result.notifCategory,
        })
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", content: adminBotErrorMessage(error) }])
    } finally {
      setIsTyping(false)
    }
  }

  sendRef.current = send

  useEffect(() => {
    const handler = (event: Event) => {
      setIsOpen(true)
      const question = (event as CustomEvent<string>).detail
      if (typeof question === "string" && question) {
        window.setTimeout(() => {
          void sendRef.current(question)
        }, 350)
      }
    }
    window.addEventListener("pe:open-admin-bot", handler)
    return () => window.removeEventListener("pe:open-admin-bot", handler)
  }, [])

  return (
    <>
      {isOpen && (
        <Card className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-[80] w-[min(380px,calc(100vw-24px))] h-[min(560px,72vh)] flex flex-col overflow-hidden rounded-[1.75rem] border border-white/60 shadow-[0_24px_60px_-20px_rgba(15,90,90,0.45)]">
          <div className="bg-primary p-4 text-white relative overflow-hidden shrink-0">
            <div className="absolute right-8 -bottom-10 w-24 h-24 rounded-full bg-[oklch(0.65_0.18_45)]/25" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                  <PuntoBotIcon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="font-black leading-none">Punto Admin</p>
                  <p className="text-[11px] text-white/75 mt-1">ChatGPT · solo el equipo</p>
                </div>
              </div>
              <div className="flex gap-0.5">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/10 rounded-xl" onClick={() => setMessages([])} aria-label="Nueva conversación">
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/10 rounded-xl" onClick={() => setIsOpen(false)} aria-label="Cerrar">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: "oklch(0.98 0.01 200)" }}>
            {messages.map((msg, index) => (
              <div key={`${msg.role}-${index}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "bot" && (
                  <div className="w-8 h-8 rounded-2xl bg-primary flex items-center justify-center mr-2 shrink-0">
                    <PuntoBotIcon className="h-5 w-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] px-3.5 py-3 text-[13px] leading-relaxed font-medium ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-[1.2rem] rounded-br-md"
                      : "bg-white rounded-[1.2rem] rounded-bl-md border border-black/[0.04] text-gray-700"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white rounded-[1.2rem] px-3.5 py-3 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                </div>
              </div>
            )}
          </div>
          <div className="p-3 bg-white border-t space-y-2">
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {chips.map((chip) => (
                <button
                  key={chip.text}
                  disabled={isTyping}
                  onClick={() => void send(chip.q)}
                  className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full bg-[oklch(0.98_0.01_200)] text-gray-700 hover:text-primary disabled:opacity-50"
                >
                  {chip.text}
                </button>
              ))}
            </div>
            <form
              onSubmit={(event: FormEvent) => {
                event.preventDefault()
                void send(draft)
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/40" />
                <Input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Preguntale al panel..."
                  className="h-11 rounded-2xl pl-9 bg-[oklch(0.98_0.01_200)] border-transparent"
                  disabled={isTyping}
                />
              </div>
              <Button
                type="submit"
                size="icon"
                className="h-11 w-11 rounded-2xl bg-[oklch(0.65_0.18_45)] hover:bg-[oklch(0.6_0.18_45)]"
                disabled={isTyping || !draft.trim()}
                aria-label="Enviar"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[70] h-[3.75rem] w-[3.75rem] rounded-[1.25rem] bg-primary text-white shadow-[0_16px_32px_-12px_rgba(15,90,90,0.65)] flex items-center justify-center"
        aria-label={isOpen ? "Cerrar Punto Admin" : "Abrir Punto Admin"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <PuntoBotIcon className="h-9 w-9 text-white" />}
      </button>
    </>
  )
}
