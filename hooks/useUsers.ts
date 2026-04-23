import { useState, useEffect } from 'react'
import { 
  collection, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  where 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface UserData {
  id: string
  email: string
  displayName?: string
  role: 'client' | 'provider' | 'admin'
  permissions: string[]
  createdAt: Date
  updatedAt: Date
  lastLogin?: Date
  isActive: boolean
  verified?: boolean
}

export function useUsers() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const usersRef = collection(db, 'users')
      const q = query(usersRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const usersData = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          email: data.email || 'Sin email',
          displayName: data.displayName || 'Sin nombre',
          role: data.role || 'client',
          permissions: data.permissions || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastLogin: data.lastLogin?.toDate(),
          isActive: data.isActive !== false,
          verified: data.verified === true
        }
      }) as UserData[]
      
      setUsers(usersData)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: UserData['role'], newPermissions: string[] = []) => {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        role: newRole,
        permissions: newPermissions,
        updatedAt: new Date()
      })
      
      setUsers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, role: newRole, permissions: newPermissions, updatedAt: new Date() }
            : user
        )
      )
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const toggleUserStatus = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId)
      if (!user) return { success: false, error: 'User not found' }

      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        isActive: !user.isActive,
        updatedAt: new Date()
      })
      
      setUsers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, isActive: !user.isActive, updatedAt: new Date() }
            : user
        )
      )
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const verifyUser = async (userId: string, status: boolean = true) => {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        verified: status,
        updatedAt: new Date()
      })
      
      setUsers(prev => 
        prev.map(u => 
          u.id === userId 
            ? { ...u, verified: status, updatedAt: new Date() }
            : u
        )
      )
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId))
      setUsers(prev => prev.filter(user => user.id !== userId))
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  const getUsersByRole = (role: UserData['role']) => {
    return users.filter(user => user.role === role)
  }

  const getActiveUsers = () => {
    return users.filter(user => user.isActive)
  }

  const getInactiveUsers = () => {
    return users.filter(user => !user.isActive)
  }

  return {
    users,
    loading,
    fetchUsers,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
    getUsersByRole,
    getActiveUsers,
    getInactiveUsers,
    verifyUser
  }
}
