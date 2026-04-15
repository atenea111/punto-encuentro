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
  where,
  onSnapshot 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Booking {
  id: string
  serviceId: string
  serviceName: string
  clientId: string
  clientName: string
  clientEmail: string
  providerId: string
  providerName: string
  date: string
  time: string
  price: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  paymentMethod: 'cash' | 'mercadopago' | 'transfer'
  paymentStatus: 'pending' | 'paid' | 'refunded'
  source?: 'anuncio' | 'recomendados' | 'cerca_tuyo' | 'rubro' | 'buscador'
  createdAt: Date
  updatedAt: Date
}

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const bookingsRef = collection(db, 'bookings')
    const q = query(bookingsRef, orderBy('createdAt', 'desc'))
    
    setLoading(true)
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const bookingsData = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now())
        }
      }) as Booking[]
      
      setBookings(bookingsData)
      setLoading(false)
    }, (error) => {
      console.error('Error listening to bookings:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const fetchBookings = async () => {
    // No-op ya que onSnapshot mantiene los datos actualizados
  }

  const createBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'bookings'), {
        ...bookingData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      // Actualizar la lista local de reservas
      const newBooking: Booking = {
        id: docRef.id,
        ...bookingData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      setBookings(prev => [newBooking, ...prev])
      
      return { success: true, id: docRef.id }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const updateBooking = async (id: string, bookingData: Partial<Booking>) => {
    try {
      const bookingRef = doc(db, 'bookings', id)
      await updateDoc(bookingRef, {
        ...bookingData,
        updatedAt: new Date()
      })
      
      // Actualizar la lista local
      setBookings(prev => 
        prev.map(booking => 
          booking.id === id 
            ? { ...booking, ...bookingData, updatedAt: new Date() }
            : booking
        )
      )
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const cancelBooking = async (id: string) => {
    try {
      const bookingRef = doc(db, 'bookings', id)
      await updateDoc(bookingRef, {
        status: 'cancelled',
        updatedAt: new Date()
      })
      
      // Actualizar la lista local
      setBookings(prev => 
        prev.map(booking => 
          booking.id === id 
            ? { ...booking, status: 'cancelled' as const, updatedAt: new Date() }
            : booking
        )
      )
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const getBookingsByClient = (clientId: string) => {
    return bookings.filter(booking => booking.clientId === clientId)
  }

  const getBookingsByProvider = (providerId: string) => {
    return bookings.filter(booking => booking.providerId === providerId)
  }

  const getBookingsByStatus = (status: Booking['status']) => {
    return bookings.filter(booking => booking.status === status)
  }

  return {
    bookings,
    loading,
    fetchBookings,
    createBooking,
    updateBooking,
    cancelBooking,
    getBookingsByClient,
    getBookingsByProvider,
    getBookingsByStatus
  }
}

