"use client"

import { useState, useEffect, useRef, useMemo, type FormEvent } from "react"
import { AppIcon, type UiIconName } from "@/components/AppIcon"
import { PuntoBotIcon } from "@/components/PuntoBotIcon"
import { DraggableAnchor } from "@/components/DraggableFloat"
import {
  BookPanel,
  BotSheet,
  ComparePanel,
  DraftReplyPanel,
  ListingPanel,
  QuotePanel,
  ReminderPanel,
  ReviewPanel,
  defaultQuoteMessage,
  type QuoteDraft,
} from "@/components/PuntoBotPanels"
import { X, Send, RotateCcw, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { doc, onSnapshot, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useBookings } from "@/hooks/useBookings"
import { useChatInbox } from "@/hooks/useChat"
import { useFavorites } from "@/hooks/useFavorites"
import { useAppSettings } from "@/hooks/useAppSettings"
import { isUnpaidBooking } from "@/lib/bookingPayments"
import { queueBotHomeAction } from "@/lib/botHomeAction"
import { sendChatMessage } from "@/lib/chat"
import { listingGaps, updateServiceFields } from "@/lib/listingGaps"
import { callableErrorMessage, createMercadoPagoCheckout, openExternalUrl as openMercadoPagoUrl } from "@/lib/mercadopagoConnect"
import { useReviews } from "@/hooks/useReviews"
import { findRelatedServices } from "@/lib/puntoBotMatch"
import { parseMoney } from "@/lib/formatMoney"
import { isServiceActive } from "@/lib/serviceUtils"
import { useVisibleViewport } from "@/hooks/useKeyboardInset"
import {
  askPuntoBotChat,
  puntoBotErrorMessage,
  type PuntoBotAction,
  type PuntoBotButton,
} from "@/lib/puntoBotChat"

type Role = "client" | "provider"

type ChatMessage = {
  role: "bot" | "user"
  content: string
  buttons?: PuntoBotButton[]
}

interface FloatingAssistantProps {
  user: any
  role?: Role
  bookings: any[]
  services: any[]
  setFlow: (flow: string) => void
  setActiveChat?: (chat: { partnerId: string; partnerName: string; from?: string }) => void
  setSelectedProviderService?: (service: any) => void
  setSelectedService?: (service: any) => void
  registerBotBackHandler?: (handler: (() => boolean) | null) => void
  currentFlow?: string
}

function parseBookingWhen(booking: any): Date | null {
  if (!booking?.date) return null
  const date = booking.date instanceof Date ? new Date(booking.date) : new Date(booking.date)
  if (Number.isNaN(date.getTime())) return null
  const time = String(booking.time || "")
  const [hours, minutes] = time.split(":")
  if (hours) date.setHours(Number(hours) || 0, Number(minutes) || 0, 0, 0)
  return date
}

function formatWhen(date: Date) {
  return date.toLocaleString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function normalizeDate(value?: string) {
  const raw = String(value || "").trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const match = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (!match) return ""
  return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`
}

function normalizeTime(value?: string) {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})/)
  if (!match) return ""
  return `${match[1].padStart(2, "0")}:${match[2]}`
}

function todayIso() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

function canReviewBooking(booking: any) {
  if (!booking || booking.reviewed || booking.status === "cancelled") return false
  if (booking.status === "completed") return true
  const appointmentDate = new Date(`${booking.date}T${booking.time || "23:59"}`)
  return !Number.isNaN(appointmentDate.getTime()) && appointmentDate.getTime() <= Date.now()
}

export function FloatingAssistant({
  user,
  role = "client",
  bookings,
  services,
  setFlow,
  setActiveChat,
  setSelectedProviderService,
  setSelectedService,
  registerBotBackHandler,
  currentFlow,
}: FloatingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [panel, setPanel] = useState<
    "quote" | "book" | "compare" | "listing" | "reminder" | "draft" | "review" | null
  >(null)
  const [quote, setQuote] = useState<QuoteDraft>({
    work: "",
    where: "",
    when: "",
    photoUrls: [],
    selectedIds: [],
    message: "",
  })
  const [bookServiceId, setBookServiceId] = useState("")
  const [bookDate, setBookDate] = useState("")
  const [bookTime, setBookTime] = useState("")
  const [compareTerm, setCompareTerm] = useState("")
  const [compareCity, setCompareCity] = useState("")
  const [listingDraft, setListingDraft] = useState("")
  const [draftReply, setDraftReply] = useState("")
  const [draftPartner, setDraftPartner] = useState<{ partnerId: string; partnerName: string } | null>(null)
  const [reviewBookingId, setReviewBookingId] = useState("")
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState("")
  const [userCity, setUserCity] = useState("")
  const [reminderMinutes, setReminderMinutes] = useState(60)
  const [panelBusy, setPanelBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { totalUnread, chats } = useChatInbox(user?.uid)
  const { updateBooking, cancelBooking, createBooking } = useBookings()
  const { favoriteServiceIds, toggleFavorite } = useFavorites(role === "client" ? user?.uid : undefined)
  const { addReview } = useReviews()
  const { settings: appSettings } = useAppSettings()
  const viewport = useVisibleViewport()

  const myServices = useMemo(
    () => (user?.uid ? services.filter((service) => service.providerId === user.uid) : []),
    [services, user?.uid]
  )

  const myBookings = useMemo(() => {
    if (!user?.uid) return []
    return bookings.filter((booking) =>
      role === "provider" ? booking.providerId === user.uid : booking.clientId === user.uid
    )
  }, [bookings, role, user?.uid])

  const upcoming = useMemo(() => {
    const now = Date.now()
    return myBookings
      .map((booking) => ({ booking, when: parseBookingWhen(booking) }))
      .filter((item) => item.when && item.when.getTime() >= now - 30 * 60 * 1000)
      .filter((item) => item.booking.status === "pending" || item.booking.status === "confirmed")
      .sort((left, right) => left.when!.getTime() - right.when!.getTime())
  }, [myBookings])

  const pending = useMemo(
    () => myBookings.filter((booking) => booking.status === "pending"),
    [myBookings]
  )

  const favoriteServices = useMemo(
    () => services.filter((service) => favoriteServiceIds.includes(service.id)),
    [services, favoriteServiceIds]
  )

  const publicServices = useMemo(
    () => services.filter((service) => isServiceActive(service) && service.providerId !== user?.uid),
    [services, user?.uid]
  )

  const botContext = useMemo(
    () => ({
      role,
      loggedIn: Boolean(user),
      name: user?.displayName || "",
      email: user?.email || "",
      hour: new Date().getHours(),
      pendingCount: pending.length,
      unreadChats: totalUnread,
      upcoming: upcoming.slice(0, 6).map(({ booking, when }) => ({
        id: booking.id,
        service: booking.serviceName,
        when: when ? formatWhen(when) : "",
        status: booking.status,
        with: role === "provider" ? booking.clientName : booking.providerName,
        partnerId: role === "provider" ? booking.clientId : booking.providerId,
        partnerName: role === "provider" ? booking.clientName : booking.providerName,
      })),
      pending: pending.slice(0, 6).map((booking) => ({
        id: booking.id,
        service: booking.serviceName,
        date: booking.date,
        time: booking.time,
        with: role === "provider" ? booking.clientName : booking.providerName,
        partnerId: role === "provider" ? booking.clientId : booking.providerId,
        partnerName: role === "provider" ? booking.clientName : booking.providerName,
      })),
      chats: chats.slice(0, 8).map((chat) => ({
        partnerId: chat.partnerId,
        partnerName: chat.partnerName,
        unread: chat.unreadCount,
      })),
      unpaid: myBookings.filter(isUnpaidBooking).slice(0, 6).map((booking) => ({
        id: booking.id,
        service: booking.serviceName,
        with: role === "provider" ? booking.clientName : booking.providerName,
        price: booking.price,
        paymentRequested: Boolean(booking.paymentRequested),
      })),
      reviewable: myBookings
        .filter((booking) => role === "client" && canReviewBooking(booking))
        .slice(0, 6)
        .map((booking) => ({
          id: booking.id,
          serviceId: booking.serviceId,
          service: booking.serviceName,
          date: booking.date,
          time: booking.time,
        })),
      todayBrief: {
        date: todayIso(),
        turnsToday: myBookings.filter(
          (booking) => booking.date === todayIso() && booking.status !== "cancelled"
        ).length,
        unreadChats: totalUnread,
        unpaidCount: myBookings.filter(isUnpaidBooking).length,
        listingGaps: listingGaps(myServices[0]),
      },
      myServices: myServices.slice(0, 10).map((service) => ({
        name: service.name,
        category: service.category || "",
        city: service.city || "",
        listingGaps: listingGaps(service),
      })),
      listingGaps: listingGaps(myServices[0]),
      userCity,
      reminderMinutes,
      categories: Array.from(new Set(services.map((service) => String(service.category || "")).filter(Boolean))).slice(0, 25),
      lastIncoming: chats
        .filter((chat) => chat.unreadCount > 0 || chat.lastMessage)
        .slice(0, 6)
        .map((chat) => ({
          partnerId: chat.partnerId,
          partnerName: chat.partnerName,
          lastMessage: String(chat.lastMessage || "").slice(0, 180),
          unread: chat.unreadCount,
        })),
      bookable: services
        .filter((service) => isServiceActive(service) && service.providerId !== user?.uid)
        .slice(0, 8)
        .map((service) => ({
          id: service.id,
          name: service.name,
          city: service.city || "",
          category: service.category || "",
          price: service.price,
        })),
      favorites: favoriteServices.slice(0, 10).map((service) => ({
        id: service.id,
        name: service.name,
        city: service.city || "",
        category: service.category || "",
      })),
    }),
    [role, user, pending, totalUnread, upcoming, myBookings, myServices, favoriteServices, chats, userCity, reminderMinutes, services]
  )

  useEffect(() => {
    if (!user?.uid) {
      setUserCity("")
      setReminderMinutes(60)
      return
    }
    return onSnapshot(doc(db, "users", user.uid), (snapshot) => {
      const data = snapshot.data() || {}
      setUserCity(String(data.city || ""))
      const minutes = Number(data.bookingReminderMinutes)
      setReminderMinutes([30, 60, 120, 1440].includes(minutes) ? minutes : 60)
    })
  }, [user?.uid])

  useEffect(() => {
    if (!registerBotBackHandler) return
    registerBotBackHandler(() => {
      if (!isOpen) return false
      if (panel) {
        setPanel(null)
        return true
      }
      setIsOpen(false)
      return true
    })
    return () => registerBotBackHandler(null)
  }, [registerBotBackHandler, isOpen, panel])

  useEffect(() => {
    const checkMap = () => {
      setIsMapOpen(!!document.querySelector(".nearby-map-container"))
    }
    const observer = new MutationObserver(checkMap)
    observer.observe(document.body, { childList: true, subtree: true })
    checkMap()
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  useEffect(() => {
    if (!isOpen) return
    const previousBody = document.body.style.overflow
    const previousHtml = document.documentElement.style.overflow
    document.body.style.overflow = "hidden"
    document.documentElement.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousBody
      document.documentElement.style.overflow = previousHtml
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || messages.length > 0) return
    const firstName = user?.displayName?.split(" ")[0]
    setMessages([
      {
        role: "bot",
        content: user
          ? `Hola${firstName ? ` ${firstName}` : ""}. Soy Punto, tu asistente con ChatGPT. Preguntame lo que quieras de la app.`
          : "Hola. Soy Punto. Iniciá sesión para chatear conmigo y manejamos tu agenda, búsquedas y anuncios.",
      },
    ])
  }, [isOpen, user, messages.length])

  const resolveBooking = (bookingId?: string) => {
    if (bookingId) {
      const found = myBookings.find((booking) => booking.id === bookingId)
      if (found) return found
    }
    if (pending.length === 1) return pending[0]
    if (upcoming.length === 1) return upcoming[0].booking
    return null
  }

  const resolvePartner = (partnerId?: string, partnerName?: string) => {
    if (partnerId) {
      const fromChat = chats.find((chat) => chat.partnerId === partnerId)
      if (fromChat) return { partnerId: fromChat.partnerId, partnerName: fromChat.partnerName }
      const fromBooking = myBookings.find(
        (booking) => booking.providerId === partnerId || booking.clientId === partnerId
      )
      if (fromBooking) {
        return {
          partnerId,
          partnerName:
            partnerName ||
            (fromBooking.providerId === partnerId ? fromBooking.providerName : fromBooking.clientName) ||
            "Chat",
        }
      }
    }
    if (chats.length === 1) return { partnerId: chats[0].partnerId, partnerName: chats[0].partnerName }
    return null
  }

  const runAction = async (
    payload: PuntoBotButton | {
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
  ) => {
    const action = payload.action
    if (!action || action === "none") return

    if (action === "search") {
      queueBotHomeAction({ type: "search", term: payload.searchTerm || "", city: payload.city })
      setFlow("home")
      window.setTimeout(() => setIsOpen(false), 400)
      return
    }
    if (action === "nearby") {
      queueBotHomeAction({ type: "nearby" })
      setFlow("home")
      window.setTimeout(() => setIsOpen(false), 400)
      return
    }
    if (action === "map") {
      queueBotHomeAction({ type: "map" })
      setFlow("home")
      window.setTimeout(() => setIsOpen(false), 400)
      return
    }
    if (action === "open_chat") {
      const partner = resolvePartner(payload.partnerId, payload.partnerName)
      if (!partner) {
        setFlow("chats")
        window.setTimeout(() => setIsOpen(false), 400)
        return
      }
      setActiveChat?.({ partnerId: partner.partnerId, partnerName: partner.partnerName, from: "inbox" })
      setFlow("chat")
      window.setTimeout(() => setIsOpen(false), 400)
      return
    }
    if (action === "confirm_booking") {
      const booking = resolveBooking(payload.bookingId)
      if (!booking) {
        setMessages((prev) => [...prev, { role: "bot", content: "No identifiqué el turno. Abrí la agenda y confirmalo ahí." }])
        return
      }
      const result = await updateBooking(booking.id, { status: "confirmed" })
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: result.success
            ? `Listo, confirmé el turno de ${booking.serviceName}.`
            : result.error || "No pude confirmar el turno.",
        },
      ])
      return
    }
    if (action === "cancel_booking") {
      const booking = resolveBooking(payload.bookingId)
      if (!booking) {
        setMessages((prev) => [...prev, { role: "bot", content: "No identifiqué el turno. Abrí la agenda y cancelalo ahí." }])
        return
      }
      const result = await cancelBooking(booking.id)
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: result.success
            ? `Cancelé el turno de ${booking.serviceName}.`
            : result.error || "No pude cancelar el turno.",
        },
      ])
      return
    }
    if (action === "reschedule_booking") {
      const booking = resolveBooking(payload.bookingId)
      const date = normalizeDate(payload.date)
      const time = normalizeTime(payload.time)
      if (!booking) {
        setMessages((prev) => [...prev, { role: "bot", content: "No identifiqué el turno. Abrí la agenda y cambialo ahí." }])
        return
      }
      if (!date || !time) {
        setMessages((prev) => [...prev, { role: "bot", content: "Decime la fecha (AAAA-MM-DD) y la hora (HH:mm) para reprogramarlo." }])
        return
      }
      const result = await updateBooking(booking.id, { date, time })
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: result.success
            ? `Listo, el turno de ${booking.serviceName} quedó el ${date} a las ${time}.`
            : result.error || "No pude reprogramar el turno.",
        },
      ])
      return
    }
    if (action === "request_payment") {
      if (role !== "provider") {
        setMessages((prev) => [...prev, { role: "bot", content: "El pedido de pago lo hace el proveedor desde la agenda." }])
        return
      }
      const unpaid = myBookings.filter(isUnpaidBooking)
      const booking =
        (payload.bookingId && unpaid.find((item) => item.id === payload.bookingId)) ||
        (unpaid.length === 1 ? unpaid[0] : null)
      if (!booking) {
        setMessages((prev) => [...prev, { role: "bot", content: "No identifiqué un turno sin pagar. Abrí la agenda y pedí el pago ahí." }])
        return
      }
      const result = await updateBooking(booking.id, {
        paymentRequested: true,
        paymentRequestedAt: new Date(),
      })
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: result.success
            ? `Le pedí el pago a ${booking.clientName} por ${booking.serviceName}.`
            : result.error || "No pude pedir el pago.",
        },
      ])
      return
    }
    if (action === "toggle_favorite") {
      const service =
        services.find((item) => item.id === payload.serviceId) ||
        favoriteServices.find((item) => item.id === payload.serviceId)
      if (!service?.id) {
        setMessages((prev) => [...prev, { role: "bot", content: "No identifiqué el anuncio. Abrí el detalle y guardalo desde ahí." }])
        return
      }
      const wasFavorite = favoriteServiceIds.includes(service.id)
      const result = await toggleFavorite(service.id)
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: result.success
            ? wasFavorite
              ? `Saqué ${service.name} de favoritos.`
              : `Guardé ${service.name} en favoritos.`
            : result.error || "No pude actualizar favoritos.",
        },
      ])
      return
    }
    if (action === "open_service") {
      const service = services.find((item) => item.id === payload.serviceId)
      if (!service) {
        setMessages((prev) => [...prev, { role: "bot", content: "No identifiqué ese anuncio. Buscalo en Inicio." }])
        return
      }
      setSelectedService?.(service)
      setFlow("service-detail")
      window.setTimeout(() => setIsOpen(false), 400)
      return
    }
    if (action === "pay_booking") {
      if (role !== "client") {
        setMessages((prev) => [...prev, { role: "bot", content: "El pago lo hace el cliente. Vos podés pedir el cobro o marcarlo como pagado." }])
        return
      }
      const unpaid = myBookings.filter(isUnpaidBooking)
      const booking =
        (payload.bookingId && unpaid.find((item) => item.id === payload.bookingId)) ||
        (unpaid.length === 1 ? unpaid[0] : null)
      if (!booking) {
        setMessages((prev) => [...prev, { role: "bot", content: "No identifiqué un turno para pagar. Abrí la agenda." }])
        return
      }
      try {
        const checkout = await createMercadoPagoCheckout(booking.id)
        if (checkout.alreadyPaid) {
          setMessages((prev) => [...prev, { role: "bot", content: `Ese turno de ${booking.serviceName} ya figura como pagado.` }])
          return
        }
        if (!checkout.initPoint) {
          setFlow("agenda")
          window.setTimeout(() => setIsOpen(false), 400)
          setMessages((prev) => [...prev, { role: "bot", content: "No pude abrir Mercado Pago. Completá el pago desde la agenda." }])
          return
        }
        await openMercadoPagoUrl(checkout.initPoint)
        setMessages((prev) => [...prev, { role: "bot", content: `Abrí el pago de ${booking.serviceName} en Mercado Pago.` }])
      } catch (error) {
        setFlow("agenda")
        window.setTimeout(() => setIsOpen(false), 400)
        setMessages((prev) => [...prev, { role: "bot", content: callableErrorMessage(error) }])
      }
      return
    }
    if (action === "leave_review") {
      const booking =
        (payload.bookingId && myBookings.find((item) => item.id === payload.bookingId && canReviewBooking(item))) ||
        myBookings.filter(canReviewBooking)[0] ||
        null
      if (!booking) {
        setMessages((prev) => [...prev, { role: "bot", content: "No hay un turno para reseñar. Tiene que estar hecho o marcado como completado." }])
        return
      }
      setReviewBookingId(booking.id)
      setReviewRating(5)
      setReviewComment("")
      setPanel("review")
      return
    }
    if (action === "mark_paid") {
      if (role !== "provider") {
        setMessages((prev) => [...prev, { role: "bot", content: "Marcar cobrado es para el proveedor. Si querés pagar, pedime pagar el turno." }])
        return
      }
      const unpaid = myBookings.filter(isUnpaidBooking)
      const booking =
        (payload.bookingId && unpaid.find((item) => item.id === payload.bookingId)) ||
        (unpaid.length === 1 ? unpaid[0] : null)
      if (!booking) {
        setMessages((prev) => [...prev, { role: "bot", content: "No identifiqué un turno sin cobrar." }])
        return
      }
      const result = await updateBooking(booking.id, { paymentStatus: "paid" })
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: result.success
            ? `Marqué como cobrado el turno de ${booking.clientName} (${booking.serviceName}).`
            : result.error || "No pude marcar el cobro.",
        },
      ])
      return
    }
    if (action === "complete_booking") {
      if (role !== "provider") {
        setMessages((prev) => [...prev, { role: "bot", content: "Finalizar el turno lo hace el proveedor desde la agenda." }])
        return
      }
      const booking = resolveBooking(payload.bookingId)
      if (!booking || booking.status === "cancelled") {
        setMessages((prev) => [...prev, { role: "bot", content: "No identifiqué el turno para finalizar." }])
        return
      }
      const result = await updateBooking(booking.id, { status: "completed" })
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: result.success
            ? `Marqué como completado el turno de ${booking.serviceName}.`
            : result.error || "No pude finalizar el turno.",
        },
      ])
      return
    }
    if (action === "day_summary") {
      return
    }
    if (action === "complete_listing") {
      if (role !== "provider") {
        setFlow("mi-servicio")
        window.setTimeout(() => setIsOpen(false), 400)
        return
      }
      const service = myServices[0]
      if (!service) {
        setFlow("create-service")
        window.setTimeout(() => setIsOpen(false), 400)
        return
      }
      setSelectedProviderService?.(service)
      setFlow("edit-service")
      window.setTimeout(() => setIsOpen(false), 400)
      return
    }

    setFlow(action)
    window.setTimeout(() => setIsOpen(false), 400)
  }

  const sendQuotes = async () => {
    if (!user) return
    setPanelBusy(true)
    const selected = publicServices.filter((service) => quote.selectedIds.includes(service.id))
    let sent = 0
    for (const service of selected) {
      const result = await sendChatMessage({
        sender: user,
        partnerId: service.providerId,
        partnerName: service.providerName || "Proveedor",
        text: quote.message,
        imageUrls: quote.photoUrls,
      })
      if (result.success) sent += 1
    }
    setPanelBusy(false)
    setPanel(null)
    setMessages((prev) => [
      ...prev,
      {
        role: "bot",
        content: sent
          ? `Envié la consulta a ${sent} proveedor${sent === 1 ? "" : "es"} por chat.`
          : "No pude enviar las consultas. Probá de nuevo.",
      },
    ])
  }

  const confirmBotBooking = async () => {
    const service = publicServices.find((item) => item.id === bookServiceId) || services.find((item) => item.id === bookServiceId)
    if (!user || !service || !bookDate || !bookTime) return
    setPanelBusy(true)
    const result = await createBooking({
      serviceId: service.id,
      serviceName: service.name,
      clientId: user.uid,
      clientName: user.displayName || user.email || "Cliente",
      clientEmail: user.email || "",
      providerId: service.providerId,
      providerName: service.providerName || "Proveedor",
      date: bookDate,
      time: bookTime,
      price: parseMoney(service.price) ?? 0,
      status: appSettings.autoAcceptBookings ? "confirmed" : "pending",
      paymentMethod: "later",
      paymentStatus: "pending",
      source: "buscador",
    })
    setPanelBusy(false)
    setPanel(null)
    setMessages((prev) => [
      ...prev,
      {
        role: "bot",
        content: result.success
          ? `Reservé ${service.name} el ${bookDate} a las ${bookTime}. El proveedor lo ve en la agenda.`
          : result.error || "No pude crear la reserva.",
      },
    ])
  }

  const saveListingDraft = async () => {
    const service = myServices[0]
    if (!service?.id || !listingDraft.trim()) return
    setPanelBusy(true)
    try {
      await updateServiceFields(service.id, { description: listingDraft.trim() })
      setPanel(null)
      setMessages((prev) => [...prev, { role: "bot", content: "Guardé la descripción. Completá fotos, dirección y teléfono en el editor si faltan." }])
    } catch {
      setMessages((prev) => [...prev, { role: "bot", content: "No pude guardar el anuncio." }])
    } finally {
      setPanelBusy(false)
    }
  }

  const saveReminderPref = async (minutes: number) => {
    if (!user?.uid) return
    setPanelBusy(true)
    try {
      await updateDoc(doc(db, "users", user.uid), { bookingReminderMinutes: minutes, updatedAt: new Date() })
      setReminderMinutes(minutes)
      setPanel(null)
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: `Listo. Te voy a recordar los turnos ${minutes === 1440 ? "un día" : minutes === 60 ? "1 hora" : minutes === 120 ? "2 horas" : "30 minutos"} antes.` },
      ])
    } catch {
      setMessages((prev) => [...prev, { role: "bot", content: "No pude guardar el recordatorio." }])
    } finally {
      setPanelBusy(false)
    }
  }

  const sendDraftReply = async () => {
    if (!user || !draftPartner || !draftReply.trim()) return
    setPanelBusy(true)
    const result = await sendChatMessage({
      sender: user,
      partnerId: draftPartner.partnerId,
      partnerName: draftPartner.partnerName,
      text: draftReply.trim(),
    })
    setPanelBusy(false)
    setPanel(null)
    setMessages((prev) => [
      ...prev,
      { role: "bot", content: result.success ? `Envié la respuesta a ${draftPartner.partnerName}.` : result.error || "No pude enviar el mensaje." },
    ])
  }

  const publishReview = async () => {
    const booking = myBookings.find((item) => item.id === reviewBookingId)
    if (!user || !booking || !reviewComment.trim()) return
    setPanelBusy(true)
    const result = await addReview(
      {
        serviceId: booking.serviceId,
        clientId: user.uid,
        clientName: user.displayName || user.email || "Cliente",
        rating: reviewRating,
        comment: reviewComment.trim(),
      },
      booking.id
    )
    setPanelBusy(false)
    setPanel(null)
    setMessages((prev) => [
      ...prev,
      {
        role: "bot",
        content: result.success
          ? `Publicé tu reseña de ${booking.serviceName}.`
          : result.error || "No pude publicar la reseña.",
      },
    ])
  }

  const sendToGpt = async (question: string) => {
    const trimmed = question.trim()
    if (!trimmed || isTyping) return

    const history = messages
      .filter((item) => item.content)
      .slice(-12)
      .map((item) => ({
        role: (item.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: item.content,
      }))

    setMessages((prev) => [...prev, { role: "user", content: trimmed }])
    setDraft("")
    setIsTyping(true)

    if (!user) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Iniciá sesión y te ayudo con ChatGPT en toda la app.", buttons: [{ label: "Ir a login", action: "login" }] },
      ])
      setIsTyping(false)
      return
    }

    try {
      const result = await askPuntoBotChat({
        message: trimmed,
        history,
        context: botContext,
      })
      const needsConfirm =
        result.action === "confirm_booking" ||
        result.action === "cancel_booking" ||
        result.action === "reschedule_booking" ||
        result.action === "request_payment" ||
        result.action === "toggle_favorite" ||
        result.action === "pay_booking" ||
        result.action === "mark_paid" ||
        result.action === "complete_booking"
      const booking = needsConfirm ? resolveBooking(result.bookingId) : null
      const extraButtons: PuntoBotButton[] = []
      if (result.action === "confirm_booking") {
        extraButtons.push({
          label: booking ? `Sí, confirmar ${booking.serviceName}` : "Sí, confirmar",
          action: "confirm_booking",
          bookingId: booking?.id || result.bookingId,
        })
      }
      if (result.action === "cancel_booking") {
        extraButtons.push({
          label: booking ? `Sí, cancelar ${booking.serviceName}` : "Sí, cancelar",
          action: "cancel_booking",
          bookingId: booking?.id || result.bookingId,
        })
      }
      if (result.action === "reschedule_booking") {
        extraButtons.push({
          label: booking ? `Sí, cambiar ${booking.serviceName}` : "Sí, reprogramar",
          action: "reschedule_booking",
          bookingId: booking?.id || result.bookingId,
          date: result.date,
          time: result.time,
        })
      }
      if (result.action === "request_payment") {
        const unpaid = myBookings.filter(isUnpaidBooking)
        const unpaidBooking =
          unpaid.find((item) => item.id === result.bookingId) || (unpaid.length === 1 ? unpaid[0] : null)
        extraButtons.push({
          label: unpaidBooking ? `Sí, pedir pago a ${unpaidBooking.clientName}` : "Sí, pedir pago",
          action: "request_payment",
          bookingId: unpaidBooking?.id || result.bookingId,
        })
      }
      if (result.action === "toggle_favorite") {
        const service = services.find((item) => item.id === result.serviceId)
        const saved = service ? favoriteServiceIds.includes(service.id) : false
        extraButtons.push({
          label: service ? (saved ? `Sí, sacar ${service.name}` : `Sí, guardar ${service.name}`) : "Sí, actualizar favorito",
          action: "toggle_favorite",
          serviceId: service?.id || result.serviceId,
        })
      }
      if (result.action === "pay_booking") {
        const unpaid = myBookings.filter(isUnpaidBooking)
        const unpaidBooking =
          unpaid.find((item) => item.id === result.bookingId) || (unpaid.length === 1 ? unpaid[0] : null)
        extraButtons.push({
          label: unpaidBooking ? `Sí, pagar ${unpaidBooking.serviceName}` : "Sí, pagar",
          action: "pay_booking",
          bookingId: unpaidBooking?.id || result.bookingId,
        })
      }
      if (result.action === "mark_paid") {
        const unpaid = myBookings.filter(isUnpaidBooking)
        const unpaidBooking =
          unpaid.find((item) => item.id === result.bookingId) || (unpaid.length === 1 ? unpaid[0] : null)
        extraButtons.push({
          label: unpaidBooking ? `Sí, marcar cobrado ${unpaidBooking.serviceName}` : "Sí, marcar cobrado",
          action: "mark_paid",
          bookingId: unpaidBooking?.id || result.bookingId,
        })
      }
      if (result.action === "complete_booking") {
        extraButtons.push({
          label: booking ? `Sí, finalizar ${booking.serviceName}` : "Sí, finalizar turno",
          action: "complete_booking",
          bookingId: booking?.id || result.bookingId,
        })
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: result.reply,
          buttons: [...(result.buttons || []), ...extraButtons],
        },
      ])
      const panelActions = [
        "start_quote",
        "compare_services",
        "start_booking",
        "start_listing_help",
        "set_reminders",
        "draft_reply",
        "leave_review",
        "day_summary",
      ]
      if (result.action === "start_quote") {
        const next: QuoteDraft = {
          work: result.quoteWork || result.searchTerm,
          where: result.quoteWhere || result.city || userCity,
          when: result.quoteWhen,
          photoUrls: [],
          selectedIds: [],
          message: "",
        }
        next.message = defaultQuoteMessage(next, user.displayName || "")
        setQuote(next)
        setPanel("quote")
      } else if (result.action === "compare_services") {
        setCompareTerm(result.searchTerm || result.quoteWork)
        setCompareCity(result.city || result.quoteWhere || userCity)
        setPanel("compare")
      } else if (result.action === "start_booking") {
        setBookServiceId(result.serviceId)
        setBookDate(normalizeDate(result.date))
        setBookTime(normalizeTime(result.time))
        setPanel("book")
      } else if (result.action === "start_listing_help") {
        setListingDraft(result.listingDescription || myServices[0]?.description || "")
        setPanel("listing")
      } else if (result.action === "set_reminders") {
        if (result.reminderMinutes) setReminderMinutes(result.reminderMinutes)
        setPanel("reminder")
      } else if (result.action === "draft_reply") {
        const partner = resolvePartner(result.partnerId, result.partnerName)
        setDraftPartner(partner)
        setDraftReply(result.draftReply)
        setPanel("draft")
      } else if (result.action === "leave_review") {
        const reviewBooking =
          myBookings.find((item) => item.id === result.bookingId && canReviewBooking(item)) ||
          myBookings.find(canReviewBooking) ||
          null
        if (reviewBooking) {
          setReviewBookingId(reviewBooking.id)
          setReviewRating(result.reviewRating || 5)
          setReviewComment(result.reviewComment || "")
          setPanel("review")
        }
      }
      if (result.action && result.action !== "none" && !needsConfirm && !panelActions.includes(result.action)) {
        window.setTimeout(() => {
          void runAction(result)
        }, 650)
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", content: puntoBotErrorMessage(error) }])
    } finally {
      setIsTyping(false)
    }
  }

  const resetChat = () => {
    setMessages([])
    setDraft("")
    setPanel(null)
  }

  const chips: { text: string; uiIcon: UiIconName; q: string }[] =
    role === "provider"
      ? [
          { text: "Resumen del día", uiIcon: "agenda", q: "Dame el resumen de hoy: turnos, chats sin leer, impagos y qué le falta al anuncio." },
          { text: "Responder chat", uiIcon: "chat", q: "Armame una respuesta para el último chat sin leer. Quiero revisarla antes de enviar." },
          { text: "Marcar cobrado", uiIcon: "agenda", q: "Quiero marcar como cobrado un turno impago. Pedime confirmación." },
          { text: "Finalizar turno", uiIcon: "agenda", q: "Quiero marcar un turno como completado. Pedime confirmación." },
        ]
      : [
          { text: "Buscar oficio", uiIcon: "inicio", q: "Me pierde agua una canilla. Buscá plomeros en mi ciudad." },
          { text: "Favoritos", uiIcon: "inicio", q: "Mostrame mis favoritos. Quiero guardar, sacar o abrir uno." },
          { text: "Pagar turno", uiIcon: "agenda", q: "Quiero pagar un turno pendiente o que me pidieron pago." },
          { text: "Dejar reseña", uiIcon: "chat", q: "Quiero dejar una reseña de un turno ya hecho." },
        ]

  const onSubmitDraft = (event: FormEvent) => {
    event.preventDefault()
    void sendToGpt(draft)
  }

  const onAuthScreen = ["login", "register", "onboarding"].includes(String(currentFlow || ""))
  if (isMapOpen || onAuthScreen) return null

  const chatWindow = (
    <Card className="w-full h-full shadow-[0_24px_60px_-20px_rgba(15,90,90,0.45)] border border-white/60 bg-white flex flex-col overflow-hidden rounded-[1.85rem]">
      <div className="bg-primary p-4 text-white relative overflow-hidden shrink-0">
        <div className="absolute -right-8 -top-10 w-36 h-36 rounded-full bg-white/10" />
        <div className="absolute right-10 -bottom-12 w-24 h-24 rounded-full bg-[oklch(0.65_0.18_45)]/30" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/15 rounded-[1.15rem] flex items-center justify-center border border-white/25 shadow-inner">
              <PuntoBotIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-[17px] leading-none tracking-tight">Punto</h3>
                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-white/15 border border-white/20 rounded-full px-1.5 py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  En línea
                </span>
              </div>
              <p className="text-[11px] text-white/75 mt-1.5 font-medium">
                {role === "provider" ? "Asistente para tu negocio" : "Te ayudo a resolver lo que necesitás"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" onClick={resetChat} className="hover:bg-white/10 text-white rounded-xl h-9 w-9" aria-label="Nueva conversación">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-white/10 text-white rounded-xl h-9 w-9" aria-label="Cerrar">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto space-y-3"
        style={{ backgroundColor: "oklch(0.98 0.01 200)" }}
      >
        {messages.map((msg, i) => (
          <div key={`${msg.role}-${i}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "bot" && (
              <div className="w-8 h-8 rounded-2xl bg-primary flex items-center justify-center mr-2 mt-0.5 shrink-0 shadow-sm">
                <PuntoBotIcon className="h-5 w-5 text-white" />
              </div>
            )}
            <div
              className={`max-w-[82%] px-3.5 py-3 text-[13px] leading-relaxed space-y-2 ${
                msg.role === "user"
                  ? "bg-primary text-white rounded-[1.25rem] rounded-br-md shadow-md shadow-primary/20 font-medium"
                  : "bg-white text-gray-700 rounded-[1.25rem] rounded-bl-md border border-black/[0.04] shadow-sm font-medium"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.role === "bot" && msg.buttons && msg.buttons.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-0.5">
                  {msg.buttons.map((button) => (
                    <Button
                      key={button.label}
                      size="sm"
                      className="h-8 text-[11px] justify-start rounded-xl bg-[oklch(0.98_0.01_200)] hover:bg-primary hover:text-white text-primary border-0 font-bold"
                      onClick={() => void runAction(button)}
                    >
                      {button.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-2xl bg-primary flex items-center justify-center mr-2 shrink-0">
              <PuntoBotIcon className="h-5 w-5 text-white" />
            </div>
            <div className="bg-white border border-black/[0.04] px-3.5 py-3 rounded-[1.25rem] rounded-bl-md shadow-sm flex gap-1 items-center">
              <div className="w-1.5 h-1.5 bg-primary/35 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>

      <div className="px-3 pt-3 pb-3 bg-white border-t border-gray-100 space-y-2.5 shrink-0">
        {panel === "quote" && (
          <BotSheet title="Presupuesto" subtitle="Revisá el mensaje y a quién se lo mandamos" onClose={() => setPanel(null)}>
            <QuotePanel services={publicServices} userId={user?.uid} draft={quote} onChange={setQuote} onSend={() => void sendQuotes()} busy={panelBusy} />
          </BotSheet>
        )}
        {panel === "compare" && (
          <BotSheet title="Comparar" subtitle={compareTerm || "Mismos oficios, datos reales"} onClose={() => setPanel(null)}>
            <ComparePanel services={publicServices} term={compareTerm} city={compareCity} />
          </BotSheet>
        )}
        {panel === "book" && (
          <BotSheet title="Reservar" subtitle="Solo horarios que todavía están libres" onClose={() => setPanel(null)}>
            <BookPanel
              services={
                findRelatedServices(publicServices, compareTerm || quote.work, compareCity || userCity, 20).length
                  ? findRelatedServices(publicServices, compareTerm || quote.work, compareCity || userCity, 20)
                  : publicServices.slice(0, 20)
              }
              bookings={bookings}
              serviceId={bookServiceId}
              date={bookDate}
              time={bookTime}
              onService={setBookServiceId}
              onDate={(value) => {
                setBookDate(value)
                setBookTime("")
              }}
              onTime={setBookTime}
              onConfirm={() => void confirmBotBooking()}
              onAskProvider={() => {
                const service = publicServices.find((item) => item.id === bookServiceId)
                if (!service) return
                const next: QuoteDraft = {
                  work: service.name,
                  where: service.city || userCity,
                  when: bookDate || "a convenir",
                  photoUrls: [],
                  selectedIds: [service.id],
                  message: "",
                }
                next.message = defaultQuoteMessage(next, user?.displayName || "")
                setQuote(next)
                setPanel("quote")
              }}
              busy={panelBusy}
            />
          </BotSheet>
        )}
        {panel === "listing" && (
          <BotSheet title="Tu anuncio" subtitle="Confirmá antes de guardar" onClose={() => setPanel(null)}>
            <ListingPanel
              service={myServices[0]}
              draft={listingDraft}
              onDraft={setListingDraft}
              onSave={() => void saveListingDraft()}
              onOpenEditor={() => {
                if (myServices[0]) {
                  setSelectedProviderService?.(myServices[0])
                  setFlow("edit-service")
                } else {
                  setFlow("create-service")
                }
                setPanel(null)
                window.setTimeout(() => setIsOpen(false), 400)
              }}
              busy={panelBusy}
            />
          </BotSheet>
        )}
        {panel === "reminder" && (
          <BotSheet title="Recordatorios" onClose={() => setPanel(null)}>
            <ReminderPanel minutes={reminderMinutes} onSave={(value) => void saveReminderPref(value)} busy={panelBusy} />
          </BotSheet>
        )}
        {panel === "draft" && (
          <BotSheet title="Respuesta" subtitle={draftPartner?.partnerName || "Revisá el texto"} onClose={() => setPanel(null)}>
            <DraftReplyPanel text={draftReply} onChange={setDraftReply} onSend={() => void sendDraftReply()} busy={panelBusy} />
          </BotSheet>
        )}
        {panel === "review" && (
          <BotSheet title="Reseña" subtitle="Confirmá antes de publicar" onClose={() => setPanel(null)}>
            <ReviewPanel
              serviceName={myBookings.find((item) => item.id === reviewBookingId)?.serviceName || "Tu turno"}
              rating={reviewRating}
              comment={reviewComment}
              onRating={setReviewRating}
              onComment={setReviewComment}
              onSave={() => void publishReview()}
              busy={panelBusy}
            />
          </BotSheet>
        )}
        {!panel && (
        <div className="grid grid-cols-2 gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip.text}
              disabled={isTyping}
              onClick={() => void sendToGpt(chip.q)}
              className="flex items-center gap-2 p-2.5 text-[11px] font-bold text-gray-700 bg-[oklch(0.98_0.01_200)] hover:bg-primary/10 hover:text-primary rounded-2xl border border-black/[0.04] text-left disabled:opacity-50 transition-colors"
            >
              <span className="h-7 w-7 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                <AppIcon name={chip.uiIcon} className="h-4 w-4" />
              </span>
              <span className="truncate">{chip.text}</span>
            </button>
          ))}
        </div>
        )}
        <form onSubmit={onSubmitDraft} className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/40" />
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onFocus={(event) => {
                event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" })
              }}
              placeholder="Escribile a Punto..."
              enterKeyHint="send"
              className="h-11 rounded-2xl text-sm pl-9 bg-[oklch(0.98_0.01_200)] border-transparent focus-visible:border-primary/30"
              disabled={isTyping}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            className="h-11 w-11 rounded-2xl shrink-0 bg-[oklch(0.65_0.18_45)] hover:bg-[oklch(0.6_0.18_45)] text-white shadow-lg shadow-orange-500/20"
            disabled={isTyping || !draft.trim()}
            aria-label="Enviar"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  )

  if (isOpen) {
    return (
      <div
        className="fixed inset-0 z-[500] flex flex-col p-2"
        style={
          viewport.keyboardInset > 0
            ? { paddingBottom: viewport.keyboardInset + 8 }
            : undefined
        }
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/45"
          aria-label="Cerrar Punto"
          onClick={() => setIsOpen(false)}
        />
        <div className="relative z-10 flex min-h-0 w-full flex-1 sm:ml-auto sm:max-w-[400px]">
          {chatWindow}
        </div>
      </div>
    )
  }

  return (
    <DraggableAnchor
      id="puntobot"
      defaultLeft={(vw) => vw - 84}
      defaultBottom={120}
      zIndex={500}
      onPress={() => setIsOpen(true)}
      restoreLabel="Punto"
      restoreIcon={<PuntoBotIcon className="h-4 w-4 text-primary" />}
    >
      <div
        className={`w-[4.25rem] h-[4.25rem] rounded-[1.45rem] shadow-[0_16px_32px_-12px_rgba(15,90,90,0.65)] flex items-center justify-center transition-all duration-300 relative ${
          isOpen ? "bg-gray-900 rotate-90 scale-90" : "bg-primary"
        }`}
        aria-label={isOpen ? "Cerrar Punto" : "Abrir Punto"}
      >
        {!isOpen && (
          <span className="absolute inset-0 rounded-[1.45rem] ring-4 ring-[oklch(0.65_0.18_45)]/35 animate-pulse" />
        )}
        {isOpen ? (
          <X className="h-8 w-8 text-white" />
        ) : (
          <div className="relative">
            <PuntoBotIcon className="h-11 w-11 text-white" />
            {(totalUnread > 0 || pending.length > 0) && (
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-[oklch(0.65_0.18_45)] text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
                {totalUnread + pending.length > 9 ? "9+" : totalUnread + pending.length}
              </span>
            )}
          </div>
        )}
      </div>
    </DraggableAnchor>
  )
}
