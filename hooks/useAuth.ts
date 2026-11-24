import { useState, useEffect } from 'react'
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  getRedirectResult,
} from 'firebase/auth'
import { Capacitor } from '@capacitor/core'
import { SocialLogin } from '@capgo/capacitor-social-login'
import { auth } from '@/lib/firebase'
import { ensureUserProfile, type UserRole } from '@/lib/ensureUserProfile'
import { initializeGoogleAuthNative } from '@/lib/initGoogleAuthNative'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

const GOOGLE_AUTH_ROLE_KEY = 'googleAuthDefaultRole'

/** Aplica userType en localStorage a partir del rol conocido (sin otra lectura a Firestore). */
function applyUserType(role: UserRole | null | undefined, fallback?: UserRole): UserRole {
  if (role === 'provider' || role === 'client') {
    localStorage.setItem('userType', role)
    return role
  }
  if (fallback === 'provider' || fallback === 'client') {
    localStorage.setItem('userType', fallback)
    return fallback
  }
  const cached = localStorage.getItem('userType')
  if (cached === 'provider' || cached === 'client') return cached
  localStorage.setItem('userType', 'client')
  return 'client'
}

function mapAuthError(error: unknown): string {
  const message = (error as Error)?.message || ''
  const code = (error as { code?: string })?.code

  if (message.includes('[16]') || message.toLowerCase().includes('reauth failed')) {
    return 'Google no reconoce la firma de esta app. Si la instalaste desde Play Store, agrega el SHA-1 de Firma de la app (Play Console) en Firebase. Ver GUIA_GOOGLE_LOGIN.md.'
  }

  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Se canceló el inicio de sesión con Google.'
    case 'auth/account-exists-with-different-credential':
      return 'Ya existe una cuenta con ese email usando otro método de acceso.'
    case 'auth/network-request-failed':
      return 'Error de conexión. Revisá tu internet e intentá de nuevo.'
    case 'auth/argument-error':
      return 'No se pudo abrir Google en la app. Actualizá la app o contactá soporte.'
    default:
      return (error as Error)?.message || 'No se pudo iniciar sesión con Google.'
  }
}

async function signInWithGoogleNative(defaultRole: UserRole) {
  await initializeGoogleAuthNative()

  const response = await SocialLogin.login({
    provider: 'google',
    options: {
      style: 'bottom',
      filterByAuthorizedAccounts: false,
      autoSelectEnabled: false,
    },
  })

  if (response.provider !== 'google') {
    throw new Error('No se pudo completar el inicio con Google.')
  }

  const idToken =
    response.result && 'idToken' in response.result ? response.result.idToken : null

  if (!idToken) {
    throw new Error('Google no devolvió un token válido. Verificá la configuración de la app.')
  }

  const credential = GoogleAuthProvider.credential(idToken)
  const userCredential = await signInWithCredential(auth, credential)
  const role = await ensureUserProfile(userCredential.user, defaultRole)
  return { user: userCredential.user, role }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const finishRedirectSignIn = async () => {
      if (Capacitor.isNativePlatform()) return

      try {
        const result = await getRedirectResult(auth)
        if (!result?.user || cancelled) return

        const savedRole = sessionStorage.getItem(GOOGLE_AUTH_ROLE_KEY) as UserRole | null
        sessionStorage.removeItem(GOOGLE_AUTH_ROLE_KEY)

        const fallback = savedRole || 'client'
        const role = await ensureUserProfile(result.user, fallback)
        // Usuarios existentes: respetar rol en Firestore, no el del botón de login.
        applyUserType(role, fallback)
      } catch (error) {
        console.error('Error en redirect de Google:', error)
      }
    }

    finishRedirectSignIn()

    if (Capacitor.isNativePlatform()) {
      initializeGoogleAuthNative().catch((error) => {
        console.error('Error inicializando Google Auth nativo:', error)
      })
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
      // Solo reparar perfiles incompletos. No crear con 'client' acá:
      // el registro de proveedor escribe el doc y una creación concurrente lo pisaba.
      if (currentUser) {
        void (async () => {
          try {
            const role = await ensureUserProfile(currentUser, 'client', { createIfMissing: false })
            // Si ya hay userType cacheado, no lo pisamos a menos que Firestore diga otro rol.
            if (role === 'provider' || role === 'client') {
              applyUserType(role)
            }
          } catch (error) {
            console.error('Error asegurando perfil de usuario:', error)
          }
        })()
      }
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      return { success: true, user: result.user }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const role = await ensureUserProfile(result.user, 'client', { createIfMissing: false })
      applyUserType(role)
      return { success: true, user: result.user }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  }

  const signInWithGoogle = async (defaultRole: UserRole = 'client') => {
    try {
      if (Capacitor.isNativePlatform()) {
        const { user, role } = await signInWithGoogleNative(defaultRole)
        applyUserType(role, defaultRole)
        return { success: true, user, redirect: false as const }
      }

      const result = await signInWithPopup(auth, googleProvider)
      const role = await ensureUserProfile(result.user, defaultRole)
      applyUserType(role, defaultRole)
      return { success: true, user: result.user, redirect: false as const }
    } catch (error: unknown) {
      sessionStorage.removeItem(GOOGLE_AUTH_ROLE_KEY)
      return { success: false, error: mapAuthError(error) }
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message }
    }
  }

  return {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
  }
}
