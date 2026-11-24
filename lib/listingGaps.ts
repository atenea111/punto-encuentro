import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function listingGaps(service: any): string[] {
  if (!service) return ["anuncio publicado"]
  const gaps: string[] = []
  const images = Array.isArray(service.images) && service.images.length > 0
    ? service.images
    : service.image
      ? [service.image]
      : []
  if (!String(service.description || "").trim()) gaps.push("descripción")
  if (images.length === 0) gaps.push("fotos")
  if (!String(service.address || "").trim()) gaps.push("dirección")
  if (!String(service.city || "").trim()) gaps.push("ciudad")
  if (!String(service.phone || "").trim() && !String(service.whatsapp || "").trim()) gaps.push("teléfono o WhatsApp")
  if (!String(service.category || "").trim()) gaps.push("categoría")
  const lat = service.latitude ?? service.lat
  const lng = service.longitude ?? service.lng
  if (lat == null || lng == null) gaps.push("ubicación en el mapa")
  return gaps
}

export async function updateServiceFields(serviceId: string, data: Record<string, unknown>) {
  await updateDoc(doc(db, "services", serviceId), {
    ...data,
    updatedAt: new Date(),
  })
}
