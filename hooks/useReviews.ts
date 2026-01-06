import { useState, useEffect } from 'react'
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  orderBy,
  where,
  serverTimestamp,
  getDoc
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Review {
  id: string
  serviceId: string
  clientId: string
  clientName: string
  rating: number
  comment: string
  createdAt: any
}

export function useReviews(serviceId?: string) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (serviceId) {
      fetchReviews(serviceId)
    }
  }, [serviceId])

  const fetchReviews = async (sid: string) => {
    try {
      setLoading(true)
      const reviewsRef = collection(db, 'reviews')
      const q = query(
        reviewsRef, 
        where('serviceId', '==', sid),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      const reviewsData = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
        }
      }) as Review[]
      
      setReviews(reviewsData)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const addReview = async (reviewData: Omit<Review, 'id' | 'createdAt'>, bookingId?: string) => {
    try {
      // 1. Agregar la reseña
      const docRef = await addDoc(collection(db, 'reviews'), {
        ...reviewData,
        createdAt: serverTimestamp()
      })

      // 2. Marcar la reserva como reseñada si existe bookingId
      if (bookingId) {
        const bookingRef = doc(db, 'bookings', bookingId)
        await updateDoc(bookingRef, { reviewed: true })
      }

      // 3. Actualizar el promedio y total en el servicio
      const serviceRef = doc(db, 'services', reviewData.serviceId)
      const serviceSnap = await getDoc(serviceRef)
      
      if (serviceSnap.exists()) {
        const serviceData = serviceSnap.data()
        const currentTotalReviews = serviceData.reviews || 0
        const currentRating = serviceData.rating || 0
        
        const newTotalReviews = currentTotalReviews + 1
        const newRating = ((currentRating * currentTotalReviews) + reviewData.rating) / newTotalReviews

        await updateDoc(serviceRef, {
          rating: Number(newRating.toFixed(1)),
          reviews: newTotalReviews
        })
      }

      return { success: true, id: docRef.id }
    } catch (error: any) {
      console.error('Error adding review:', error)
      return { success: false, error: error.message }
    }
  }

  return {
    reviews,
    loading,
    fetchReviews,
    addReview
  }
}
