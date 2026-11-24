import { useState, useEffect } from 'react'
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  orderBy,
  where,
  onSnapshot,
  type DocumentData,
  type Query,
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { parseMoney } from '@/lib/formatMoney'

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
  paymentMethod: 'cash' | 'mercadopago' | 'transfer' | 'later'
  paymentStatus: 'pending' | 'paid' | 'refunded'
  paymentRequested?: boolean
  paymentRequestedAt?: Date | null
  source?: 'anuncio' | 'recomendados' | 'cerca_tuyo' | 'rubro' | 'buscador' | 'stories'
  reviewed?: boolean
  createdAt: Date
  updatedAt: Date
}

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let roleUnsubscribe: (() => void) | undefined
    let bookingUnsubscribes: Array<() => void> = []

    const clearBookingListeners = () => {
      bookingUnsubscribes.forEach((unsubscribe) => unsubscribe())
      bookingUnsubscribes = []
    }

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      roleUnsubscribe?.()
      clearBookingListeners()

      if (!user) {
        setBookings([])
        setLoading(false)
        return
      }

      // Solo recrear listeners de bookings si cambia el rol.
      // Cada heartbeat de presence actualizaba users/{uid} y provocaba
      // thrashing + assertion interna de Firestore.
      let boundRole: string | undefined

      roleUnsubscribe = onSnapshot(doc(db, 'users', user.uid), (userSnapshot) => {
        const role = String(userSnapshot.data()?.role || 'client')
        if (boundRole === role && bookingUnsubscribes.length > 0) return
        boundRole = role

        clearBookingListeners()
        setLoading(true)

        const bookingsRef = collection(db, 'bookings')
        const isAdmin = role === 'admin'
        const buckets = new Map<string, Booking[]>()
        const expectedBuckets = isAdmin ? 1 : 2

        const publish = () => {
          if (buckets.size < expectedBuckets) return
          const unique = new Map<string, Booking>()
          buckets.forEach((items) => items.forEach((booking) => unique.set(booking.id, booking)))
          setBookings(
            Array.from(unique.values()).sort(
              (left, right) => right.createdAt.getTime() - left.createdAt.getTime()
            )
          )
          setLoading(false)
        }

        const listen = (key: string, bookingsQuery: Query<DocumentData>) => {
          const unsubscribe = onSnapshot(bookingsQuery, (querySnapshot) => {
            const items = querySnapshot.docs.map((bookingDoc) => {
              const data = bookingDoc.data()
              return {
                id: bookingDoc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now())
              }
            }) as Booking[]
            buckets.set(key, items)
            publish()
          }, (error) => {
            console.error('Error listening to bookings:', error)
            buckets.set(key, [])
            publish()
          })
          bookingUnsubscribes.push(unsubscribe)
        }

        if (isAdmin) {
          listen('admin', query(bookingsRef, orderBy('createdAt', 'desc')))
        } else {
          listen('client', query(bookingsRef, where('clientId', '==', user.uid)))
          listen('provider', query(bookingsRef, where('providerId', '==', user.uid)))
        }
      }, (error) => {
        console.error('Error loading booking permissions:', error)
        setBookings([])
        setLoading(false)
      })
    })

    return () => {
      authUnsubscribe()
      roleUnsubscribe?.()
      clearBookingListeners()
    }
  }, [])

  const fetchBookings = async () => {
    // No-op ya que onSnapshot mantiene los datos actualizados
  }

  const createBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const price = parseMoney(bookingData.price) ?? 0
      const payload = { ...bookingData, price }
      const docRef = await addDoc(collection(db, 'bookings'), {
        ...payload,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      // Actualizar la lista local de reservas
      const newBooking: Booking = {
        id: docRef.id,
        ...payload,
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

