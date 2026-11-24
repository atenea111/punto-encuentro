import { useState, useEffect } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './useAuth'

export interface UserRole {
  role: 'client' | 'provider' | 'admin'
  permissions: string[]
  createdAt?: Date
  updatedAt?: Date
}

export function useRoles() {
  const { user } = useAuth()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setUserRole(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (userDoc) => {
        if (!userDoc.exists()) {
          // Aún no hay perfil (registro en curso). No asumir 'client'.
          setUserRole(null)
          setLoading(false)
          return
        }

        const userData = userDoc.data() || {}
        let role: UserRole['role'] | null = null
        let permissions: string[] = []

        if (userData.role === 'client' || userData.role === 'provider' || userData.role === 'admin') {
          role = userData.role
          permissions = Array.isArray(userData.permissions) ? userData.permissions : []
        } else if (userData.permissions && typeof userData.permissions === 'object' && !Array.isArray(userData.permissions)) {
          const nested = (userData.permissions as { role?: string; permissions?: string[] }).role
          if (nested === 'client' || nested === 'provider' || nested === 'admin') {
            role = nested
          }
          permissions = Array.isArray((userData.permissions as { permissions?: string[] }).permissions)
            ? (userData.permissions as { permissions: string[] }).permissions
            : []
        }

        if (!role) {
          setUserRole(null)
          setLoading(false)
          return
        }

        setUserRole({
          role,
          permissions,
          createdAt: userData.createdAt?.toDate?.() || undefined,
          updatedAt: userData.updatedAt?.toDate?.() || undefined,
        })
        setLoading(false)
      },
      (error) => {
        console.error('Error listening user role:', error)
        setUserRole(null)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [user])

  const updateUserRole = async (newRole: UserRole['role'], newPermissions: string[] = []) => {
    if (!user) return { success: false, error: 'No user logged in' }

    try {
      await setDoc(doc(db, 'users', user.uid), {
        role: newRole,
        updatedAt: new Date()
      }, { merge: true })

      setUserRole(prev => ({
        role: newRole,
        permissions: newPermissions.length ? newPermissions : (prev?.permissions || []),
        createdAt: prev?.createdAt,
        updatedAt: new Date()
      }))

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const hasPermission = (permission: string) => {
    return userRole?.permissions.includes(permission) || false
  }

  const isAdmin = userRole?.role === 'admin'
  const isProvider = userRole?.role === 'provider'
  const isClient = userRole?.role === 'client'
  const hasRole = Boolean(userRole?.role)

  return {
    userRole: userRole || { role: 'client' as const, permissions: [] },
    loading,
    isAdmin,
    isProvider,
    isClient,
    hasRole,
    hasPermission,
    updateUserRole,
    fetchUserRole: async () => { /* compat: onSnapshot ya mantiene el rol */ },
  }
}
