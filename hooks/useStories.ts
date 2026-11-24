import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { normalizeSearchText } from '@/lib/searchUtils'

export type StoryMediaType = 'image' | 'video'
export type StoryCtaType = 'service' | 'booking' | 'contact' | 'none'

export interface Story {
  id: string
  providerId: string
  providerName: string
  providerImage?: string
  serviceId?: string
  serviceName?: string
  city: string
  cityKey: string
  category?: string
  mediaUrl: string
  mediaType: StoryMediaType
  caption: string
  ctaType: StoryCtaType
  ctaTarget?: string
  views: number
  ctaClicks: number
  replies: number
  active: boolean
  createdAt: Date
  expiresAt: Date
  updatedAt: Date
}

export const STORIES_DAILY_LIMIT = 10

export function normalizeLocationKey(value: string) {
  return normalizeSearchText(value)
}

function toDate(value: any) {
  if (!value) return new Date()
  if (value instanceof Date) return value
  if (typeof value?.toDate === 'function') return value.toDate()
  return new Date(value)
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function isStoryActive(story: Story) {
  return story.active && story.expiresAt.getTime() > Date.now()
}

/** Escrituras de métricas fuera del hook para no re-suscribir listeners al swipe. */
export function recordStoryView(storyId: string) {
  void updateDoc(doc(db, 'stories', storyId), {
    views: increment(1),
    updatedAt: new Date(),
  }).catch(() => {})
}

export function recordStoryCtaClick(storyId: string) {
  return updateDoc(doc(db, 'stories', storyId), {
    ctaClicks: increment(1),
    updatedAt: new Date(),
  }).then(() => ({ success: true as const })).catch((error: any) => ({
    success: false as const,
    error: error.message,
  }))
}

export function recordStoryReply(storyId: string) {
  return updateDoc(doc(db, 'stories', storyId), {
    replies: increment(1),
    updatedAt: new Date(),
  }).then(() => ({ success: true as const })).catch((error: any) => ({
    success: false as const,
    error: error.message,
  }))
}

export function filterStoriesForCity(activeStories: Story[], city?: string | null, providerId?: string) {
  const cityKey = normalizeLocationKey(city || '')
  if (!cityKey) return []

  return activeStories
    .filter((story) => story.cityKey === cityKey)
    .filter((story) => (providerId ? story.providerId === providerId : true))
    .sort((left, right) => {
      const engagementRight = right.views * 0.35 + right.ctaClicks * 1.25
      const engagementLeft = left.views * 0.35 + left.ctaClicks * 1.25
      const rightScore = right.createdAt.getTime() + engagementRight * 1000
      const leftScore = left.createdAt.getTime() + engagementLeft * 1000
      return rightScore - leftScore
    })
}

export function useStories() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storiesRef = collection(db, 'stories')
    const q = query(storiesRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const storiesData = snapshot.docs.map((storyDoc) => {
          const data = storyDoc.data()
          const city = String(data.city || '').trim()
          const cityKey = normalizeLocationKey(String(data.cityKey || city))

          return {
            id: storyDoc.id,
            providerId: String(data.providerId || ''),
            providerName: String(data.providerName || 'Proveedor'),
            providerImage: data.providerImage || '',
            serviceId: data.serviceId || '',
            serviceName: data.serviceName || '',
            city,
            cityKey,
            category: data.category || '',
            mediaUrl: String(data.mediaUrl || ''),
            mediaType: data.mediaType === 'video' ? 'video' : 'image',
            caption: String(data.caption || ''),
            ctaType: data.ctaType === 'booking' || data.ctaType === 'contact' || data.ctaType === 'none'
              ? data.ctaType
              : 'service',
            ctaTarget: data.ctaTarget || '',
            views: Number(data.views || 0),
            ctaClicks: Number(data.ctaClicks || 0),
            replies: Number(data.replies || 0),
            active: data.active !== false,
            createdAt: toDate(data.createdAt),
            expiresAt: toDate(data.expiresAt),
            updatedAt: toDate(data.updatedAt),
          } as Story
        })

        setStories(storiesData)
        setLoading(false)
      },
      (error) => {
        console.error('Error listening stories:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const activeStories = useMemo(
    () => stories.filter(isStoryActive),
    [stories]
  )

  const getStoriesForCity = useCallback(
    (city?: string | null, providerId?: string) => filterStoriesForCity(activeStories, city, providerId),
    [activeStories]
  )

  const getStoriesByProvider = useCallback((providerId: string) => {
    return stories
      .filter((story) => story.providerId === providerId)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
  }, [stories])

  const getStoriesByProviderForToday = useCallback((providerId: string) => {
    const today = new Date()
    return stories.filter(
      (story) => story.providerId === providerId && isSameDay(story.createdAt, today)
    )
  }, [stories])

  const getRemainingStoriesToday = useCallback((providerId: string) => {
    return Math.max(0, STORIES_DAILY_LIMIT - getStoriesByProviderForToday(providerId).length)
  }, [getStoriesByProviderForToday])

  const createStory = async (storyData: Omit<Story, 'id' | 'views' | 'ctaClicks' | 'replies' | 'active' | 'createdAt' | 'updatedAt' | 'expiresAt'>) => {
    try {
      const remaining = getRemainingStoriesToday(storyData.providerId)
      if (remaining <= 0) {
        return {
          success: false,
          error: `Llegaste al límite de ${STORIES_DAILY_LIMIT} historias por día`,
        }
      }

      const now = new Date()
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      const docRef = await addDoc(collection(db, 'stories'), {
        ...storyData,
        active: true,
        views: 0,
        ctaClicks: 0,
        replies: 0,
        createdAt: now,
        updatedAt: now,
        expiresAt,
      })

      return { success: true, id: docRef.id }
    } catch (error: any) {
      console.error('Error creating story:', error)
      return { success: false, error: error.message || 'No se pudo crear la historia' }
    }
  }

  const toggleStoryActive = async (storyId: string, active: boolean) => {
    try {
      await updateDoc(doc(db, 'stories', storyId), {
        active,
        updatedAt: new Date(),
      })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const deleteStory = async (storyId: string) => {
    try {
      await deleteDoc(doc(db, 'stories', storyId))
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  return {
    stories,
    activeStories,
    loading,
    storiesDailyLimit: STORIES_DAILY_LIMIT,
    getStoriesForCity,
    getStoriesByProvider,
    getStoriesByProviderForToday,
    getRemainingStoriesToday,
    createStory,
    toggleStoryActive,
    deleteStory,
    recordStoryView,
    recordStoryCtaClick,
    recordStoryReply,
  }
}
