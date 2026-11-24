"use client"

import { useMemo, useState, type ReactNode } from "react"
import { Camera, Check, Star, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getAvailableSlots } from "@/lib/bookingAvailability"
import { listingGaps } from "@/lib/listingGaps"
import { findRelatedServices, toComparable } from "@/lib/puntoBotMatch"
import { uploadImage } from "@/lib/uploadImage"

export type QuoteDraft = {
  work: string
  where: string
  when: string
  photoUrls: string[]
  selectedIds: string[]
  message: string
}

export function defaultQuoteMessage(draft: QuoteDraft, userName: string) {
  return [
    `Hola, te escribo desde Punto Encuentro.`,
    `Necesito: ${draft.work || "—"}`,
    `Dónde: ${draft.where || "—"}`,
    `Para cuándo: ${draft.when || "a convenir"}`,
    draft.photoUrls.length ? `Adjunto ${draft.photoUrls.length} foto(s).` : "",
    `¿Me podés pasar un presupuesto?`,
    userName ? `Soy ${userName}.` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export function BotSheet({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="rounded-[1.35rem] border border-primary/10 bg-[oklch(0.98_0.01_200)] p-3 space-y-2.5 shadow-inner">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-black tracking-[0.14em] uppercase text-primary">{title}</p>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-7 w-7 rounded-full bg-white border border-gray-100 text-gray-500 flex items-center justify-center shrink-0"
          aria-label="Cerrar panel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {children}
    </div>
  )
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{children}</p>
}

const fieldClass = "h-10 rounded-xl bg-white border-gray-200 text-[13px]"

export function QuotePanel({
  services,
  userId,
  draft,
  onChange,
  onSend,
  busy,
}: {
  services: any[]
  userId?: string
  draft: QuoteDraft
  onChange: (next: QuoteDraft) => void
  onSend: () => void
  busy: boolean
}) {
  const related = useMemo(
    () => findRelatedServices(services, draft.work, draft.where, 8),
    [services, draft.work, draft.where]
  )
  const [uploading, setUploading] = useState(false)

  const toggle = (id: string) => {
    const selectedIds = draft.selectedIds.includes(id)
      ? draft.selectedIds.filter((item) => item !== id)
      : [...draft.selectedIds, id]
    onChange({ ...draft, selectedIds })
  }

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      const uploaded: string[] = []
      for (const [index, file] of Array.from(files).slice(0, 4).entries()) {
        uploaded.push(await uploadImage(file, `profiles/${userId || "anon"}/quote-${Date.now()}-${index}`))
      }
      onChange({ ...draft, photoUrls: [...draft.photoUrls, ...uploaded].slice(0, 6) })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2.5 text-[12px]">
      <div>
        <FieldLabel>Trabajo</FieldLabel>
        <Input className={fieldClass} value={draft.work} placeholder="Qué hay que hacer" onChange={(e) => onChange({ ...draft, work: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <FieldLabel>Dónde</FieldLabel>
          <Input className={fieldClass} value={draft.where} placeholder="Ciudad" onChange={(e) => onChange({ ...draft, where: e.target.value })} />
        </div>
        <div>
          <FieldLabel>Para cuándo</FieldLabel>
          <Input className={fieldClass} value={draft.when} placeholder="Fecha" onChange={(e) => onChange({ ...draft, when: e.target.value })} />
        </div>
      </div>
      <div>
        <FieldLabel>Mensaje</FieldLabel>
        <Textarea
          value={draft.message}
          onChange={(e) => onChange({ ...draft, message: e.target.value })}
          className="min-h-[84px] rounded-xl bg-white text-[13px]"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" className="h-9 rounded-xl" disabled={uploading} onClick={() => document.getElementById("punto-quote-photos")?.click()}>
          <Camera className="h-3.5 w-3.5 mr-1.5" />
          {uploading ? "Subiendo..." : "Fotos"}
        </Button>
        <input id="punto-quote-photos" type="file" accept="image/*" multiple className="hidden" onChange={(e) => void addPhotos(e.target.files)} />
        {draft.photoUrls.length > 0 && <span className="text-[11px] font-semibold text-primary">{draft.photoUrls.length} adjuntas</span>}
      </div>
      {draft.photoUrls.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {draft.photoUrls.map((url) => (
            <img key={url} src={url} alt="" className="h-14 w-14 rounded-xl object-cover ring-1 ring-black/5" />
          ))}
        </div>
      )}
      <FieldLabel>Proveedores</FieldLabel>
      <div className="max-h-36 overflow-y-auto space-y-1.5">
        {related.length === 0 && <p className="text-muted-foreground px-1">Completá el trabajo y la ciudad para ver opciones.</p>}
        {related.map((service) => {
          const selected = draft.selectedIds.includes(service.id)
          return (
            <button
              type="button"
              key={service.id}
              onClick={() => toggle(service.id)}
              className={`w-full text-left rounded-xl border p-2.5 flex items-start gap-2.5 transition-colors ${
                selected ? "border-primary bg-primary/5" : "border-gray-100 bg-white"
              }`}
            >
              <span className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center shrink-0 ${selected ? "bg-primary border-primary text-white" : "border-gray-300 bg-white"}`}>
                {selected && <Check className="h-3 w-3" />}
              </span>
              <span>
                <span className="font-bold block text-[13px] text-gray-900">{service.name}</span>
                <span className="text-muted-foreground">{service.city || "Sin ciudad"} · {service.providerName}</span>
              </span>
            </button>
          )
        })}
      </div>
      <Button className="w-full h-10 rounded-xl font-bold" disabled={busy || !draft.selectedIds.length || !draft.message.trim()} onClick={onSend}>
        {busy ? "Enviando..." : "Enviar consultas"}
      </Button>
    </div>
  )
}

export function ComparePanel({ services, term, city }: { services: any[]; term: string; city?: string }) {
  const rows = useMemo(
    () => findRelatedServices(services, term, city, 5).map(toComparable),
    [services, term, city]
  )
  if (!rows.length) {
    return <p className="text-[12px] text-muted-foreground">No hay anuncios suficientes para comparar con esos datos.</p>
  }
  return (
    <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5">
      {rows.map((row) => (
        <div key={row.id} className="rounded-2xl border border-gray-100 bg-white p-3 text-[12px] shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="font-black text-gray-900 leading-tight">{row.name}</p>
            <span className="text-[11px] font-bold text-primary shrink-0">{row.priceLabel}</span>
          </div>
          <p className="text-muted-foreground mt-0.5">{row.city || "Ubicación no publicada"}</p>
          <p className="flex items-center gap-1 mt-1 font-semibold text-gray-600">
            <Star className="h-3 w-3 fill-orange-400 text-orange-400" />
            {row.reviews ? `${row.rating.toFixed(1)} · ${row.reviews} reseñas` : "Sin reseñas"}
          </p>
          <p className="mt-1.5 text-gray-600 leading-relaxed">{row.description || "Sin descripción publicada."}</p>
          {row.missing.length > 0 && (
            <p className="text-amber-700 mt-1.5 text-[11px] font-medium">Falta: {row.missing.join(", ")}</p>
          )}
        </div>
      ))}
    </div>
  )
}

export function BookPanel({
  services,
  bookings,
  serviceId,
  date,
  time,
  onService,
  onDate,
  onTime,
  onConfirm,
  onAskProvider,
  busy,
}: {
  services: any[]
  bookings: any[]
  serviceId: string
  date: string
  time: string
  onService: (id: string) => void
  onDate: (value: string) => void
  onTime: (value: string) => void
  onConfirm: () => void
  onAskProvider: () => void
  busy: boolean
}) {
  const service = services.find((item) => item.id === serviceId)
  const slots = getAvailableSlots(date, bookings, service?.id, service?.providerId)
  return (
    <div className="space-y-2.5 text-[12px]">
      <div>
        <FieldLabel>Servicio</FieldLabel>
        <select
          className="w-full h-10 rounded-xl border border-gray-200 px-3 bg-white text-[13px]"
          value={serviceId}
          onChange={(e) => onService(e.target.value)}
        >
          <option value="">Elegí el servicio</option>
          {services.slice(0, 20).map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} {item.city ? `· ${item.city}` : ""}
            </option>
          ))}
        </select>
      </div>
      <div>
        <FieldLabel>Día</FieldLabel>
        <Input type="date" className={fieldClass} value={date} onChange={(e) => onDate(e.target.value)} />
      </div>
      {date && service && slots.length > 0 && (
        <div>
          <FieldLabel>Horarios libres</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {slots.map((slot) => (
              <Button
                key={slot}
                size="sm"
                variant={time === slot ? "default" : "outline"}
                className="h-8 rounded-full px-3"
                onClick={() => onTime(slot)}
              >
                {slot}
              </Button>
            ))}
          </div>
        </div>
      )}
      {date && service && slots.length === 0 && (
        <p className="text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          No hay horarios libres ese día. Consultá al proveedor por chat.
        </p>
      )}
      {service && date && time && (
        <div className="bg-white border border-primary/15 rounded-2xl p-3">
          <p className="font-black text-gray-900">{service.name}</p>
          <p className="text-muted-foreground mt-0.5">{date} · {time} · {service.providerName}</p>
        </div>
      )}
      <Button className="w-full h-10 rounded-xl font-bold" disabled={busy || !service || !date || !time} onClick={onConfirm}>
        {busy ? "Reservando..." : "Confirmar reserva"}
      </Button>
      {service && (
        <Button className="w-full h-10 rounded-xl" variant="outline" onClick={onAskProvider}>
          Consultar al proveedor
        </Button>
      )}
    </div>
  )
}

export function ListingPanel({
  service,
  draft,
  onDraft,
  onSave,
  onOpenEditor,
  busy,
}: {
  service: any
  draft: string
  onDraft: (value: string) => void
  onSave: () => void
  onOpenEditor: () => void
  busy: boolean
}) {
  const gaps = listingGaps(service)
  return (
    <div className="space-y-2.5 text-[12px]">
      <div className="flex flex-wrap gap-1">
        {gaps.map((gap) => (
          <span key={gap} className="text-[10px] font-bold uppercase tracking-wide bg-white border border-amber-200 text-amber-800 rounded-full px-2 py-0.5">
            {gap}
          </span>
        ))}
      </div>
      <Textarea value={draft} onChange={(e) => onDraft(e.target.value)} className="min-h-[100px] rounded-xl bg-white text-[13px]" />
      <Button className="w-full h-10 rounded-xl font-bold" disabled={busy || !service || !draft.trim()} onClick={onSave}>
        {busy ? "Guardando..." : "Guardar descripción"}
      </Button>
      <Button className="w-full h-10 rounded-xl" variant="outline" onClick={onOpenEditor}>
        Editor completo
      </Button>
    </div>
  )
}

export function ReminderPanel({
  minutes,
  onSave,
  busy,
}: {
  minutes: number
  onSave: (value: number) => void
  busy: boolean
}) {
  const options = [
    { value: 30, label: "30 minutos", hint: "Justo antes" },
    { value: 60, label: "1 hora", hint: "Recomendado" },
    { value: 120, label: "2 horas", hint: "Con margen" },
    { value: 1440, label: "1 día", hint: "El día anterior" },
  ]
  return (
    <div className="space-y-2 text-[12px]">
      <p className="text-muted-foreground leading-relaxed">Notificación de la app. Si el turno se cancela o cambia, el aviso se actualiza.</p>
      <div className="grid grid-cols-2 gap-1.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={busy}
            onClick={() => onSave(option.value)}
            className={`rounded-2xl border p-2.5 text-left ${
              minutes === option.value ? "border-primary bg-primary text-white" : "border-gray-100 bg-white"
            }`}
          >
            <span className="block font-black text-[13px]">{option.label}</span>
            <span className={`text-[10px] ${minutes === option.value ? "text-white/80" : "text-muted-foreground"}`}>{option.hint}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function DraftReplyPanel({
  text,
  onChange,
  onSend,
  busy,
}: {
  text: string
  onChange: (value: string) => void
  onSend: () => void
  busy: boolean
}) {
  return (
    <div className="space-y-2.5 text-[12px]">
      <Textarea value={text} onChange={(e) => onChange(e.target.value)} className="min-h-[110px] rounded-xl bg-white text-[13px]" />
      <Button className="w-full h-10 rounded-xl font-bold" disabled={busy || !text.trim()} onClick={onSend}>
        {busy ? "Enviando..." : "Enviar respuesta"}
      </Button>
    </div>
  )
}

export function ReviewPanel({
  serviceName,
  rating,
  comment,
  onRating,
  onComment,
  onSave,
  busy,
}: {
  serviceName: string
  rating: number
  comment: string
  onRating: (value: number) => void
  onComment: (value: string) => void
  onSave: () => void
  busy: boolean
}) {
  return (
    <div className="space-y-2.5 text-[12px]">
      <p className="font-bold text-gray-900">{serviceName || "Tu turno"}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onRating(value)}
            className={`h-9 w-9 rounded-xl border text-sm font-black ${
              value <= rating ? "bg-primary text-white border-primary" : "bg-white text-gray-400"
            }`}
            aria-label={`${value} estrellas`}
          >
            {value}
          </button>
        ))}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => onComment(e.target.value)}
        className="min-h-[90px] rounded-xl bg-white text-[13px]"
        placeholder="Contá cómo te fue"
      />
      <Button className="w-full h-10 rounded-xl font-bold" disabled={busy || !comment.trim()} onClick={onSave}>
        {busy ? "Publicando..." : "Publicar reseña"}
      </Button>
    </div>
  )
}
