import { useState, useEffect } from 'react'
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  where 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { rankServicesForSearch, serviceMatchesCategory } from '@/lib/searchUtils'

export interface Service {
  id: string
  name: string
  description: string
  price: number
  category: string
  providerId: string
  providerName: string
  businessName?: string
  address?: string
  city?: string
  rating: number
  reviews: number
  image?: string
  images?: string[]
  duration?: string
  latitude?: number
  longitude?: number
  lat?: number
  lng?: number
  createdAt: Date
  updatedAt: Date
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const servicesRef = collection(db, 'services')
      const q = query(servicesRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const servicesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Service[]
      
      setServices(servicesData)
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const createService = async (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (serviceData.providerId) {
        const existing = await getDocs(
          query(collection(db, 'services'), where('providerId', '==', serviceData.providerId))
        )
        if (!existing.empty) {
          return {
            success: false,
            error: 'Ya tenés un servicio con esta cuenta. Solo se permite uno por correo: editá el existente.',
          }
        }
      }

      const docRef = await addDoc(collection(db, 'services'), {
        ...serviceData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      await fetchServices()
      return { success: true, id: docRef.id }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const updateService = async (id: string, serviceData: Partial<Service>) => {
    try {
      const serviceRef = doc(db, 'services', id)
      await updateDoc(serviceRef, {
        ...serviceData,
        updatedAt: new Date()
      })
      await fetchServices()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const deleteService = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'services', id))
      await fetchServices()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const getServicesByCategory = (category: string) => {
    return services.filter(service => serviceMatchesCategory(service as Record<string, unknown>, category))
  }

  const searchServices = (searchTerm: string) => {
    return rankServicesForSearch(services as any[], searchTerm)
  }

  return {
    services,
    loading,
    fetchServices,
    createService,
    updateService,
    deleteService,
    getServicesByCategory,
    searchServices
  }
}

