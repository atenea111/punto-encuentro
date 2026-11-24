import { useEffect, useMemo, useState } from 'react'
import { doc, FieldPath, getDoc, onSnapshot, query, collection, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

export interface ChatSummary {
  id: string
  partnerId: string
  partnerName: string
  lastMessage: string
  lastMessageAt: Date
  unreadCount: number
}

function toDate(value: any) {
  if (value?.toDate) return value.toDate()
  if (value instanceof Date) return value
  return value ? new Date(value) : new Date(0)
}

export function useChatInbox(userId?: string) {
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [loading, setLoading] = useState(Boolean(userId))

  useEffect(() => {
    // La query debe usar exactamente auth.uid para que las reglas la validen.
    const uid = auth.currentUser?.uid
    if (!userId || !uid || userId !== uid) {
      setChats([])
      setLoading(false)
      return
    }

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', uid)
    )
    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const nextChats = snapshot.docs.map((chatDoc) => {
        const data = chatDoc.data()
        const participants = Array.isArray(data.participants) ? data.participants : []
        const partnerId = participants.find((id: string) => id !== uid) || ''
        return {
          id: chatDoc.id,
          partnerId,
          partnerName: data.participantNames?.[partnerId] || 'Usuario',
          lastMessage: String(data.lastMessage || 'Conversación iniciada'),
          lastMessageAt: toDate(data.lastMessageAt || data.updatedAt),
          unreadCount: Number(data.unreadCounts?.[uid] || 0),
        }
      }).filter((chat) => chat.partnerId)
        .sort((left, right) => right.lastMessageAt.getTime() - left.lastMessageAt.getTime())

      setChats(nextChats)
      setLoading(false)
    }, (error) => {
      console.error('Error loading chats:', error)
      setChats([])
      setLoading(false)
    })

    return unsubscribe
  }, [userId])

  const totalUnread = useMemo(() => chats.reduce((sum, chat) => sum + chat.unreadCount, 0), [chats])
  return { chats, totalUnread, loading }
}

export function usePresence(userId?: string) {
  useEffect(() => {
    if (!userId) return
    if (typeof window === 'undefined') return

    const userRef = doc(db, 'users', userId)
    let cancelled = false
    let inFlight = false
    let pending: boolean | null = null

    const flush = async () => {
      if (cancelled || inFlight || pending === null) return
      if (auth.currentUser?.uid !== userId) return

      const online = pending
      pending = null
      inFlight = true
      try {
        await updateDoc(userRef, {
          'presence.online': online,
          'presence.lastSeen': serverTimestamp(),
        })
      } catch {
        // not-found / permission / cliente Firestore inestable: no romper la UI
      } finally {
        inFlight = false
        if (pending !== null) void flush()
      }
    }

    const queuePresence = (online: boolean) => {
      pending = online
      void flush()
    }

    const handleVisibility = () => {
      queuePresence(document.visibilityState === 'visible')
    }

    queuePresence(document.visibilityState !== 'hidden')
    // Heartbeat solo con pestaña visible; evita escrituras innecesarias y thrashing.
    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === 'visible') queuePresence(true)
    }, 60000)

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      pending = null
      window.clearInterval(heartbeat)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [userId])
}

export function usePartnerPresence(partnerId?: string) {
  const [presence, setPresence] = useState<{ online: boolean; lastSeen: Date | null }>({ online: false, lastSeen: null })
  const [clock, setClock] = useState(Date.now())

  useEffect(() => {
    const interval = window.setInterval(() => setClock(Date.now()), 30000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!partnerId) return
    return onSnapshot(doc(db, 'users', partnerId), (snapshot) => {
      const data = snapshot.data()?.presence
      setPresence({ online: data?.online === true, lastSeen: data?.lastSeen ? toDate(data.lastSeen) : null })
    })
  }, [partnerId])

  const recentlyActive = presence.lastSeen ? clock - presence.lastSeen.getTime() < 90000 : false
  return { online: presence.online && recentlyActive, lastSeen: presence.lastSeen }
}

export async function markChatRead(chatId: string, userId: string) {
  if (!chatId || !userId || auth.currentUser?.uid !== userId) return
  try {
    const chatRef = doc(db, 'chats', chatId)
    const snap = await getDoc(chatRef)
    if (!snap.exists()) return

    await updateDoc(
      chatRef,
      new FieldPath('unreadCounts', userId), 0,
      new FieldPath('lastReadAt', userId), serverTimestamp(),
    )
  } catch (error) {
    console.error('Error marking chat as read:', error)
  }
}
