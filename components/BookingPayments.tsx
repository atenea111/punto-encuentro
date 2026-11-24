"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MessageSquare,
  Send,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatMoney } from "@/lib/formatMoney"
import {
  isUnpaidBooking,
  paymentMethodLabel,
  paymentStatusLabel,
  unpaidSummary,
} from "@/lib/bookingPayments"

type BookingLike = {
  id: string
  clientId?: string
  clientName?: string
  serviceName?: string
  date?: string
  time?: string
  price?: number
  status?: string
  paymentStatus?: string
  paymentMethod?: string
  paymentRequested?: boolean
  paymentRequestedAt?: Date | string | null
}

type TabKey = "unpaid" | "requested" | "paid"

const PAGE_SIZE_COMPACT = 3
const PAGE_SIZE_FULL = 4

function formatBookingWhen(booking: BookingLike) {
  const date = booking.date
    ? new Date(`${booking.date}T12:00:00`).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
      })
    : "Sin fecha"
  return `${date} · ${booking.time || "Sin hora"}`
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between gap-2 pt-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 rounded-xl px-3"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only sm:ml-1">Anterior</span>
      </Button>
      <p className="text-xs font-semibold text-slate-500">
        {page} / {totalPages}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 rounded-xl px-3"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        <span className="sr-only sm:not-sr-only sm:mr-1">Siguiente</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function ProviderPaymentsPanel({
  bookings,
  updateBooking,
  onChat,
  compact = false,
}: {
  bookings: BookingLike[]
  updateBooking: (id: string, data: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>
  onChat?: (booking: BookingLike) => void
  compact?: boolean
}) {
  const pageSize = compact ? PAGE_SIZE_COMPACT : PAGE_SIZE_FULL
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [tab, setTab] = useState<TabKey>("unpaid")
  const [page, setPage] = useState(1)

  const { unpaid, count, totalLabel } = useMemo(() => unpaidSummary(bookings), [bookings])

  const requested = useMemo(
    () => unpaid.filter((booking) => Boolean(booking.paymentRequested)),
    [unpaid]
  )

  const paid = useMemo(
    () =>
      bookings
        .filter((booking) => booking.paymentStatus === "paid" && booking.status !== "cancelled")
        .sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))),
    [bookings]
  )

  const paidTotal = useMemo(
    () => paid.reduce((sum, booking) => sum + (Number(booking.price) || 0), 0),
    [paid]
  )

  const activeList = tab === "unpaid" ? unpaid : tab === "requested" ? requested : paid
  const totalPages = Math.max(1, Math.ceil(activeList.length / pageSize))
  const pageItems = activeList.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    setPage(1)
  }, [tab, count, requested.length, paid.length, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const run = async (id: string, action: () => Promise<{ success: boolean; error?: string }>) => {
    setLoadingId(id)
    try {
      const result = await action()
      if (!result.success) alert(result.error || "No se pudo actualizar el pago")
    } finally {
      setLoadingId(null)
    }
  }

  const requestPayment = (booking: BookingLike) =>
    run(booking.id, () =>
      updateBooking(booking.id, {
        paymentRequested: true,
        paymentRequestedAt: new Date(),
      })
    )

  const markPaid = (booking: BookingLike) =>
    run(booking.id, () => updateBooking(booking.id, { paymentStatus: "paid" }))

  const tabs: Array<{ key: TabKey; label: string; count: number }> = [
    { key: "unpaid", label: "Por cobrar", count: unpaid.length },
    { key: "requested", label: "Pedidos", count: requested.length },
    { key: "paid", label: "Cobrados", count: paid.length },
  ]

  return (
    <Card className="overflow-hidden border-0 shadow-[0_12px_40px_rgba(15,23,42,0.08)] bg-white">
      <div className="relative overflow-hidden bg-[linear-gradient(135deg,#0f3d4c_0%,#1a6b7a_48%,#c45c26_100%)] px-4 py-5 sm:px-5">
        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 left-8 h-28 w-28 rounded-full bg-orange-300/20 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90">
              <Wallet className="h-3.5 w-3.5" />
              Centro de cobros
            </div>
            <h3 className="text-2xl font-black tracking-tight text-white">Pagos</h3>
            <p className="mt-1 max-w-sm text-sm text-white/75">
              Seguimiento de citas sin cobrar, pedidos enviados y cobros confirmados.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-[220px]">
            <div className="rounded-2xl bg-white/95 px-3 py-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-700">Pendiente</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{count}</p>
              <p className="text-xs font-semibold text-orange-700">{totalLabel}</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-3 py-3 text-white ring-1 ring-white/20 backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Cobrado</p>
              <p className="mt-1 text-2xl font-black">{paid.length}</p>
              <p className="text-xs font-semibold text-white/85">{formatMoney(paidTotal)}</p>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="space-y-4 p-4 sm:p-5">
        {requested.length > 0 && (
          <div className="rounded-2xl border border-sky-100 bg-[linear-gradient(180deg,#f0f9ff_0%,#ffffff_100%)] p-3.5 sm:p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <Send className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">Apartado especial · Pedidos enviados</p>
                <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                  {requested.length} cliente{requested.length === 1 ? "" : "s"} ya recibieron el aviso de pago.
                  Esperá la acreditación o marcá cobrado si pagaron en efectivo/transferencia.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-3 h-9 rounded-xl border-sky-200 bg-white text-sky-800"
                  onClick={() => setTab("requested")}
                >
                  Ver pedidos
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((item) => {
            const active = tab === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`flex min-w-[30%] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-xs font-bold transition sm:text-sm ${
                  active
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {item.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                    active ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {item.count}
                </span>
              </button>
            )
          })}
        </div>

        {pageItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
              {tab === "paid" ? <CheckCircle2 className="h-6 w-6" /> : <Banknote className="h-6 w-6" />}
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {tab === "unpaid" && "No hay citas por cobrar"}
              {tab === "requested" && "Todavía no pediste ningún pago"}
              {tab === "paid" && "Todavía no hay cobros registrados"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {tab === "unpaid"
                ? "Cuando un cliente reserve sin pagar, aparece acá."
                : tab === "requested"
                  ? "Usá “Pedir pago” en una cita pendiente."
                  : "Los pagos confirmados se listan en esta pestaña."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pageItems.map((booking) => {
              const unpaidItem = isUnpaidBooking(booking)
              return (
                <div
                  key={booking.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:p-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        unpaidItem
                          ? booking.paymentRequested
                            ? "bg-sky-100 text-sky-700"
                            : "bg-orange-100 text-orange-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {unpaidItem ? (
                        booking.paymentRequested ? <Send className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900 sm:text-base">
                            {booking.clientName || "Cliente"}
                          </p>
                          <p className="truncate text-sm text-slate-500">{booking.serviceName}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-base font-black text-slate-900 sm:text-lg">
                            {formatMoney(booking.price)}
                          </p>
                          <span
                            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                              unpaidItem
                                ? "bg-orange-100 text-orange-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {paymentStatusLabel(booking.paymentStatus)}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {formatBookingWhen(booking)} · {paymentMethodLabel(booking.paymentMethod)}
                      </p>
                      {booking.paymentRequested && unpaidItem && (
                        <p className="mt-1 text-[11px] font-semibold text-sky-700">
                          Pedido de pago enviado al cliente
                        </p>
                      )}
                    </div>
                  </div>

                  {unpaidItem && (
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1.2fr_1fr_auto]">
                      <Button
                        size="sm"
                        className="h-10 rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
                        disabled={loadingId === booking.id}
                        onClick={() => void requestPayment(booking)}
                      >
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                        {booking.paymentRequested ? "Reenviar pedido" : "Pedir pago"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-10 rounded-xl border-slate-200 bg-white"
                        disabled={loadingId === booking.id}
                        onClick={() => void markPaid(booking)}
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Marcar pagado
                      </Button>
                      {onChat && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-10 rounded-xl"
                          onClick={() => onChat(booking)}
                        >
                          <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                          Chat
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ClientPendingPayments({
  bookings,
  onPay,
  onOpen,
  payingId,
}: {
  bookings: BookingLike[]
  onPay: (booking: BookingLike) => void
  onOpen?: (booking: BookingLike) => void
  payingId?: string | null
}) {
  const unpaid = useMemo(() => bookings.filter(isUnpaidBooking), [bookings])
  const [page, setPage] = useState(1)
  const pageSize = 3
  const totalPages = Math.max(1, Math.ceil(unpaid.length / pageSize))
  const pageItems = unpaid.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  if (unpaid.length === 0) return null

  return (
    <Card className="overflow-hidden border-0 shadow-[0_10px_30px_rgba(194,92,38,0.12)]">
      <div className="bg-[linear-gradient(135deg,#c45c26_0%,#e08a2e_100%)] px-4 py-4 text-white">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">Tu cuenta</p>
        <h3 className="text-xl font-black">Pagos pendientes</h3>
        <p className="mt-1 text-sm text-white/85">
          Tenés {unpaid.length} reserva{unpaid.length === 1 ? "" : "s"} por pagar.
        </p>
      </div>
      <CardContent className="space-y-3 p-4">
        {pageItems.map((booking) => (
          <div key={booking.id} className="rounded-2xl border border-orange-100 bg-orange-50/40 p-3 space-y-2">
            <button type="button" className="w-full text-left" onClick={() => onOpen?.(booking)}>
              <p className="font-bold text-slate-900">{booking.serviceName}</p>
              <p className="text-sm text-slate-500">
                {formatBookingWhen(booking)} · {formatMoney(booking.price)}
              </p>
              {booking.paymentRequested && (
                <p className="mt-1 text-[11px] font-semibold text-orange-700">
                  El proveedor te pidió el pago
                </p>
              )}
            </button>
            <Button
              size="sm"
              className="h-10 w-full rounded-xl bg-orange-500 hover:bg-orange-600"
              disabled={payingId === booking.id}
              onClick={() => onPay(booking)}
            >
              {payingId === booking.id ? "Abriendo pago..." : "Pagar ahora"}
            </Button>
          </div>
        ))}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </CardContent>
    </Card>
  )
}
