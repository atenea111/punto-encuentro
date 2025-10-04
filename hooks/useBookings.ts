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
  createdAt: Date
  updatedAt: Date
}

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const bookingsRef = collection(db, 'bookings')
      const q = query(bookingsRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const bookingsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Booking[]
      
      setBookings(bookingsData)
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const createBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'bookings'), {
        ...bookingData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
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
