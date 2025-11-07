import { useState, useEffect } from 'react'
import { 
  collection, 
  getDocs, 
  query, 
  where,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface AdminDashboardStats {
  // Usuarios
  activeUsersToday: number
  newUsersThisWeek: number
  
  // Comercios (proveedores)
  activeBusinesses: number
  businessesPendingVerification: number
  
  // Publicaciones (servicios)
  newPublications: number
  pendingPublications: number
  reportedPublications: number
  
  // Chats
  chatsInitiated: number
  
  // Búsquedas
  topSearches: Array<{ term: string; count: number }>
  
  // Alertas
  alerts: Array<{ type: string; message: string; count: number }>
}

export function useAdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats>({
    activeUsersToday: 0,
    newUsersThisWeek: 0,
    activeBusinesses: 0,
    businessesPendingVerification: 0,
    newPublications: 0,
    pendingPublications: 0,
    reportedPublications: 0,
    chatsInitiated: 0,
    topSearches: [],
    alerts: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      weekAgo.setHours(0, 0, 0, 0)

      // Obtener usuarios
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const users = usersSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        lastLogin: doc.data().lastLogin?.toDate?.() || doc.data().lastLogin,
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
      }))

      // Usuarios activos hoy (que han iniciado sesión hoy)
      const activeUsersToday = users.filter((user: any) => {
        if (!user.lastLogin) return false
        const lastLogin = user.lastLogin instanceof Date ? user.lastLogin : new Date(user.lastLogin)
        return lastLogin >= today
      }).length

      // Nuevos usuarios esta semana
      const newUsersThisWeek = users.filter((user: any) => {
        if (!user.createdAt) return false
        const createdAt = user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt)
        return createdAt >= weekAgo
      }).length

      // Obtener proveedores (comercios)
      const providers = users.filter((user: any) => user.role === 'provider')
      const activeBusinesses = providers.filter((user: any) => user.isActive !== false).length
      const businessesPendingVerification = providers.filter((user: any) => 
        !user.verified && !user.verificationStatus || user.verificationStatus === 'pending'
      ).length

      // Obtener servicios (publicaciones)
      const servicesSnapshot = await getDocs(collection(db, 'services'))
      const services = servicesSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        status: doc.data().status || 'active'
      }))

      // Publicaciones nuevas (últimas 24 horas)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const newPublications = services.filter((service: any) => {
        if (!service.createdAt) return false
        const createdAt = service.createdAt instanceof Date ? service.createdAt : new Date(service.createdAt)
        return createdAt >= yesterday
      }).length

      // Publicaciones pendientes
      const pendingPublications = services.filter((service: any) => 
        service.status === 'pending' || service.status === 'review'
      ).length

      // Publicaciones denunciadas
      const reportedPublications = services.filter((service: any) => 
        service.status === 'reported' || service.reported === true
      ).length

      // Obtener chats (si existe la colección)
      let chatsInitiated = 0
      try {
        const chatsSnapshot = await getDocs(collection(db, 'chats'))
        chatsInitiated = chatsSnapshot.docs.length
      } catch (error) {
        // Si no existe la colección, usar 0
        chatsInitiated = 0
      }

      // Obtener búsquedas del día (si existe la colección)
      let topSearches: Array<{ term: string; count: number }> = []
      try {
        const searchesSnapshot = await getDocs(collection(db, 'searches'))
        const todaySearches = searchesSnapshot.docs
          .map(doc => ({ 
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
          }))
          .filter((search: any) => {
            if (!search.createdAt) return false
            const createdAt = search.createdAt instanceof Date ? search.createdAt : new Date(search.createdAt)
            return createdAt >= today
          })

        // Contar búsquedas por término
        const searchCounts: Record<string, number> = {}
        todaySearches.forEach((search: any) => {
          const term = search.term || search.query || ''
          if (term) {
            searchCounts[term] = (searchCounts[term] || 0) + 1
          }
        })

        // Ordenar y tomar las top 5
        topSearches = Object.entries(searchCounts)
          .map(([term, count]) => ({ term, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      } catch (error) {
        // Si no existe la colección, usar array vacío
        topSearches = []
      }

      // Generar alertas
      const alerts: Array<{ type: string; message: string; count: number }> = []
      
      if (businessesPendingVerification > 0) {
        alerts.push({
          type: 'verification',
          message: 'Comercios pendientes de verificación',
          count: businessesPendingVerification
        })
      }
      
      if (pendingPublications > 0) {
        alerts.push({
          type: 'publications',
          message: 'Publicaciones pendientes de revisión',
          count: pendingPublications
        })
      }
      
      if (reportedPublications > 0) {
        alerts.push({
          type: 'reports',
          message: 'Publicaciones denunciadas',
          count: reportedPublications
        })
      }

      setStats({
        activeUsersToday,
        newUsersThisWeek,
        activeBusinesses,
        businessesPendingVerification,
        newPublications,
        pendingPublications,
        reportedPublications,
        chatsInitiated,
        topSearches,
        alerts
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    stats,
    loading,
    refresh: fetchDashboardStats
  }
}


