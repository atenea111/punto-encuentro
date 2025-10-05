import { useState, useEffect } from 'react'
import { 
  collection, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface AnalyticsData {
  totalUsers: number
  totalProviders: number
  totalClients: number
  totalServices: number
  totalBookings: number
  totalRevenue: number
  activeUsers: number
  inactiveUsers: number
  recentBookings: any[]
  topServices: any[]
  userGrowth: any[]
  bookingTrends: any[]
}

export function useAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalProviders: 0,
    totalClients: 0,
    totalServices: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    recentBookings: [],
    topServices: [],
    userGrowth: [],
    bookingTrends: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      // Obtener usuarios
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Obtener servicios
      const servicesSnapshot = await getDocs(collection(db, 'services'))
      const services = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Obtener reservas
      const bookingsSnapshot = await getDocs(collection(db, 'bookings'))
      const bookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Calcular estadísticas
      const totalUsers = users.length
      const totalProviders = users.filter((user: any) => user.role === 'provider').length
      const totalClients = users.filter((user: any) => user.role === 'client').length
      const totalServices = services.length
      const totalBookings = bookings.length
      const totalRevenue = bookings
        .filter((booking: any) => booking.paymentStatus === 'paid')
        .reduce((sum: number, booking: any) => sum + (booking.price || 0), 0)
      
      const activeUsers = users.filter((user: any) => user.isActive !== false).length
      const inactiveUsers = users.filter((user: any) => user.isActive === false).length
      
      // Reservas recientes (últimas 10)
      const recentBookings = bookings
        .sort((a: any, b: any) => new Date((b as any).createdAt?.toDate?.() || (b as any).createdAt).getTime() - new Date((a as any).createdAt?.toDate?.() || (a as any).createdAt).getTime())
        .slice(0, 10)
      
      // Servicios más populares
      const serviceCounts = services.reduce((acc: any, service: any) => {
        const bookingsForService = bookings.filter((booking: any) => (booking as any).serviceId === service.id)
        acc[service.name] = bookingsForService.length
        return acc
      }, {} as Record<string, number>)
      
      const topServices = Object.entries(serviceCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([name, count]) => ({ name, bookings: count }))
      
      // Crecimiento de usuarios (últimos 7 días)
      const userGrowth = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dayStart = new Date(date.setHours(0, 0, 0, 0))
        const dayEnd = new Date(date.setHours(23, 59, 59, 999))
        
        const usersOnDay = users.filter((user: any) => {
          const createdAt = (user as any).createdAt?.toDate?.() || (user as any).createdAt
          return createdAt >= dayStart && createdAt <= dayEnd
        }).length
        
        userGrowth.push({
          date: dayStart.toISOString().split('T')[0],
          users: usersOnDay
        })
      }
      
      // Tendencias de reservas (últimos 7 días)
      const bookingTrends = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dayStart = new Date(date.setHours(0, 0, 0, 0))
        const dayEnd = new Date(date.setHours(23, 59, 59, 999))
        
        const bookingsOnDay = bookings.filter((booking: any) => {
          const createdAt = booking.createdAt?.toDate?.() || booking.createdAt
          return createdAt >= dayStart && createdAt <= dayEnd
        }).length
        
        bookingTrends.push({
          date: dayStart.toISOString().split('T')[0],
          bookings: bookingsOnDay
        })
      }
      
      setAnalytics({
        totalUsers,
        totalProviders,
        totalClients,
        totalServices,
        totalBookings,
        totalRevenue,
        activeUsers,
        inactiveUsers,
        recentBookings,
        topServices,
        userGrowth,
        bookingTrends
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    analytics,
    loading,
    fetchAnalytics
  }
}
