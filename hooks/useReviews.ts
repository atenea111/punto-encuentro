import { useState, useEffect } from 'react'
import {
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
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
      const q = query(reviewsRef, where('serviceId', '==', sid))
      const querySnapshot = await getDocs(q)
      
      const reviewsData = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
        }
      }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) as Review[]
      
      setReviews(reviewsData)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const addReview = async (reviewData: Omit<Review, 'id' | 'createdAt'>, bookingId?: string) => {
    try {
      if (!reviewData.clientId || !reviewData.serviceId) {
        return { success: false, error: 'Inicia sesión para dejar una reseña.' }
      }

      // Una sola reseña por usuario y servicio
      const existingQuery = query(
        collection(db, 'reviews'),
        where('serviceId', '==', reviewData.serviceId),
        where('clientId', '==', reviewData.clientId)
      )
      const existingSnap = await getDocs(existingQuery)
      if (!existingSnap.empty) {
        return { success: false, error: 'Ya dejaste una reseña en este servicio.' }
      }

      // Validar antes de crear para evitar reseñas duplicadas por reserva
      if (bookingId) {
        const bookingRef = doc(db, 'bookings', bookingId)
        const bookingSnap = await getDoc(bookingRef)
        if (bookingSnap.exists() && bookingSnap.data().reviewed) {
          return { success: false, error: 'Esta reserva ya fue calificada.' }
        }
      }

      const docRef = await addDoc(collection(db, 'reviews'), {
        ...reviewData,
        bookingId: bookingId || null,
        createdAt: serverTimestamp()
      })

      if (bookingId) {
        await updateDoc(doc(db, 'bookings', bookingId), { reviewed: true, updatedAt: new Date() })
      }

      // Actualizar el promedio y total en el servicio
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

      if (serviceId === reviewData.serviceId) {
        await fetchReviews(reviewData.serviceId)
      }

      return { success: true, id: docRef.id }
    } catch (error: any) {
      console.error('Error adding review:', error)
      return { success: false, error: error.message }
    }
  }

  const hasUserReviewed = (clientId?: string) => {
    if (!clientId) return false
    return reviews.some((review) => review.clientId === clientId)
  }

  return {
    reviews,
    loading,
    fetchReviews,
    addReview,
    hasUserReviewed,
  }
}
