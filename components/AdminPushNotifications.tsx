"use client"

import { useEffect, useMemo, useState } from "react"
import { ADMIN_BOT_EVENT, consumeAdminBotAction } from "@/lib/adminBotAction"
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { uploadImage } from "@/lib/uploadImage"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AppIcon } from "@/components/AppIcon"
import type { Category } from "@/hooks/useCategories"

type Audience = "all" | "zone" | "category"

type AdminNotification = {
  id: string
  title: string
  body: string
  imageUrl?: string
  audience: Audience
  zone?: string
  category?: string
  status: string
  sentCount?: number
  error?: string
  createdAt?: Date
}

export function AdminPushNotifications({
  adminId,
  categories,
  knownCities,
}: {
  adminId: string
  categories: Category[]
  knownCities: string[]
}) {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [audience, setAudience] = useState<Audience>("all")
  const [zone, setZone] = useState("")
  const [category, setCategory] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState("")
  const [history, setHistory] = useState<AdminNotification[]>([])

  const cities = useMemo(() => {
    const unique = Array.from(new Set(knownCities.map((city) => city.trim()).filter(Boolean)))
    unique.sort((a, b) => a.localeCompare(b, "es"))
    return unique
  }, [knownCities])

  useEffect(() => {
    const q = query(collection(db, "adminNotifications"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistory(
        snapshot.docs.slice(0, 20).map((item) => {
          const data = item.data()
          return {
            id: item.id,
            title: String(data.title || ""),
            body: String(data.body || ""),
            imageUrl: data.imageUrl || "",
            audience: data.audience === "zone" || data.audience === "category" ? data.audience : "all",
            zone: data.zone || "",
            category: data.category || "",
            status: String(data.status || "pending"),
            sentCount: Number(data.sentCount || 0),
            error: data.error || "",
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : undefined,
          }
        })
      )
    }, (error) => {
      console.error("Error leyendo notificaciones:", error)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const apply = () => {
      const action = consumeAdminBotAction()
      if (!action || action.type !== "draft_push") return
      setTitle(action.title)
      setBody(action.body)
      setAudience(action.audience)
      setZone(action.zone || "")
      setCategory(action.category || "")
      setMessage("Punto armó un borrador. Revisalo y enviá cuando esté bien.")
    }
    apply()
    window.addEventListener(ADMIN_BOT_EVENT, apply)
    return () => window.removeEventListener(ADMIN_BOT_EVENT, apply)
  }, [])

  const handleImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setMessage("Seleccioná una imagen válida")
      return
    }
    setImageFile(file)
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setMessage("Completá título y mensaje")
      return
    }
    if (audience === "zone" && !zone.trim()) {
      setMessage("Elegí o escribí una zona")
      return
    }
    if (audience === "category" && !category.trim()) {
      setMessage("Elegí una categoría")
      return
    }

    setSending(true)
    setMessage("")
    try {
      let imageUrl = ""
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, `admin-notifications/${adminId}`)
      }

      await addDoc(collection(db, "adminNotifications"), {
        title: title.trim(),
        body: body.trim(),
        imageUrl,
        audience,
        zone: audience === "zone" ? zone.trim() : "",
        category: audience === "category" ? category.trim() : "",
        createdBy: adminId,
        createdAt: serverTimestamp(),
        status: "pending",
        sentCount: 0,
      })

      setTitle("")
      setBody("")
      setImageFile(null)
      if (imagePreview) URL.revokeObjectURL(imagePreview)
      setImagePreview("")
      setMessage("Notificación en cola. Se envía a los celulares en unos segundos.")
    } catch (error: any) {
      setMessage(error.message || "No se pudo crear la notificación")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm bg-white">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <AppIcon name="notificacionesActivo" className="h-8 w-8" />
            <div>
              <h3 className="font-bold text-gray-900">Enviar notificación</h3>
              <p className="text-sm text-muted-foreground">Con o sin imagen, a todos o por zona / categoría.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Novedad en Punto Encuentro" />
          </div>

          <div className="space-y-2">
            <Label>Mensaje</Label>
            <Textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} placeholder="Texto que van a ver en el celular" />
          </div>

          <div className="space-y-2">
            <Label>Imagen (opcional)</Label>
            <input type="file" accept="image/*" className="hidden" id="admin-push-image" onChange={handleImage} />
            <Button type="button" variant="outline" onClick={() => document.getElementById("admin-push-image")?.click()}>
              {imageFile ? "Cambiar imagen" : "Adjuntar imagen"}
            </Button>
            {imagePreview && (
              <img src={imagePreview} alt="Vista previa" className="mt-2 w-full max-h-40 object-cover rounded-xl" />
            )}
          </div>

          <div className="space-y-2">
            <Label>Destinatarios</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: "all" as const, label: "Todos" },
                { id: "zone" as const, label: "Por zona" },
                { id: "category" as const, label: "Por categoría" },
              ].map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  variant={audience === option.id ? "default" : "outline"}
                  onClick={() => setAudience(option.id)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {audience === "zone" && (
            <div className="space-y-2">
              <Label>Zona / ciudad</Label>
              <Input list="admin-push-cities" value={zone} onChange={(event) => setZone(event.target.value)} placeholder="Ej: Rosario" />
              <datalist id="admin-push-cities">
                {cities.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            </div>
          )}

          {audience === "category" && (
            <div className="space-y-2">
              <Label>Categoría</Label>
              <select
                className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="">Elegí un rubro</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button onClick={handleSend} disabled={sending} className="w-full h-12 font-semibold">
            {sending ? "Enviando..." : "Enviar notificación"}
          </Button>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-white">
        <CardContent className="p-6 space-y-3">
          <h3 className="font-bold text-gray-900">Últimos envíos</h3>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay notificaciones enviadas.</p>
          ) : (
            history.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-100 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.body}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {item.audience === "all" && "Todos"}
                      {item.audience === "zone" && `Zona: ${item.zone}`}
                      {item.audience === "category" && `Categoría: ${item.category}`}
                      {item.createdAt ? ` · ${item.createdAt.toLocaleString("es-AR")}` : ""}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-primary">
                    {item.status === "sent" ? `${item.sentCount} enviadas` : item.status === "error" ? "Error" : "Pendiente"}
                  </span>
                </div>
                {item.error && <p className="text-xs text-red-600 mt-1">{item.error}</p>}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
