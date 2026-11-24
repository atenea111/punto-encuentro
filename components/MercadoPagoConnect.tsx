"use client"

import { useEffect, useState } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AppIcon } from "@/components/AppIcon"
import { callableErrorMessage, disconnectMercadoPago, startMercadoPagoOAuth } from "@/lib/mercadopagoConnect"
import { CheckCircle2, ExternalLink, Loader2, ShieldCheck, Unlink } from "lucide-react"

export function MercadoPagoConnect({ userId }: { userId?: string | null }) {
  const [connected, setConnected] = useState(false)
  const [nickname, setNickname] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!userId) return
    const unsub = onSnapshot(doc(db, "users", userId), (snap) => {
      const data = snap.data() || {}
      setConnected(Boolean(data.mpConnected))
      setNickname(String(data.mpNickname || data.mpEmail || ""))
    })
    return () => unsub()
  }, [userId])

  const handleConnect = async () => {
    setLoading(true)
    setError("")
    setMessage("")
    try {
      await startMercadoPagoOAuth()
      setMessage("Se abrió Mercado Pago. Cuando autorices, volvé a esta pantalla.")
    } catch (err) {
      setError(callableErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm("¿Desconectar Mercado Pago? Los clientes no van a poder pagarte por la app hasta que lo vuelvas a vincular.")) return
    setLoading(true)
    setError("")
    try {
      await disconnectMercadoPago()
      setMessage("Cuenta desconectada.")
    } catch (err) {
      setError(callableErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-white via-white to-sky-50 shadow-[0_12px_35px_rgba(0,158,227,0.12)]">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-md ring-1 ring-sky-100">
            <AppIcon name="datosPago" className="h-full w-full rounded-xl" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black text-slate-900">Cobrá con Mercado Pago</h3>
              {connected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Conectado
                </span>
              )}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              {connected
                ? `Los pagos de tus reservas ingresan directamente a ${nickname || "tu cuenta"}.`
                : "Vinculá tu cuenta una sola vez y recibí el dinero de cada reserva directamente."}
            </p>
          </div>
        </div>

        {connected ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-emerald-900">Cuenta lista para cobrar</p>
                {nickname && <p className="truncate text-xs text-emerald-700">{nickname}</p>}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-xl px-3 text-xs text-slate-500 hover:bg-white hover:text-red-600"
                onClick={handleDisconnect}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="mr-1.5 h-3.5 w-3.5" />}
                {!loading && "Desconectar"}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            className="group h-14 w-full rounded-2xl border-0 bg-[#009EE3] px-4 font-bold text-white shadow-[0_8px_20px_rgba(0,158,227,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#008ED0] hover:shadow-[0_12px_24px_rgba(0,158,227,0.32)]"
            onClick={handleConnect}
            disabled={loading || !userId}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Abriendo Mercado Pago...
              </>
            ) : (
              <span className="flex w-full items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-sm">
                  <AppIcon name="datosPago" className="h-full w-full rounded-lg" />
                </span>
                <span className="flex-1 text-left">Conectar mi Mercado Pago</span>
                <ExternalLink className="h-4 w-4 opacity-80 transition-transform group-hover:translate-x-0.5" />
              </span>
            )}
          </Button>
        )}

        {!connected && (
          <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Conexión segura. Punto Encuentro no recibe tu dinero.
          </p>
        )}

        {message && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  )
}
