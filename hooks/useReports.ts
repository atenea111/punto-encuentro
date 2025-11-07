import { useState, useEffect } from 'react'
import { 
  collection, 
  getDocs, 
  query, 
  where,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface DailyReport {
  date: string
  activeUsers: number
  newPublications: number
  chatsInitiated: number
  reports: number
}

export interface WeeklyReport {
  week: string
  topSearchesByCity: Array<{ city: string; searches: Array<{ term: string; count: number }> }>
  bestPerformingPromos: Array<{ id: string; name: string; performance: number }>
  worstPerformingPromos: Array<{ id: string; name: string; performance: number }>
}

export interface MonthlyReport {
  month: string
  userGrowth: number
  userRetention: number
  totalUsers: number
  returningUsers: number
  newUsers: number
  promoSummary: {
    total: number
    active: number
    completed: number
    totalRevenue: number
  }
}

export function useReports() {
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null)
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null)
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null)
  const [loading, setLoading] = useState(false)

  const generateDailyReport = async (date?: Date) => {
    try {
      setLoading(true)
      const targetDate = date || new Date()
      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(targetDate)
      endOfDay.setHours(23, 59, 59, 999)

      // Usuarios activos (que iniciaron sesión hoy)
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const users = usersSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        lastLogin: doc.data().lastLogin?.toDate?.() || doc.data().lastLogin
      }))
      const activeUsers = users.filter((user: any) => {
        if (!user.lastLogin) return false
        const lastLogin = user.lastLogin instanceof Date ? user.lastLogin : new Date(user.lastLogin)
        return lastLogin >= startOfDay && lastLogin <= endOfDay
      }).length

      // Publicaciones nuevas
      const servicesSnapshot = await getDocs(collection(db, 'services'))
      const services = servicesSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
      }))
      const newPublications = services.filter((service: any) => {
        if (!service.createdAt) return false
        const createdAt = service.createdAt instanceof Date ? service.createdAt : new Date(service.createdAt)
        return createdAt >= startOfDay && createdAt <= endOfDay
      }).length

      // Chats iniciados
      let chatsInitiated = 0
      try {
        const chatsSnapshot = await getDocs(collection(db, 'chats'))
        const chats = chatsSnapshot.docs.map(doc => ({ 
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
        }))
        chatsInitiated = chats.filter((chat: any) => {
          if (!chat.createdAt) return false
          const createdAt = chat.createdAt instanceof Date ? chat.createdAt : new Date(chat.createdAt)
          return createdAt >= startOfDay && createdAt <= endOfDay
        }).length
      } catch (error) {
        chatsInitiated = 0
      }

      // Denuncias
      const reportedPublications = services.filter((service: any) => {
        const reportedAt = service.reportedAt?.toDate?.() || service.reportedAt
        if (!reportedAt) return false
        const reportDate = reportedAt instanceof Date ? reportedAt : new Date(reportedAt)
        return reportDate >= startOfDay && reportDate <= endOfDay
      }).length

      const report: DailyReport = {
        date: targetDate.toISOString().split('T')[0],
        activeUsers,
        newPublications,
        chatsInitiated,
        reports: reportedPublications
      }

      setDailyReport(report)
      return report
    } catch (error) {
      console.error('Error generating daily report:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const generateWeeklyReport = async (weekStart?: Date) => {
    try {
      setLoading(true)
      const startDate = weekStart || new Date()
      startDate.setDate(startDate.getDate() - startDate.getDay()) // Domingo de la semana
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)

      // Búsquedas por ciudad
      const topSearchesByCity: Array<{ city: string; searches: Array<{ term: string; count: number }> }> = []
      try {
        const searchesSnapshot = await getDocs(collection(db, 'searches'))
        const searches = searchesSnapshot.docs.map(doc => ({ 
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
          city: doc.data().city || 'Sin ciudad'
        }))
        
        const weekSearches = searches.filter((search: any) => {
          if (!search.createdAt) return false
          const createdAt = search.createdAt instanceof Date ? search.createdAt : new Date(search.createdAt)
          return createdAt >= startDate && createdAt <= endDate
        })

        // Agrupar por ciudad
        const searchesByCity: Record<string, Record<string, number>> = {}
        weekSearches.forEach((search: any) => {
          const city = search.city || 'Sin ciudad'
          const term = search.term || search.query || ''
          if (!searchesByCity[city]) {
            searchesByCity[city] = {}
          }
          if (term) {
            searchesByCity[city][term] = (searchesByCity[city][term] || 0) + 1
          }
        })

        // Convertir a formato requerido
        Object.entries(searchesByCity).forEach(([city, terms]) => {
          const topSearches = Object.entries(terms)
            .map(([term, count]) => ({ term, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
          
          if (topSearches.length > 0) {
            topSearchesByCity.push({ city, searches: topSearches })
          }
        })
      } catch (error) {
        // Si no existe la colección, usar array vacío
      }

      // Promociones (asumiendo que los servicios pueden tener promociones)
      const servicesSnapshot = await getDocs(collection(db, 'services'))
      const services = servicesSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
      }))

      // Obtener reservas para calcular rendimiento
      const bookingsSnapshot = await getDocs(collection(db, 'bookings'))
      const bookings = bookingsSnapshot.docs.map(doc => ({ 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        serviceId: doc.data().serviceId
      }))

      // Calcular rendimiento de promociones (servicios con descuento o promoción)
      const promosWithPerformance = services
        .filter((service: any) => service.isPromo || service.discount || service.promoActive)
        .map((service: any) => {
          const serviceBookings = bookings.filter((booking: any) => 
            booking.serviceId === service.id &&
            booking.createdAt >= startDate &&
            booking.createdAt <= endDate
          )
          const revenue = serviceBookings
            .filter((b: any) => b.paymentStatus === 'paid')
            .reduce((sum: number, b: any) => sum + (b.price || 0), 0)
          const views = service.views || 0
          const performance = views > 0 ? (serviceBookings.length / views) * 100 : 0

          return {
            id: service.id,
            name: service.name,
            performance: performance,
            revenue,
            bookings: serviceBookings.length
          }
        })
        .sort((a, b) => b.performance - a.performance)

      const bestPerformingPromos = promosWithPerformance.slice(0, 10)
      const worstPerformingPromos = promosWithPerformance.slice(-10).reverse()

      const weekLabel = `${startDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} - ${endDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}`

      const report: WeeklyReport = {
        week: weekLabel,
        topSearchesByCity,
        bestPerformingPromos,
        worstPerformingPromos
      }

      setWeeklyReport(report)
      return report
    } catch (error) {
      console.error('Error generating weekly report:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const generateMonthlyReport = async (month?: Date) => {
    try {
      setLoading(true)
      const targetMonth = month || new Date()
      const startOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1)
      startOfMonth.setHours(0, 0, 0, 0)
      const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0)
      endOfMonth.setHours(23, 59, 59, 999)

      // Mes anterior para comparación
      const previousMonthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth() - 1, 1)
      const previousMonthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 0)

      // Usuarios
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const users = usersSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        lastLogin: doc.data().lastLogin?.toDate?.() || doc.data().lastLogin
      }))

      const currentMonthUsers = users.filter((user: any) => {
        if (!user.createdAt) return false
        const createdAt = user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt)
        return createdAt >= startOfMonth && createdAt <= endOfMonth
      })

      const previousMonthUsers = users.filter((user: any) => {
        if (!user.createdAt) return false
        const createdAt = user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt)
        return createdAt >= previousMonthStart && createdAt <= previousMonthEnd
      })

      const userGrowth = previousMonthUsers.length > 0 
        ? ((currentMonthUsers.length - previousMonthUsers.length) / previousMonthUsers.length) * 100 
        : currentMonthUsers.length > 0 ? 100 : 0

      // Usuarios que volvieron (tienen lastLogin en el mes actual pero se crearon antes)
      const returningUsers = users.filter((user: any) => {
        if (!user.lastLogin || !user.createdAt) return false
        const lastLogin = user.lastLogin instanceof Date ? user.lastLogin : new Date(user.lastLogin)
        const createdAt = user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt)
        return lastLogin >= startOfMonth && 
               lastLogin <= endOfMonth &&
               createdAt < startOfMonth
      }).length

      const totalUsers = users.length
      const newUsers = currentMonthUsers.length
      const userRetention = totalUsers > 0 ? (returningUsers / totalUsers) * 100 : 0

      // Resumen de promociones
      const servicesSnapshot = await getDocs(collection(db, 'services'))
      const services = servicesSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        isPromo: doc.data().isPromo || doc.data().promoActive || false
      }))

      const bookingsSnapshot = await getDocs(collection(db, 'bookings'))
      const bookings = bookingsSnapshot.docs.map(doc => ({ 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        serviceId: doc.data().serviceId,
        paymentStatus: doc.data().paymentStatus
      }))

      const promoServices = services.filter((s: any) => s.isPromo)
      const activePromos = promoServices.filter((s: any) => s.active !== false && s.promoActive !== false)
      const completedPromos = promoServices.filter((s: any) => {
        const endDate = s.promoEndDate?.toDate?.() || s.promoEndDate
        if (!endDate) return false
        const end = endDate instanceof Date ? endDate : new Date(endDate)
        return end < endOfMonth
      })

      const promoBookings = bookings.filter((booking: any) => {
        const service = services.find((s: any) => s.id === booking.serviceId)
        return service && service.isPromo &&
               booking.createdAt >= startOfMonth &&
               booking.createdAt <= endOfMonth
      })

      const totalRevenue = promoBookings
        .filter((b: any) => b.paymentStatus === 'paid')
        .reduce((sum: number, b: any) => sum + (b.price || 0), 0)

      const monthLabel = targetMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

      const report: MonthlyReport = {
        month: monthLabel,
        userGrowth,
        userRetention,
        totalUsers,
        returningUsers,
        newUsers,
        promoSummary: {
          total: promoServices.length,
          active: activePromos.length,
          completed: completedPromos.length,
          totalRevenue
        }
      }

      setMonthlyReport(report)
      return report
    } catch (error) {
      console.error('Error generating monthly report:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    dailyReport,
    weeklyReport,
    monthlyReport,
    loading,
    generateDailyReport,
    generateWeeklyReport,
    generateMonthlyReport
  }
}


