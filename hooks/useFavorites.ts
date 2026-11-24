import { useEffect, useState } from 'react'
import { arrayRemove, arrayUnion, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function useFavorites(userId?: string) {
  const [favoriteServiceIds, setFavoriteServiceIds] = useState<string[]>([])
  const [loading, setLoading] = useState(Boolean(userId))

  useEffect(() => {
    if (!userId) {
      setFavoriteServiceIds([])
      setLoading(false)
      return
    }

    const unsubscribe = onSnapshot(doc(db, 'users', userId), (snapshot) => {
      const ids = snapshot.data()?.favoriteServiceIds
      setFavoriteServiceIds(Array.isArray(ids) ? ids : [])
      setLoading(false)
    }, (error) => {
      console.error('Error loading favorites:', error)
      setLoading(false)
    })

    return unsubscribe
  }, [userId])

  const isFavorite = (serviceId?: string) => Boolean(serviceId && favoriteServiceIds.includes(serviceId))

  const toggleFavorite = async (serviceId: string) => {
    if (!userId) return { success: false, error: 'Debes iniciar sesión para guardar favoritos.' }

    const userRef = doc(db, 'users', userId)
    const removing = favoriteServiceIds.includes(serviceId)
    const nextIds = removing
      ? favoriteServiceIds.filter((id) => id !== serviceId)
      : [...favoriteServiceIds, serviceId]
    setFavoriteServiceIds(nextIds)

    try {
      await updateDoc(userRef, {
        favoriteServiceIds: removing ? arrayRemove(serviceId) : arrayUnion(serviceId),
        updatedAt: new Date()
      })
      return { success: true }
    } catch (error: any) {
      try {
        await setDoc(userRef, {
          favoriteServiceIds: nextIds,
          updatedAt: new Date()
        }, { merge: true })
        return { success: true }
      } catch (fallbackError: any) {
        setFavoriteServiceIds((current) => removing
          ? [...current, serviceId]
          : current.filter((id) => id !== serviceId)
        )
        return { success: false, error: fallbackError.message || error.message }
      }
    }
  }

  return { favoriteServiceIds, isFavorite, toggleFavorite, loading }
}
