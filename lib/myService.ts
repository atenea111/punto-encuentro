import { collection, getDocs, query, updateDoc, where, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Service } from '@/hooks/useServices'

/** Servicios del proveedor (por uid). */
export function getMyServices(services: Service[] | any[] | undefined, userId?: string | null) {
  if (!userId) return []
  return (services || []).filter((service) => service.providerId === userId)
}

/** Un solo servicio canónico por cuenta (el más antiguo). */
export function getCanonicalService(services: Service[] | any[] | undefined, userId?: string | null) {
  const mine = getMyServices(services, userId)
  if (mine.length === 0) return null
  return [...mine].sort((left, right) => {
    const leftTime = left.createdAt instanceof Date ? left.createdAt.getTime() : new Date(left.createdAt || 0).getTime()
    const rightTime = right.createdAt instanceof Date ? right.createdAt.getTime() : new Date(right.createdAt || 0).getTime()
    return leftTime - rightTime
  })[0]
}

export async function providerAlreadyHasService(providerId: string) {
  const snap = await getDocs(query(collection(db, 'services'), where('providerId', '==', providerId)))
  return !snap.empty
}

/** Sincroniza el nombre del perfil personal hacia el servicio canónico (sin pisar contacto del servicio). */
export async function syncCanonicalServiceFromProfile(
  userId: string,
  profile: {
    businessName?: string
    displayName?: string
    address?: string
    city?: string
  },
  services: Service[] | any[]
) {
  const canonical = getCanonicalService(services, userId)
  if (!canonical?.id) return { synced: false as const }

  const businessName = (profile.businessName || profile.displayName || '').trim()
  await updateDoc(doc(db, 'services', canonical.id), {
    businessName,
    providerName: businessName || canonical.providerName || 'Proveedor',
    updatedAt: new Date(),
  })

  return { synced: true as const, serviceId: canonical.id }
}
