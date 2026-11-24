import { addDoc, collection, doc, FieldPath, getDoc, increment, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface StoryChatContext {
  id: string
  providerId: string
  providerName: string
  mediaUrl: string
  mediaType: 'image' | 'video'
  caption: string
  serviceId?: string
  serviceName?: string
}

export function buildChatId(userId: string, partnerId: string) {
  return [userId, partnerId].sort().join('_')
}

/** Crea el doc del chat si aún no existe (abrir chat post-reserva, etc.). */
export async function ensureChatDocument({
  sender,
  partnerId,
  partnerName,
}: {
  sender: { uid: string; displayName?: string | null; email?: string | null }
  partnerId: string
  partnerName: string
}) {
  if (!sender?.uid || !partnerId) return { success: false as const, chatId: null, error: 'Datos incompletos' }

  const chatId = buildChatId(sender.uid, partnerId)
  const chatRef = doc(db, 'chats', chatId)

  try {
    const snap = await getDoc(chatRef)
    if (snap.exists()) {
      return { success: true as const, chatId }
    }

    await setDoc(chatRef, {
      participants: [sender.uid, partnerId].sort(),
      participantNames: {
        [sender.uid]: sender.displayName || sender.email || 'Usuario',
        [partnerId]: partnerName || 'Usuario',
      },
      lastMessage: 'Conversación iniciada',
      lastMessageAt: serverTimestamp(),
      unreadCounts: {
        [sender.uid]: 0,
        [partnerId]: 0,
      },
      updatedAt: serverTimestamp(),
    })

    return { success: true as const, chatId }
  } catch (error: any) {
    console.error('Error ensuring chat document:', error)
    return { success: false as const, chatId, error: error.message || 'No se pudo abrir el chat.' }
  }
}

export async function sendChatMessage({
  sender,
  partnerId,
  partnerName,
  text,
  story,
  imageUrls,
}: {
  sender: any
  partnerId: string
  partnerName: string
  text: string
  story?: StoryChatContext
  imageUrls?: string[]
}) {
  const cleanText = text.trim()
  const photos = (imageUrls || []).filter(Boolean).slice(0, 6)
  if (!sender?.uid || !partnerId || (!cleanText && photos.length === 0)) {
    return { success: false, error: 'No se pudo enviar el mensaje.' }
  }

  const chatId = buildChatId(sender.uid, partnerId)
  const chatRef = doc(db, 'chats', chatId)
  const participants = [sender.uid, partnerId].sort()
  const lastMessage = story
    ? `Respondió una historia: ${cleanText}`
    : photos.length
      ? `${cleanText || 'Consulta con fotos'}`
      : cleanText

  try {
    const snap = await getDoc(chatRef)
    if (!snap.exists()) {
      await setDoc(chatRef, {
        lastMessage,
        lastMessageAt: serverTimestamp(),
        participants,
        participantNames: {
          [sender.uid]: sender.displayName || sender.email || 'Usuario',
          [partnerId]: partnerName,
        },
        ...(story ? { lastStoryId: story.id } : {}),
        unreadCounts: {
          [sender.uid]: 0,
          [partnerId]: 0,
        },
        updatedAt: serverTimestamp(),
      })
    } else {
      await updateDoc(chatRef, {
        lastMessage,
        lastMessageAt: serverTimestamp(),
        ...(story ? { lastStoryId: story.id } : {}),
        updatedAt: serverTimestamp(),
        [`participantNames.${sender.uid}`]: sender.displayName || sender.email || 'Usuario',
        [`participantNames.${partnerId}`]: partnerName,
      })
    }

    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      text: cleanText || (photos.length ? 'Consulta con fotos' : ''),
      senderId: sender.uid,
      senderName: sender.displayName || sender.email || 'Usuario',
      type: story ? 'story_reply' : photos.length ? 'quote' : 'text',
      ...(story ? { story } : {}),
      ...(photos.length ? { imageUrls: photos } : {}),
      createdAt: serverTimestamp(),
    })

    await updateDoc(
      chatRef,
      new FieldPath('unreadCounts', partnerId), increment(1),
      new FieldPath('unreadCounts', sender.uid), 0,
      new FieldPath('lastReadAt', sender.uid), serverTimestamp(),
    )

    return { success: true, chatId }
  } catch (error: any) {
    console.error('Error sending chat message:', error)
    return { success: false, error: error.message || 'No se pudo enviar el mensaje.' }
  }
}
