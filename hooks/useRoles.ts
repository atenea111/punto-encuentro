import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
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
  const [userRole, setUserRole] = useState<UserRole>({
    role: 'client',
    permissions: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUserRole()
    } else {
      setUserRole({ role: 'client', permissions: [] })
      setLoading(false)
    }
  }, [user])

  const fetchUserRole = async () => {
    try {
      setLoading(true)
      const userDoc = await getDoc(doc(db, 'users', user!.uid))
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        console.log('User data from Firestore:', userData) // Debug log
        
        // Manejar diferentes estructuras de datos
        let role = 'client'
        let permissions = []
        
        if (userData.role) {
          // Estructura normal: role como campo separado
          role = userData.role
          permissions = userData.permissions || []
        } else if (userData.permissions && typeof userData.permissions === 'object') {
          // Estructura alternativa: role dentro de permissions
          if (userData.permissions.role) {
            role = userData.permissions.role
          }
          permissions = userData.permissions.permissions || []
        }
        
        console.log('Parsed role:', role) // Debug log
        
        setUserRole({
          role: role as UserRole['role'],
          permissions: permissions,
          createdAt: userData.createdAt?.toDate(),
          updatedAt: userData.updatedAt?.toDate()
        })
      } else {
        // Crear documento de usuario con rol por defecto
        await setDoc(doc(db, 'users', user!.uid), {
          role: 'client',
          permissions: [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
        setUserRole({
          role: 'client',
          permissions: [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
      setUserRole({ role: 'client', permissions: [] })
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (newRole: UserRole['role'], newPermissions: string[] = []) => {
    if (!user) return { success: false, error: 'No user logged in' }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        role: newRole,
        permissions: newPermissions,
        updatedAt: new Date()
      })
      
      setUserRole(prev => ({
        ...prev,
        role: newRole,
        permissions: newPermissions,
        updatedAt: new Date()
      }))
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const hasPermission = (permission: string) => {
    return userRole.permissions.includes(permission)
  }

  const isAdmin = userRole.role === 'admin'
  const isProvider = userRole.role === 'provider'
  const isClient = userRole.role === 'client'

  return {
    userRole,
    loading,
    isAdmin,
    isProvider,
    isClient,
    hasPermission,
    updateUserRole,
    fetchUserRole
  }
}
