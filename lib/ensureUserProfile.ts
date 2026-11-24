import { doc, getDoc, setDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from '@/lib/firebase'

export type UserRole = 'client' | 'provider' | 'admin'

type EnsureOptions = {
  /** Si false, no crea el doc (solo repara perfiles incompletos). Evita pisar registro proveedor. */
  createIfMissing?: boolean
}

/**
 * Crea o repara el documento en Firestore si falta rol / foto de perfil.
 * Devuelve el rol efectivo (tras el patch) para evitar un segundo getDoc.
 */
export async function ensureUserProfile(
  user: User,
  defaultRole: UserRole = 'client',
  options: EnsureOptions = {}
): Promise<UserRole | null> {
  if (!user.uid) return null

  const createIfMissing = options.createIfMissing !== false
  const userRef = doc(db, 'users', user.uid)
  const snap = await getDoc(userRef)

  const photoURL = user.photoURL || ''

  if (!snap.exists()) {
    if (!createIfMissing) return null
    await setDoc(userRef, {
      email: user.email || '',
      displayName: user.displayName || '',
      role: defaultRole,
      permissions: [],
      isActive: true,
      ...(photoURL ? { profileImage: photoURL } : {}),
      ...(defaultRole === 'provider' ? { isVerified: false } : {}),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return defaultRole
  }

  const data = snap.data() || {}
  const patch: Record<string, unknown> = {}

  // Docs incompletos: completar role solo si falta. Nunca pisar provider↔client.
  if (!data.role && defaultRole !== 'admin') {
    patch.role = defaultRole
    if (!Array.isArray(data.permissions)) patch.permissions = []
    if (data.isActive === undefined) patch.isActive = true
    if (!data.email && user.email) patch.email = user.email
    if (!data.displayName && user.displayName) patch.displayName = user.displayName
    if (defaultRole === 'provider' && data.isVerified === undefined) {
      patch.isVerified = false
    }
  }

  if (photoURL && !data.profileImage) {
    patch.profileImage = photoURL
  }

  if (Object.keys(patch).length > 0) {
    patch.updatedAt = new Date()
    await setDoc(userRef, patch, { merge: true })
  }

  const role = (patch.role as UserRole | undefined) || data.role
  if (role === 'client' || role === 'provider' || role === 'admin') return role
  return null
}
