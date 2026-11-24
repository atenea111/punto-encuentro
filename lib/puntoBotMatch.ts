import { formatMoney } from "@/lib/formatMoney"
import { isServiceActive } from "@/lib/serviceUtils"
import { rankServicesForSearch } from "@/lib/searchUtils"

export type ComparableService = {
  id: string
  name: string
  providerId: string
  providerName: string
  category: string
  city: string
  address: string
  description: string
  priceLabel: string
  rating: number
  reviews: number
  missing: string[]
}

export function findRelatedServices(services: any[], term: string, city?: string, limit = 8) {
  const query = [term, city].filter(Boolean).join(" ").trim()
  if (!query) return []
  const active = (services || []).filter((service) => isServiceActive(service as Record<string, unknown>))
  return rankServicesForSearch(active, query).slice(0, limit)
}

export function toComparable(service: any): ComparableService {
  const missing: string[] = []
  if (!String(service.description || "").trim()) missing.push("descripción")
  if (service.price == null || service.price === "" || Number(service.price) <= 0) missing.push("precio")
  if (!Number(service.reviews || 0)) missing.push("reseñas")
  if (!String(service.city || service.address || "").trim()) missing.push("ubicación")
  return {
    id: String(service.id || ""),
    name: String(service.name || "Servicio"),
    providerId: String(service.providerId || ""),
    providerName: String(service.providerName || "Proveedor"),
    category: String(service.category || ""),
    city: String(service.city || ""),
    address: String(service.address || ""),
    description: String(service.description || "").slice(0, 180),
    priceLabel: formatMoney(service.price),
    rating: Number(service.rating || 0),
    reviews: Number(service.reviews || 0),
    missing,
  }
}
