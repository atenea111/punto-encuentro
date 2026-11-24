"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogoText } from "@/components/logo"
import { CustomAlert } from "@/components/CustomAlert"
import { Badge } from "@/components/ui/badge"
import { useServices } from "@/hooks/useServices"
import { useBookings } from "@/hooks/useBookings"
import { useAdminDashboard } from "@/hooks/useAdminDashboard"
import { SupportCenter } from "@/components/SupportCenter"
import { useReports } from "@/hooks/useReports"
import { useCategories } from "@/hooks/useCategories"
import { useUsers } from "@/hooks/useUsers"
import { useAnalytics } from "@/hooks/useAnalytics"
import { AppIcon } from "@/components/AppIcon"
import { CategoryIcon } from "@/components/CategoryIcon"
import { AdminPushNotifications } from "@/components/AdminPushNotifications"
import { AdminPuntoBot } from "@/components/AdminPuntoBot"
import { ADMIN_BOT_EVENT, consumeAdminBotAction, peekAdminBotAction } from "@/lib/adminBotAction"
import { serviceMatchesCategory, findOfficialCategoryName, isUncategorizedService } from "@/lib/searchUtils"
import { useAdminAudit } from "@/hooks/useAdminAudit"
import { useAppSettings, type AppSettings } from "@/hooks/useAppSettings"
import { isServiceActive, serviceMatchesAdminFilter, isServiceReported } from "@/lib/serviceUtils"
import { downloadCsv } from "@/lib/adminExport"
import { syncPublicAndroidMinVersion } from "@/lib/forceUpdateConfig"
import { categorySelectLabel } from "@/lib/categoryIcons"
import { formatMoney, parseMoney } from "@/lib/formatMoney"
import {
  Users,
  TrendingUp,
  Calendar,
  LayoutDashboard,
  FolderTree,
  Wrench,
  BarChart3,
  FileText,
  Mail,
  Menu,
  PieChart,
  Shield,
  ShieldAlert,
  Bell,
  Wallet,
  Flame,
  Activity,
  CalendarCheck,
  Settings,
  Globe,
  Briefcase,
  Clock,
  AlertCircle,
  ChevronRight,
  Search,
  Plus,
  LogOut,
  Download,
  Info,
  CheckCheck,
  MapPin,
  X,
} from "lucide-react"

const AdminStatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
  <Card>
    <CardContent className="p-6 flex items-center space-x-4">
      <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
      </div>
    </CardContent>
  </Card>
)

const AdminSidebar = ({ activeTab, setActiveTab, logout }: { activeTab: string, setActiveTab: (t: string) => void, logout: () => void }) => (
  <div className="hidden md:flex flex-col w-64 bg-white border-r h-screen fixed left-0 top-0">
    <div className="p-6">
      <LogoText />
    </div>
    <nav className="flex-1 px-4 space-y-2">
      {[
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, uiIcon: 'estadisticas' as const },
        { id: 'users', label: 'Usuarios', icon: Users, uiIcon: 'usuarios' as const },
        { id: 'services', label: 'Servicios', icon: Wrench, uiIcon: 'trabajo' as const },
        { id: 'bookings', label: 'Reservas', icon: CalendarCheck, uiIcon: 'agenda' as const },
        { id: 'moderation', label: 'Denuncias', icon: ShieldAlert },
        { id: 'categories', label: 'Categorías', icon: FolderTree },
        { id: 'reports', label: 'Reportes', icon: FileText },
        { id: 'analytics', label: 'Estadísticas', icon: BarChart3, uiIcon: 'estadisticas' as const },
        { id: 'notifications', label: 'Notificaciones', icon: Bell, uiIcon: 'notificacionesActivo' as const },
        { id: 'support', label: 'Consultas', icon: Bell, uiIcon: 'notificacionesActivo' as const },
        { id: 'settings', label: 'Ajustes', icon: Settings, uiIcon: 'configuracion' as const },
      ].map((item) => (
        <Button
          key={item.id}
          variant={activeTab === item.id ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => setActiveTab(item.id)}
        >
          {'uiIcon' in item && item.uiIcon ? (
            <AppIcon name={item.uiIcon} className="w-5 h-5 mr-3" active={activeTab === item.id} />
          ) : (
            <item.icon className="w-5 h-5 mr-3" />
          )}
          {item.label}
        </Button>
      ))}
    </nav>
    <div className="p-4 border-t">
      <Button variant="ghost" className="w-full justify-start text-red-600" onClick={logout}>
        <AppIcon name="cerrarSesion" className="w-5 h-5 mr-3" />
        Cerrar sesión
      </Button>
    </div>
  </div>
)

const AdminBottomNav = ({
  activeTab,
  setActiveTab,
  onOpenMenu,
  onLogout,
}: {
  activeTab: string
  setActiveTab: (t: string) => void
  onOpenMenu: () => void
  onLogout: () => void
}) => (
  <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center p-2 z-50 pb-safe">
    {[
      { id: 'dashboard', uiIcon: 'inicio' as const },
      { id: 'users', uiIcon: 'usuarios' as const },
      { id: 'services', uiIcon: 'trabajo' as const },
      { id: 'bookings', uiIcon: 'agenda' as const },
    ].map((item) => (
      <Button
        key={item.id}
        variant="ghost"
        className={activeTab === item.id ? "text-primary" : ""}
        onClick={() => setActiveTab(item.id)}
      >
        <AppIcon name={item.uiIcon} className="w-6 h-6" active={activeTab === item.id} />
      </Button>
    ))}
    <Button variant="ghost" onClick={onOpenMenu} className={['moderation', 'categories', 'reports', 'analytics', 'notifications', 'support', 'settings'].includes(activeTab) ? 'text-primary' : ''}>
      <Menu className="w-6 h-6" />
    </Button>
    <Button variant="ghost" className="text-red-500" onClick={onLogout}>
      <AppIcon name="cerrarSesion" className="w-5 h-5" />
    </Button>
  </div>
)

export function AdminDashboard({ user, logout }: { user: any, logout: () => Promise<{ success: boolean }> }) {
  const { categories, loading: categoriesLoading, createCategory, updateCategory, deleteCategory, toggleCategoryStatus } = useCategories()
  const { services, updateService, deleteService } = useServices()
  const { bookings, updateBooking, cancelBooking } = useBookings()
  const { users, loading: usersLoading, updateUserRole, toggleUserStatus, deleteUser, getUsersByRole, verifyUser } = useUsers()
  const { analytics, loading: analyticsLoading } = useAnalytics({ autoFetch: true })
  const { stats, loading: dashboardLoading, refresh } = useAdminDashboard()
  const { settings, setSettings, loading: settingsLoading, saveSettings: persistSettings } = useAppSettings()
  const { logs: auditLogs, loading: auditLoading, refresh: refreshAudit, logAdminAction: writeAudit } = useAdminAudit(80)

  const [activeTab, setActiveTab] = useState<'dashboard' | 'categories' | 'users' | 'services' | 'bookings' | 'moderation' | 'analytics' | 'reports' | 'notifications' | 'settings' | 'support'>('dashboard')
  const [showAlerts, setShowAlerts] = useState(false)
  const [showAdminMobileMenu, setShowAdminMobileMenu] = useState(false)
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const { dailyReport, weeklyReport, monthlyReport, loading: reportsLoading, generateDailyReport, generateWeeklyReport, generateMonthlyReport } = useReports()

  // Generar informe diario automáticamente cuando se abre la pestaña de informes
  useEffect(() => {
    if (activeTab === 'reports' && reportType === 'daily' && !dailyReport && !reportsLoading) {
      generateDailyReport()
    }
  }, [activeTab, reportType, dailyReport, reportsLoading])

  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '',
    description: '',
    active: true
  })
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [editingService, setEditingService] = useState<any>(null)
  const [recategorizeTarget, setRecategorizeTarget] = useState<{ type: 'category' | 'unmatched'; category?: any } | null>(null)
  const [userFilter, setUserFilter] = useState<'all' | 'client' | 'provider' | 'admin' | 'pending'>('all')
  const [serviceFilter, setServiceFilter] = useState<'all' | 'active' | 'inactive' | 'pending' | 'reported'>('all')
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<string>('all')
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all')
  const [isProcessing, setIsProcessing] = useState(false)
  const [adminActionStatus, setAdminActionStatus] = useState<{type: 'success' | 'error', message: string} | null>(null)

  const audit = async (action: string, targetType: string, targetId: string, details?: string) => {
    if (!user?.uid) return
    await writeAudit({
      adminId: user.uid,
      adminEmail: user.email || undefined,
      action,
      targetType,
      targetId,
      details,
    })
    refreshAudit()
  }

  const handleAdminLogout = async () => {
    const result = await logout()
    if (result.success) {
      localStorage.removeItem('userType')
      window.location.reload()
    }
  }

  const handleSettingChange = (key: keyof AppSettings, value: AppSettings[keyof AppSettings]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const saveSettings = async (section: string) => {
    const result = await persistSettings(settings)
    if (result.success) {
      try {
        await syncPublicAndroidMinVersion(settings.minAndroidVersionCode || 0)
      } catch (error) {
        console.error("No se pudo publicar app_config/android:", error)
      }
      await audit('save_settings', 'settings', 'app', section)
      setAdminActionStatus({ type: 'success', message: `Configuración de ${section} guardada` })
      setTimeout(() => setAdminActionStatus(null), 3000)
    } else {
      setAdminActionStatus({ type: 'error', message: result.error || 'Error al guardar' })
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategory.name || !newCategory.icon) return

    setIsProcessing(true)
    const result = await createCategory(newCategory)
    setIsProcessing(false)
    if (result.success) {
      setNewCategory({ name: '', icon: '', description: '', active: true })
      setShowCreateCategory(false)
      setAdminActionStatus({ type: 'success', message: 'Categoría creada exitosamente' })
      setTimeout(() => setAdminActionStatus(null), 3000)
    } else {
      setAdminActionStatus({ type: 'error', message: 'Error al crear categoría' })
    }
  }

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return

    const previous = categories.find((cat) => cat.id === editingCategory.id)
    const previousName = previous?.name
    setIsProcessing(true)
    const result = await updateCategory(editingCategory.id, editingCategory)
    if (result.success && previousName && previousName !== editingCategory.name) {
      const toMigrate = services.filter((service) =>
        serviceMatchesCategory(service as Record<string, unknown>, previousName)
      )
      await Promise.all(
        toMigrate.map((service) => updateService(service.id, { category: editingCategory.name } as any))
      )
    }
    setIsProcessing(false)
    if (result.success) {
      setEditingCategory(null)
      setAdminActionStatus({ type: 'success', message: 'Categoría actualizada' })
      setTimeout(() => setAdminActionStatus(null), 3000)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      setIsProcessing(true)
      const result = await deleteCategory(id)
      setIsProcessing(false)
      if (result.success) {
        setAdminActionStatus({ type: 'success', message: 'Categoría eliminada' })
        setTimeout(() => setAdminActionStatus(null), 3000)
      }
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    setIsProcessing(true)
    const result = await updateUserRole(userId, newRole as any)
    setIsProcessing(false)
    if (result.success) {
      setEditingUser(null)
      setAdminActionStatus({ type: 'success', message: 'Rol de usuario actualizado' })
      setTimeout(() => setAdminActionStatus(null), 3000)
    }
  }

  const handleToggleUserStatus = async (userId: string) => {
    setIsProcessing(true)
    const result = await toggleUserStatus(userId)
    setIsProcessing(false)
    if (result.success) {
      setAdminActionStatus({ type: 'success', message: 'Estado del usuario actualizado' })
      setTimeout(() => setAdminActionStatus(null), 3000)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      setIsProcessing(true)
      const result = await deleteUser(userId)
      setIsProcessing(false)
      if (result.success) {
        setAdminActionStatus({ type: 'success', message: 'Usuario eliminado correctamente' })
        setTimeout(() => setAdminActionStatus(null), 3000)
      }
    }
  }

  const handleVerifyUser = async (userId: string) => {
    setIsProcessing(true)
    const result = await verifyUser(userId)
    setIsProcessing(false)
    if (result.success) {
      await audit('verify_user', 'user', userId)
      setAdminActionStatus({ type: 'success', message: 'Usuario verificado correctamente' })
      setTimeout(() => setAdminActionStatus(null), 3000)
      refresh()
    }
  }

  const handleToggleServiceActive = async (service: any) => {
    const nextActive = !isServiceActive(service)
    setIsProcessing(true)
    const result = await updateService(service.id, { active: nextActive, isActive: nextActive } as any)
    setIsProcessing(false)
    if (result.success) {
      await audit(nextActive ? 'activate_service' : 'deactivate_service', 'service', service.id, service.name)
      setAdminActionStatus({ type: 'success', message: nextActive ? 'Servicio activado' : 'Servicio desactivado' })
      setTimeout(() => setAdminActionStatus(null), 3000)
    }
  }

  const handleDeleteServiceAdmin = async (serviceId: string, serviceName?: string) => {
    if (!confirm('¿Eliminar este servicio permanentemente?')) return
    setIsProcessing(true)
    const result = await deleteService(serviceId)
    setIsProcessing(false)
    if (result.success) {
      await audit('delete_service', 'service', serviceId, serviceName)
      setAdminActionStatus({ type: 'success', message: 'Servicio eliminado' })
      setTimeout(() => setAdminActionStatus(null), 3000)
    }
  }

  const handleSaveServiceEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingService?.id) return
    setIsProcessing(true)
    const result = await updateService(editingService.id, {
      name: editingService.name,
      description: editingService.description,
      price: parseMoney(editingService.price) ?? 0,
      category: editingService.category,
      address: editingService.address,
    } as any)
    setIsProcessing(false)
    if (result.success) {
      await audit('edit_service', 'service', editingService.id, editingService.name)
      setEditingService(null)
      setAdminActionStatus({ type: 'success', message: 'Servicio actualizado' })
      setTimeout(() => setAdminActionStatus(null), 3000)
    }
  }

  const handleRecategorizeService = async (serviceId: string, categoryName: string, serviceName?: string) => {
    if (!categoryName) return
    setIsProcessing(true)
    const result = await updateService(serviceId, { category: categoryName } as any)
    setIsProcessing(false)
    if (result.success) {
      await audit('recategorize_service', 'service', serviceId, `${serviceName || serviceId} → ${categoryName}`)
      setAdminActionStatus({ type: 'success', message: `Recategorizado a ${categoryName}` })
      setTimeout(() => setAdminActionStatus(null), 3000)
    } else {
      setAdminActionStatus({ type: 'error', message: result.error || 'No se pudo recategorizar' })
    }
  }

  const handleResolveReport = async (service: any, action: 'dismiss' | 'deactivate') => {
    setIsProcessing(true)
    const payload =
      action === 'dismiss'
        ? { reported: false, status: 'active', reportReason: null }
        : { reported: false, status: 'inactive', active: false, isActive: false }
    const result = await updateService(service.id, payload as any)
    setIsProcessing(false)
    if (result.success) {
      await audit(action === 'dismiss' ? 'dismiss_report' : 'deactivate_reported_service', 'service', service.id)
      setAdminActionStatus({ type: 'success', message: action === 'dismiss' ? 'Denuncia descartada' : 'Servicio desactivado' })
      setTimeout(() => setAdminActionStatus(null), 3000)
      refresh()
    }
  }

  const handleBookingStatus = async (bookingId: string, status: 'confirmed' | 'completed' | 'cancelled') => {
    setIsProcessing(true)
    const result =
      status === 'cancelled'
        ? await cancelBooking(bookingId)
        : await updateBooking(bookingId, { status })
    setIsProcessing(false)
    if (result.success) {
      await audit(`booking_${status}`, 'booking', bookingId)
      setAdminActionStatus({ type: 'success', message: 'Reserva actualizada' })
      setTimeout(() => setAdminActionStatus(null), 3000)
    }
  }

  const exportUsersCsv = () => {
    downloadCsv(
      'usuarios-punto-encuentro.csv',
      ['Email', 'Nombre', 'Rol', 'Activo', 'Verificado'],
      users.map((u) => [
        u.email,
        u.displayName || '',
        u.role,
        u.isActive ? 'si' : 'no',
        u.verified ? 'si' : 'no',
      ])
    )
  }

  const exportBookingsCsv = () => {
    downloadCsv(
      'reservas-punto-encuentro.csv',
      ['Servicio', 'Cliente', 'Proveedor', 'Fecha', 'Hora', 'Estado', 'Precio'],
      bookings.map((b) => [
        b.serviceName,
        b.clientName,
        b.providerName,
        b.date,
        b.time,
        b.status,
        String(b.price),
      ])
    )
  }

  const exportAuditCsv = () => {
    downloadCsv(
      'auditoria-admin.csv',
      ['Fecha', 'Admin', 'Acción', 'Tipo', 'Id', 'Detalle'],
      auditLogs.map((log) => [
        log.createdAt.toLocaleString('es-AR'),
        log.adminEmail || log.adminId,
        log.action,
        log.targetType,
        log.targetId,
        log.details || '',
      ])
    )
  }

  const filteredUsers = users.filter(u => {
    if (userFilter === 'all') return true
    if (userFilter === 'pending') return !u.verified && u.role === 'provider'
    return u.role === userFilter
  })

  const officialCategoryNames = categories.map((cat) => cat.name)
  const unmatchedServices = services.filter((service) =>
    isUncategorizedService(service as Record<string, unknown>, officialCategoryNames)
  )

  const filteredServices = services.filter((service) => {
    if (!serviceMatchesAdminFilter(service as Record<string, unknown>, serviceFilter)) return false
    if (adminCategoryFilter === 'all') return true
    if (adminCategoryFilter === 'unmatched') {
      return isUncategorizedService(service as Record<string, unknown>, officialCategoryNames)
    }
    return serviceMatchesCategory(service as Record<string, unknown>, adminCategoryFilter)
  })

  const reportedServices = services.filter((service) =>
    isServiceReported(service as Record<string, unknown>)
  )

  const adminBotContext = useMemo(
    () => ({
      stats,
      alerts: stats.alerts,
      users: {
        total: users.length,
        clients: users.filter((item) => item.role === "client").length,
        providers: users.filter((item) => item.role === "provider").length,
        pendingProviders: users.filter((item) => item.role === "provider" && !item.verified).length,
      },
      bookings: {
        total: bookings.length,
        pending: bookings.filter((item) => item.status === "pending").length,
        confirmed: bookings.filter((item) => item.status === "confirmed").length,
        cancelled: bookings.filter((item) => item.status === "cancelled").length,
      },
      reports: reportedServices.slice(0, 8).map((service) => ({
        name: service.name,
        provider: service.providerName,
        category: service.category,
        reason: String((service as any).reportReason || ""),
      })),
      categories: categories.map((item) => item.name).slice(0, 20),
      cities: Array.from(new Set(services.map((service: any) => String(service.city || "").trim()).filter(Boolean))).slice(0, 15),
    }),
    [stats, users, bookings, reportedServices, categories, services]
  )

  useEffect(() => {
    const apply = () => {
      const action = peekAdminBotAction()
      if (!action) return
      if (action.type === "open_tab") {
        consumeAdminBotAction()
        setActiveTab(action.tab)
      }
      if (action.type === "draft_push") {
        setActiveTab("notifications")
      }
    }
    apply()
    window.addEventListener(ADMIN_BOT_EVENT, apply)
    return () => window.removeEventListener(ADMIN_BOT_EVENT, apply)
  }, [])

  const filteredBookings = bookings.filter((b) =>
    bookingFilter === 'all' ? true : b.status === bookingFilter
  )

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col md:flex-row">
      {/* Navegación para escritorio */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} logout={handleAdminLogout} />
      <AdminPuntoBot context={adminBotContext} />

      {/* Navegación para móvil */}
      <AdminBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMenu={() => setShowAdminMobileMenu(true)}
        onLogout={handleAdminLogout}
      />

      {showAdminMobileMenu && (
        <div className="md:hidden fixed inset-0 z-[90] bg-black/50" onClick={() => setShowAdminMobileMenu(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 space-y-2" onClick={(e) => e.stopPropagation()}>
            {[
              { id: 'moderation', label: 'Denuncias' },
              { id: 'categories', label: 'Categorías' },
              { id: 'reports', label: 'Reportes' },
              { id: 'analytics', label: 'Estadísticas' },
              { id: 'notifications', label: 'Notificaciones' },
              { id: 'support', label: 'Consultas' },
              { id: 'settings', label: 'Ajustes' },
            ].map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setActiveTab(item.id as typeof activeTab)
                  setShowAdminMobileMenu(false)
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Header Superior con Glassmorphism */}
        <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b">
          <div className="flex h-16 items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-3">
              <div className="md:hidden">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white text-xs font-black">P</div>
              </div>
              <div>
                <h1 className="text-sm md:text-lg font-bold text-gray-900 leading-none">
                  {activeTab === 'dashboard' && 'Panel de Control'}
                  {activeTab === 'users' && 'Gestión de Usuarios'}
                  {activeTab === 'services' && 'Gestión de Servicios'}
                  {activeTab === 'bookings' && 'Reservas'}
                  {activeTab === 'moderation' && 'Moderación y denuncias'}
                  {activeTab === 'categories' && 'Gestión de Categorías'}
                  {activeTab === 'reports' && 'Informes y Reportes'}
                  {activeTab === 'analytics' && 'Analíticas Avanzadas'}
                  {activeTab === 'notifications' && 'Notificaciones'}
                  {activeTab === 'support' && 'Consultas'}
                  {activeTab === 'settings' && 'Configuración Global'}
                </h1>
                <p className="hidden md:block text-[10px] text-muted-foreground mt-1 tracking-tight">Bienvenido, {user?.displayName || user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => {
                  setActiveTab('dashboard')
                  setShowAlerts(true)
                }}
              >
                <AppIcon name={stats.alerts.length > 0 ? "notificacionesActivo" : "notificacionesInactivo"} className="h-5 w-5" />
                {stats.alerts.length > 0 && (
                  <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
                )}
              </Button>
              <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                {(user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'A').toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Área de Contenido */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
          {adminActionStatus && (
            <div className="mb-6 animate-in slide-in-from-top duration-300">
               <CustomAlert 
                type={adminActionStatus.type}
                title={adminActionStatus.type === 'success' ? 'Éxito' : 'Error'}
                message={adminActionStatus.message}
                onClose={() => setAdminActionStatus(null)}
               />
            </div>
          )}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 md:space-y-6">
            {dashboardLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando estadísticas...</p>
              </div>
            ) : (
              <>
                {/* Botón de Alertas */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => refresh()} disabled={dashboardLoading}>
                    Actualizar
                  </Button>
                  <Button
                    onClick={() => setShowAlerts(!showAlerts)}
                    variant={stats.alerts.length > 0 ? "default" : "outline"}
                    className="relative"
                  >
                    🔔 Alertas
                    {stats.alerts.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                        {stats.alerts.reduce((sum, alert) => sum + alert.count, 0)}
                      </span>
                    )}
                  </Button>
                </div>

                <Card className="border-none shadow-sm bg-white overflow-hidden">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">Punto Admin</p>
                      <p className="text-sm text-muted-foreground">Resumen del día, denuncias y borrador de notificaciones. Siempre revisás vos antes de enviar.</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => window.dispatchEvent(new CustomEvent("pe:open-admin-bot", { detail: "¿Qué debo atender hoy en el panel? Priorizá alertas y denuncias." }))}
                    >
                      Pedir resumen
                    </Button>
                  </CardContent>
                </Card>

                {/* Panel de Alertas */}
                {showAlerts && (
                  <Card className={stats.alerts.length > 0 ? "border-yellow-200 bg-yellow-50" : "border-gray-200 bg-gray-50"}>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3">⚠️ Alertas que necesitan atención</h3>
                      {stats.alerts.length > 0 ? (
                        <div className="space-y-2">
                          {stats.alerts.map((alert, index) => (
                            <button 
                              key={index} 
                              onClick={() => {
                                if (alert.type === 'verification') {
                                  setActiveTab('users')
                                  setUserFilter('pending' as any)
                                } else if (alert.type === 'publications') {
                                  setActiveTab('services')
                                  setServiceFilter('pending' as any)
                                } else if (alert.type === 'reports') {
                                  setActiveTab('services')
                                  setServiceFilter('reported' as any)
                                }
                                setShowAlerts(false)
                              }}
                              className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${
                                  alert.type === 'verification' ? 'bg-blue-50 text-blue-600' :
                                  alert.type === 'reports' ? 'bg-red-50 text-red-600' :
                                  'bg-orange-50 text-orange-600'
                                }`}>
                                  <AlertCircle className="h-4 w-4" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">{alert.message}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 bg-red-100 text-red-800 text-[10px] font-black rounded-full">
                                  {alert.count}
                                </span>
                                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors" />
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">✅ No hay alertas pendientes</p>
                      )}
                    </CardContent>
                  </Card>
                )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              <AdminStatCard 
                title="Usuarios Activos" 
                value={stats.activeUsersToday} 
                icon={Users} 
                color="bg-blue-500" 
              />
              <AdminStatCard 
                title="Nuevos Usuarios" 
                value={stats.newUsersThisWeek} 
                icon={Plus} 
                color="bg-green-500" 
              />
              <AdminStatCard 
                title="Comercios" 
                value={stats.activeBusinesses} 
                icon={Briefcase} 
                color="bg-purple-500" 
              />
              <AdminStatCard 
                title="Pendientes" 
                value={stats.businessesPendingVerification} 
                icon={Clock} 
                color="bg-orange-500" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <AdminStatCard 
                title="Publicaciones (24h)" 
                value={stats.newPublications} 
                icon={FileText} 
                color="bg-indigo-500" 
              />
              <AdminStatCard 
                title="Pend. revisión" 
                value={stats.pendingPublications} 
                icon={Clock} 
                color="bg-amber-500" 
              />
              <AdminStatCard 
                title="Reportadas" 
                value={stats.reportedPublications} 
                icon={Shield} 
                color="bg-red-500" 
              />
              <AdminStatCard 
                title="Chats" 
                value={stats.chatsInitiated} 
                icon={Mail} 
                color="bg-teal-500" 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-8">
              {/* Alertas Premium */}
              <Card className={`border-none shadow-sm ${stats.alerts.length > 0 ? 'bg-orange-50/50' : 'bg-white'}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                       <AppIcon name={stats.alerts.length > 0 ? "notificacionesActivo" : "notificacionesInactivo"} className="h-5 w-5" />
                       Alertas del Sistema
                    </h3>
                    <Badge variant={stats.alerts.length > 0 ? "destructive" : "outline"}>
                      {stats.alerts.length} pendientes
                    </Badge>
                  </div>
                  {stats.alerts.length > 0 ? (
                    <div className="space-y-3">
                      {stats.alerts.map((alert, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white border border-orange-100 rounded-xl shadow-sm">
                          <span className="text-sm font-medium text-gray-700">{alert.message}</span>
                          <Badge variant="destructive" className="rounded-lg">
                            {alert.count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                       <p className="text-sm text-muted-foreground">Sistema saludable. No hay alertas.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Búsquedas Premium */}
              <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    Búsquedas Populares (Hoy)
                  </h3>
                  {stats.topSearches.length > 0 ? (
                    <div className="space-y-2">
                      {stats.topSearches.slice(0, 5).map((search, index) => (
                        <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-primary bg-primary/10 w-6 h-6 rounded-lg flex items-center justify-center">
                              {index + 1}
                            </span>
                            <span className="text-sm font-medium text-gray-700">{search.term}</span>
                          </div>
                          <span className="text-xs font-bold text-gray-400">{search.count} veces</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-8">Sin actividad registrada.</p>
                  )}
                </CardContent>
              </Card>
            </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="hidden md:block">
                <h2 className="text-xl font-bold text-gray-900 leading-none">Gestión de Categorías</h2>
                <p className="text-xs text-muted-foreground mt-1">Administra los rubros y recategorizá proveedores</p>
              </div>
              <Button 
                onClick={() => setShowCreateCategory(true)}
                className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Categoría
              </Button>
            </div>

            {unmatchedServices.length > 0 && (
              <button
                type="button"
                onClick={() => setRecategorizeTarget({ type: 'unmatched' })}
                className="w-full text-left bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 hover:bg-amber-100/70 transition-colors"
              >
                <div>
                  <p className="text-sm font-bold text-amber-900">
                    {unmatchedServices.length} servicio{unmatchedServices.length === 1 ? '' : 's'} sin categoría oficial
                  </p>
                  <p className="text-xs text-amber-800 mt-0.5">
                    No coinciden con ningún rubro (nombre distinto, acentos o categoría vieja). Tocá para recategorizarlos.
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-amber-700 flex-shrink-0" />
              </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {categoriesLoading ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center">
                   <div className="relative w-12 h-12">
                      <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                   </div>
                   <p className="mt-4 text-sm font-medium text-gray-500">Cargando categorías...</p>
                </div>
              ) : (
                categories.map(category => (
                  <Card key={category.id} className="group border-none shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden bg-white">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center overflow-hidden p-1 shadow-inner group-hover:scale-110 transition-transform">
                            <CategoryIcon name={category.name} icon={category.icon} className="w-full h-full" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 truncate">{category.name}</h3>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {services.filter((s) => serviceMatchesCategory(s as Record<string, unknown>, category.name)).length} servicios
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                               <Badge variant={category.active ? "success" : "outline"} className="text-[10px] h-4">
                                 {category.active ? 'Activa' : 'Inactiva'}
                               </Badge>
                               {category.isBase && (
                                 <Badge variant="secondary" className="text-[10px] h-4 bg-primary/10 text-primary border-none">
                                   BASE
                                 </Badge>
                               )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingCategory(category)}
                            className="h-8 w-8 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5"
                          >
                            <AppIcon name="configuracion" className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteCategory(category.id)}
                            className="h-8 w-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <LogOut className="h-4 w-4" /> {/* Usando LogOut como icono de borrar temporalmente o similar */}
                          </Button>
                        </div>
                      </div>
                      
                      {category.description && (
                        <p className="text-xs text-gray-500 mt-4 line-clamp-2 leading-relaxed h-8">
                          {category.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 mt-5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleCategoryStatus(category.id)}
                          className={`text-[11px] font-bold h-9 rounded-xl ${
                            category.active 
                              ? 'text-gray-600 hover:bg-gray-50' 
                              : 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'
                          }`}
                        >
                          {category.active ? 'Desactivar' : 'Reactivar'}
                        </Button>
                        <Button
                           variant="ghost"
                           size="sm"
                           className="text-[11px] font-bold h-9 rounded-xl text-primary hover:bg-primary/5"
                           onClick={() => setRecategorizeTarget({ type: 'category', category })}
                        >
                          Recategorizar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="hidden md:block">
                <h2 className="text-xl font-bold text-gray-900 leading-none">Control de Usuarios</h2>
                <p className="text-xs text-muted-foreground mt-1">Gestión centralizada de cuentas y accesos</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={exportUsersCsv} className="rounded-xl">
                  <Download className="h-4 w-4 mr-1" /> Exportar CSV
                </Button>
              </div>
              
              {/* Nota Informativa sobre aprobación automática */}
              <div className="flex-1 max-w-md mx-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-3">
                  <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                    <Info className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-blue-900 leading-tight">Aprobación Automática</p>
                    <p className="text-[10px] text-blue-700 mt-0.5 leading-snug">
                      Los usuarios se activan automáticamente al registrarse. Puedes suspender cualquier cuenta de forma manual si es necesario.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                {[
                  { id: 'all', label: 'Todos', count: users.length },
                  { id: 'client', label: 'Clientes', count: users.filter(u => u.role === 'client').length },
                  { id: 'provider', label: 'Proveedores', count: users.filter(u => u.role === 'provider').length },
                  { id: 'pending', label: 'Pendientes', count: users.filter(u => u.role === 'provider' && !u.verified).length }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setUserFilter(filter.id as any)}
                    className={`px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                      userFilter === filter.id 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span>{filter.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${
                      userFilter === filter.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {filter.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de usuarios - Mobile Cards */}
            <div className="md:hidden space-y-4">
              {usersLoading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                   <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                filteredUsers.map(user => (
                  <Card key={user.id} className="border-none shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                            {(user.displayName?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{user.displayName || 'Sin nombre'}</p>
                            <p className="text-[10px] text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[9px] uppercase ${
                          user.role === 'admin' ? 'border-primary text-primary' : 
                          user.role === 'provider' ? 'border-purple-200 text-purple-700' : 
                          'border-blue-200 text-blue-700'
                        }`}>
                          {user.role}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        {user.role === 'provider' && !user.verified && (
                          <Button size="sm" variant="outline" className="h-8 text-[10px] rounded-lg bg-blue-50 text-blue-600 border-blue-100" onClick={() => handleVerifyUser(user.id)}>
                            Verificar
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="h-8 text-[10px] rounded-lg" onClick={() => setEditingUser(user)}>
                          Editar
                        </Button>
                        <Button size="sm" variant="outline" className={`h-8 text-[10px] rounded-lg ${!user.isActive ? 'text-green-600' : 'text-orange-600'}`} onClick={() => handleToggleUserStatus(user.id)}>
                          {!user.isActive ? 'Activar' : 'Suspender'}
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-[10px] rounded-lg text-red-600" onClick={() => handleDeleteUser(user.id)}>
                          Borrar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Lista de usuarios - Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Rol</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-400 overflow-hidden">
                             {user.photoURL ? <img src={user.photoURL} alt="" /> : (user.displayName?.charAt(0) || 'U').toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 leading-none">{user.displayName || 'Sin nombre'}</p>
                            <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-none font-bold text-[10px]">
                          {user.role?.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-xs font-medium text-gray-600">
                            {user.isActive ? 'Activo' : 'Suspendido'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {user.role === 'provider' && !user.verified && (
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-blue-400 hover:text-blue-600" onClick={() => handleVerifyUser(user.id)} title="Verificar comercio">
                               <CheckCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => setEditingUser(user)}>
                            <AppIcon name="configuracion" className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-orange-400 hover:text-orange-600" onClick={() => handleToggleUserStatus(user.id)} title={user.isActive ? 'Suspender' : 'Activar'}>
                             {user.isActive ? <ShieldAlert className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-red-400 hover:text-red-600" onClick={() => handleDeleteUser(user.id)} title="Borrar">
                             <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="hidden md:block">
                <h2 className="text-xl font-bold text-gray-900 leading-none">Gestión de Servicios</h2>
                <p className="text-xs text-muted-foreground mt-1">Supervisión de la oferta de servicios activa</p>
              </div>
              <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'active', label: 'Activos' },
                  { id: 'inactive', label: 'Inactivos' },
                  { id: 'pending', label: 'Pendientes' },
                  { id: 'reported', label: 'Denunciados' }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setServiceFilter(filter.id as any)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                      serviceFilter === filter.id 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <select
                value={adminCategoryFilter}
                onChange={(e) => setAdminCategoryFilter(e.target.value)}
                className="h-10 px-3 rounded-xl border border-gray-100 bg-white text-xs font-bold text-gray-700"
              >
                <option value="all">Todas las categorías</option>
                <option value="unmatched">Sin categoría oficial ({unmatchedServices.length})</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{categorySelectLabel(cat.name, cat.icon)}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredServices.map(service => (
                <Card key={service.id} className="border-none shadow-sm group hover:shadow-md transition-all overflow-hidden bg-white">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center overflow-hidden p-1 shadow-inner">
                        <CategoryIcon name={service.category} icon={categories.find((c) => c.name === service.category)?.icon} className="w-full h-full" />
                      </div>
                      <Badge variant={isServiceActive(service as Record<string, unknown>) ? "default" : "destructive"} className="text-[10px]">
                        {isServiceActive(service as Record<string, unknown>) ? 'ACTIVO' : 'INACTIVO'}
                      </Badge>
                    </div>
                    
                    <h3 className="font-bold text-gray-900 truncate mb-1">{service.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 h-8 leading-relaxed">
                      {service.description}
                    </p>
                    {isServiceReported(service as Record<string, unknown>) && (
                      <Badge variant="destructive" className="mt-2 text-[9px]">DENUNCIADO</Badge>
                    )}
                    
                    <div className="mt-6 pt-4 border-t border-gray-50 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-medium">Proveedor</span>
                        <span className="font-bold text-gray-700 truncate max-w-[150px]">{service.providerName}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-medium">Categoría</span>
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-none px-1.5 h-5 text-[9px] font-bold">
                          {(service.category || 'SIN RUBRO').toUpperCase()}
                        </Badge>
                      </div>
                      {isUncategorizedService(service as Record<string, unknown>, officialCategoryNames) && (
                        <p className="text-[10px] text-amber-700 font-medium">Este rubro no coincide con ninguna categoría oficial.</p>
                      )}
                      <select
                        value={findOfficialCategoryName(service.category, officialCategoryNames) || ''}
                        disabled={isProcessing}
                        onChange={(e) => handleRecategorizeService(service.id, e.target.value, service.name)}
                        className="w-full h-9 px-2 rounded-lg border border-gray-100 bg-gray-50 text-[11px] font-bold text-gray-700"
                      >
                        <option value="" disabled>Elegir categoría oficial</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>{categorySelectLabel(cat.name, cat.icon)}</option>
                        ))}
                      </select>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-medium text-xs">Precio</span>
                        <span className="text-lg font-black text-primary">{formatMoney(service.price)}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-6">
                      <Button variant="outline" size="sm" className="rounded-xl h-10 font-bold text-xs" onClick={() => setEditingService({ ...service, price: service.price })}>
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-xl h-10 font-bold text-xs" onClick={() => handleToggleServiceActive(service)} disabled={isProcessing}>
                        {isServiceActive(service as Record<string, unknown>) ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-xl h-10 font-bold text-xs text-red-600 hover:bg-red-50 col-span-2" onClick={() => handleDeleteServiceAdmin(service.id, service.name)} disabled={isProcessing}>
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Reservas</h2>
                <p className="text-xs text-muted-foreground">Todas las reservas de la plataforma</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={exportBookingsCsv} className="rounded-xl">
                  <Download className="h-4 w-4 mr-1" /> Exportar CSV
                </Button>
                {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setBookingFilter(status)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg ${bookingFilter === status ? 'bg-primary text-white' : 'bg-white border text-gray-500'}`}
                  >
                    {status === 'all' ? 'Todas' : status}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {filteredBookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No hay reservas con este filtro.</p>
              ) : (
                filteredBookings.map((booking) => (
                  <Card key={booking.id} className="border-none shadow-sm">
                    <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <p className="font-bold text-gray-900">{booking.serviceName}</p>
                        <p className="text-xs text-gray-500">{booking.clientName} → {booking.providerName}</p>
                        <p className="text-xs text-gray-500 mt-1">{booking.date} {booking.time} · {formatMoney(booking.price)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{booking.status}</Badge>
                        {booking.status === 'pending' && (
                          <Button size="sm" onClick={() => handleBookingStatus(booking.id, 'confirmed')} disabled={isProcessing}>Confirmar</Button>
                        )}
                        {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleBookingStatus(booking.id, 'completed')} disabled={isProcessing}>Completar</Button>
                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleBookingStatus(booking.id, 'cancelled')} disabled={isProcessing}>Cancelar</Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'moderation' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Denuncias</h2>
              <p className="text-xs text-muted-foreground">Servicios reportados por usuarios</p>
            </div>
            {reportedServices.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No hay denuncias pendientes.</CardContent></Card>
            ) : (
              reportedServices.map((service) => (
                <Card key={service.id} className="border-red-100">
                  <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="font-bold">{service.name}</p>
                      <p className="text-xs text-gray-500">{service.providerName} · {service.category}</p>
                      {(service as any).reportReason && (
                        <p className="text-xs text-red-600 mt-1">Motivo: {(service as any).reportReason}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleResolveReport(service, 'dismiss')} disabled={isProcessing}>Descartar</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleResolveReport(service, 'deactivate')} disabled={isProcessing}>Desactivar servicio</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="hidden md:block">
                <h2 className="text-xl font-bold text-gray-900 leading-none">Informes de Actividad</h2>
                <p className="text-xs text-muted-foreground mt-1">Reportes detallados por período</p>
              </div>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                {[
                  { id: 'daily', label: 'Diario', icon: Clock },
                  { id: 'weekly', label: 'Semanal', icon: Calendar },
                  { id: 'monthly', label: 'Mensual', icon: BarChart3 }
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setReportType(type.id as any)
                      if(type.id === 'daily') generateDailyReport()
                      if(type.id === 'weekly') generateWeeklyReport()
                      if(type.id === 'monthly') generateMonthlyReport()
                    }}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                      reportType === type.id 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <type.icon className="h-3 w-3" />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {reportsLoading ? (
              <div className="py-20 flex flex-col items-center justify-center">
                 <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                 <p className="mt-4 text-sm text-gray-500">Generando reporte...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Informe Diario */}
                {reportType === 'daily' && dailyReport && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <AdminStatCard title="Usuarios Activos" value={dailyReport.activeUsers} icon={Users} color="bg-blue-500" />
                    <AdminStatCard title="Nuevas Publicaciones" value={dailyReport.newPublications} icon={FileText} color="bg-green-500" />
                    <AdminStatCard title="Chats Iniciados" value={dailyReport.chatsInitiated} icon={Mail} color="bg-purple-500" />
                    <AdminStatCard title="Denuncias" value={dailyReport.reports} icon={Shield} color="bg-red-500" />
                  </div>
                )}

                {/* Informe Semanal */}
                {reportType === 'weekly' && weeklyReport && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-none shadow-sm">
                      <CardContent className="p-6">
                         <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                           <MapPin className="h-4 w-4 text-primary" /> Búsquedas por Ciudad
                         </h3>
                         <div className="space-y-6">
                           {weeklyReport.topSearchesByCity.map((cityData, index) => (
                             <div key={index} className="space-y-3">
                               <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-gray-700">{cityData.city}</span>
                                  <Badge variant="secondary" className="text-[10px]">{cityData.searches.reduce((a,b) => a + b.count, 0)} total</Badge>
                               </div>
                               <div className="space-y-2">
                                 {cityData.searches.slice(0, 3).map((s, i) => (
                                   <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-xs">
                                      <span className="text-gray-600">#{i+1} {s.term}</span>
                                      <span className="font-bold text-gray-400">{s.count}</span>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           ))}
                         </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm h-fit">
                       <CardContent className="p-6">
                          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" /> Rendimiento de Promos
                          </h3>
                          <div className="space-y-4">
                            <div className="p-4 bg-green-50/50 rounded-2xl border border-green-100">
                               <p className="text-[10px] font-black text-green-600 uppercase tracking-wider mb-3">Top Rendimiento</p>
                               {weeklyReport.bestPerformingPromos.slice(0, 3).map((p, i) => (
                                 <div key={i} className="flex items-center justify-between mb-2 last:mb-0">
                                   <span className="text-xs font-bold text-gray-700 truncate">{p.name}</span>
                                   <span className="text-xs font-black text-green-600">{p.performance.toFixed(1)}%</span>
                                 </div>
                               ))}
                            </div>
                            <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100">
                               <p className="text-[10px] font-black text-red-600 uppercase tracking-wider mb-3">Bajo Rendimiento</p>
                               {weeklyReport.worstPerformingPromos.slice(0, 3).map((p, i) => (
                                 <div key={i} className="flex items-center justify-between mb-2 last:mb-0">
                                   <span className="text-xs font-bold text-gray-700 truncate">{p.name}</span>
                                   <span className="text-xs font-black text-red-600">{p.performance.toFixed(1)}%</span>
                                 </div>
                               ))}
                            </div>
                          </div>
                       </CardContent>
                    </Card>
                  </div>
                )}

                {/* Informe Mensual */}
                {reportType === 'monthly' && monthlyReport && (
                  <div className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-none shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
                           <CardContent className="p-6">
                              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Crecimiento</p>
                              <h4 className="text-3xl font-black text-gray-900">{monthlyReport.userGrowth > 0 ? '+' : ''}{monthlyReport.userGrowth.toFixed(1)}%</h4>
                              <p className="text-[10px] text-gray-500 mt-2">Comparado con el mes anterior</p>
                           </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm">
                           <CardContent className="p-6">
                              <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-1">Retención</p>
                              <h4 className="text-3xl font-black text-gray-900">{monthlyReport.userRetention.toFixed(1)}%</h4>
                              <p className="text-[10px] text-gray-500 mt-2">{monthlyReport.returningUsers} usuarios recurrentes</p>
                           </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm">
                           <CardContent className="p-6">
                              <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Ingresos</p>
                              <h4 className="text-3xl font-black text-gray-900">{formatMoney(monthlyReport.promoSummary.totalRevenue)}</h4>
                              <p className="text-[10px] text-gray-500 mt-2">Generados por promociones</p>
                           </CardContent>
                        </Card>
                     </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="hidden md:block">
              <h2 className="text-xl font-bold text-gray-900 leading-none">Analíticas Avanzadas</h2>
              <p className="text-xs text-muted-foreground mt-1">Monitoreo de KPIs y rendimiento de la plataforma</p>
            </div>
            
            {/* Métricas principales mejoradas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <AdminStatCard title="Usuarios Totales" value={analytics.activeUsers + analytics.inactiveUsers} icon={Users} color="bg-primary" />
              <AdminStatCard title="Reservas" value={analytics.totalBookings} icon={Calendar} color="bg-blue-500" />
              <AdminStatCard title="Ingresos" value={formatMoney(analytics.totalRevenue)} icon={Wallet} color="bg-green-500" />
              <AdminStatCard title="Tickets" value={analytics.reportedPublications} icon={ShieldAlert} color="bg-orange-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Servicios más populares */}
               <Card className="border-none shadow-sm lg:col-span-1">
                 <CardContent className="p-6">
                   <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                     <Flame className="h-4 w-4 text-orange-500" /> Servicios Populares
                   </h3>
                   <div className="space-y-4">
                     {analytics.topServices.map((service, index) => (
                       <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-colors">
                         <div className="flex items-center gap-3">
                           <span className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">{index + 1}</span>
                           <span className="text-sm font-bold text-gray-700 truncate max-w-[120px]">{service.name}</span>
                         </div>
                         <Badge variant="secondary" className="bg-primary/5 text-primary border-none font-bold">{service.bookings}</Badge>
                       </div>
                     ))}
                   </div>
                 </CardContent>
               </Card>

               {/* Reservas recientes */}
               <Card className="border-none shadow-sm lg:col-span-2">
                 <CardContent className="p-6">
                   <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                     <Activity className="h-4 w-4 text-blue-500" /> Actividad Reciente
                   </h3>
                   <div className="space-y-3">
                     {analytics.recentBookings.length > 0 ? (
                       analytics.recentBookings.slice(0, 6).map((booking, index) => (
                         <div key={index} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                           <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                <CalendarCheck className="h-5 w-5 text-gray-400" />
                             </div>
                             <div>
                               <p className="text-sm font-bold text-gray-900">{booking.serviceName}</p>
                               <p className="text-[10px] text-gray-500">Cliente: {booking.clientName}</p>
                             </div>
                           </div>
                           <div className="text-right">
                             <p className="text-sm font-black text-primary">{formatMoney(booking.price)}</p>
                             <Badge className="text-[9px] h-4 mt-1 bg-green-100 text-green-700 border-none">{booking.status.toUpperCase()}</Badge>
                           </div>
                         </div>
                       ))
                     ) : (
                       <div className="py-12 flex flex-col items-center justify-center text-center">
                          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                             <TrendingUp className="h-6 w-6 text-gray-300" />
                          </div>
                          <p className="text-sm font-medium text-gray-400 italic">Aún no hay reservas registradas</p>
                       </div>
                     )}
                   </div>
                 </CardContent>
               </Card>
            </div>

            {/* Mapa de Calor de Interacciones */}
            <Card className="border-none shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm border border-white/20">
               <CardContent className="p-6 md:p-8">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                   <div>
                     <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                       <Flame className="h-5 w-5 text-orange-500 animate-pulse" /> Mapa de Calor de la Aplicación
                     </h3>
                     <p className="text-xs text-muted-foreground mt-1">Zonas de mayor interacción y clicks de los clientes</p>
                   </div>
                   <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">En Tiempo Real</span>
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Visualización tipo Heatmap List */}
                    <div className="space-y-6">
                       {(() => {
                         const heatmapData = [
                           { key: 'buscador', area: "Buscador de Servicios", color: "bg-red-500" },
                           { key: 'reserva_btn', area: "Botón 'Confirmar Turno'", color: "bg-orange-500" },
                           { key: 'categorias', area: "Filtros de Categoría", color: "bg-yellow-400" },
                           { key: 'perfil_proveedor', area: "Perfil de Proveedor", color: "bg-green-400" },
                           { key: 'galeria', area: "Galería de Imágenes", color: "bg-blue-400" },
                         ].map(item => ({
                           ...item,
                           clicks: analytics.interactions?.[item.key] || 0
                         }))

                         const totalClicks = heatmapData.reduce((sum, item) => sum + item.clicks, 0)
                         if (totalClicks === 0) {
                            return (
                               <div className="h-full flex flex-col items-center justify-center py-20 bg-gray-50/30 rounded-[2rem] border border-dashed border-gray-200">
                                  <Flame className="h-10 w-10 text-gray-200 mb-4" />
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aún no hay datos para mostrar</p>
                                  <p className="text-[10px] text-gray-300 mt-1">Las interacciones aparecerán pronto</p>
                               </div>
                            )
                         }

                         const maxClicks = Math.max(...heatmapData.map(d => d.clicks), 1)

                         return heatmapData.map((item, i) => (
                           <div key={i} className="space-y-2 group">
                              <div className="flex justify-between items-center">
                                 <span className="text-sm font-bold text-gray-700">{item.area}</span>
                                 <span className="text-[10px] font-black text-gray-400 uppercase">{item.clicks.toLocaleString()} clicks</span>
                              </div>
                              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                 <div 
                                   className={`h-full ${item.color} rounded-full transition-all duration-1000 group-hover:brightness-110`}
                                   style={{ width: `${(item.clicks / maxClicks) * 100}%` }}
                                 />
                              </div>
                           </div>
                         ))
                       })()}
                    </div>

                    {/* Insights de Comportamiento */}
                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-[2rem] border border-gray-100">
                       <h4 className="text-sm font-bold text-gray-900 mb-6">🎯 Puntos Calientes (Insights)</h4>
                       <div className="space-y-4">
                          {(() => {
                             const totalClicks = Object.values(analytics.interactions || {}).reduce((a, b) => (a as number) + (b as number), 0);
                             
                             if (totalClicks === 0) {
                                return (
                                   <div className="py-20 text-center">
                                      <p className="text-xs font-bold text-gray-400 animate-pulse">ESPERANDO DATOS...</p>
                                   </div>
                                )
                             }

                             const convRate = analytics.interactions?.reserva_btn 
                               ? ((analytics.totalBookings / analytics.interactions.reserva_btn) * 100).toFixed(1) 
                               : "0";
                             
                             const topInt = Object.entries(analytics.interactions || {})
                               .sort(([,a], [,b]) => (b as number) - (a as number))[0] || ["-", 0];

                             const lowInt = Object.entries(analytics.interactions || {})
                               .filter(([k]) => k !== 'lastUpdated')
                               .sort(([,a], [,b]) => (a as number) - (b as number))[0] || ["-", 0];

                             return (
                               <>
                                 <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100/50">
                                   <p className="text-xs font-bold text-red-700">Tasa de Conversión</p>
                                   <p className="text-[10px] text-red-600 mt-1">
                                     Solo el {convRate}% de los que presionan 'Confirmar Turno' concretan la reserva. Considera simplificar el flujo de pago.
                                   </p>
                                 </div>
                                 <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                                   <p className="text-xs font-bold text-orange-700">Mayor Interacción</p>
                                   <p className="text-[10px] text-orange-600 mt-1">
                                     La sección '{topInt[0].replace('_', ' ')}' es la más usada con {topInt[1]} clicks reales.
                                   </p>
                                 </div>
                                 <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                   <p className="text-xs font-bold text-blue-700">Zona Fría (Alerta)</p>
                                   <p className="text-[10px] text-blue-600 mt-1">
                                     '{lowInt[0].replace('_', ' ')}' tiene la menor tasa de interacción ({lowInt[1]} clicks). Podría necesitar una mejor ubicación visual.
                                   </p>
                                 </div>
                               </>
                             )
                          })()}
                       </div>
                    </div>
                 </div>
               </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'support' && <SupportCenter uid={user.uid} admin />}
        {activeTab === 'notifications' && (
          <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
            <div className="hidden md:block">
              <h2 className="text-xl font-bold text-gray-900 leading-none">Notificaciones push</h2>
              <p className="text-xs text-muted-foreground mt-1">Avisos a todos, por zona o por categoría</p>
            </div>
            <AdminPushNotifications
              adminId={user?.uid || ""}
              categories={categories}
              knownCities={services.map((service: any) => String(service.city || "")).filter(Boolean)}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="hidden md:block">
              <h2 className="text-xl font-bold text-gray-900 leading-none">Configuración General</h2>
              <p className="text-xs text-muted-foreground mt-1">Personalización y parámetros del sistema</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20 md:pb-0">
              {/* Aplicación */}
              <Card className="border-none shadow-sm overflow-hidden bg-white">
                <CardContent className="p-0">
                  <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      <AppIcon name="configuracion" className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-sm text-gray-900">Aplicación</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                       <Label className="text-xs font-bold text-gray-500">Nombre del Sitio</Label>
                       <Input value={settings.appName} onChange={(e) => handleSettingChange('appName', e.target.value)} className="rounded-xl border-gray-100 focus:ring-primary h-11" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-xs font-bold text-gray-500">Descripción SEO</Label>
                       <Input value={settings.appDescription} onChange={(e) => handleSettingChange('appDescription', e.target.value)} className="rounded-xl border-gray-100 h-11" />
                    </div>
                    <Button onClick={() => saveSettings('aplicación')} className="w-full rounded-xl h-11 font-bold">Actualizar Datos</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Notificaciones */}
              <Card className="border-none shadow-sm overflow-hidden bg-white">
                <CardContent className="p-0">
                  <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      <AppIcon name="notificacionesActivo" className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-sm text-gray-900">Notificaciones</h3>
                  </div>
                  <div className="p-6 space-y-6">
                    {[
                      { id: 'emailNotifications', label: 'Emails Transaccionales', desc: 'Alertas de nuevas reservas' },
                      { id: 'pushNotifications', label: 'Push en Tiempo Real', desc: 'Notificaciones flotantes' },
                      { id: 'appointmentReminders', label: 'Recordatorios', desc: 'Avisos automáticos a clientes' }
                    ].map(item => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-gray-800">{item.label}</p>
                          <p className="text-[10px] text-gray-500">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => handleSettingChange(item.id as keyof AppSettings, !(settings as AppSettings)[item.id as keyof AppSettings])}
                          className={`w-10 h-5 rounded-full transition-colors relative ${
                            (settings as any)[item.id] ? 'bg-primary' : 'bg-gray-200'
                          }`}
                        >
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                            (settings as any)[item.id] ? 'left-6' : 'left-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                    <Button variant="outline" onClick={() => saveSettings('notificaciones')} className="w-full rounded-xl h-11 font-bold border-gray-100">Guardar Preferencias</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Pagos y Comisiones */}
              <Card className="border-none shadow-sm overflow-hidden bg-white">
                <CardContent className="p-0">
                  <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <h3 className="font-bold text-sm text-gray-900">Estructura Comercial</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <Label className="text-xs font-bold text-gray-500">Comisión (%)</Label>
                          <Input type="number" value={settings.commissionRate} onChange={(e) => handleSettingChange('commissionRate', parseInt(e.target.value))} className="rounded-xl border-gray-100" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-xs font-bold text-gray-500">Precio Mín.</Label>
                          <Input type="number" value={settings.minPrice} onChange={(e) => handleSettingChange('minPrice', parseInt(e.target.value))} className="rounded-xl border-gray-100" />
                       </div>
                    </div>
                    <Button onClick={() => saveSettings('pagos')} className="w-full rounded-xl h-11 font-bold">Actualizar Precios</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Seguridad */}
              <Card className="border-none shadow-sm overflow-hidden bg-white">
                <CardContent className="p-0">
                  <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                      <Shield className="h-4 w-4" />
                    </div>
                    <h3 className="font-bold text-sm text-gray-900">Seguridad</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100/50">
                       <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                             <AlertCircle className="h-4 w-4 text-red-500" />
                          </div>
                          <div>
                             <p className="text-xs font-bold text-gray-900">Registro Abierto</p>
                             <p className="text-[10px] text-gray-500">Permitir nuevos usuarios</p>
                          </div>
                       </div>
                       <button
                          onClick={() => handleSettingChange('openRegistration', !settings.openRegistration)}
                          className={`w-10 h-5 rounded-full transition-colors relative ${
                            settings.openRegistration ? 'bg-red-500' : 'bg-gray-200'
                          }`}
                        >
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                            settings.openRegistration ? 'left-6' : 'left-1'
                          }`} />
                        </button>
                    </div>
                    <Button variant="outline" onClick={() => saveSettings('seguridad')} className="w-full rounded-xl h-11 font-bold border-gray-100">Aplicar Políticas</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm overflow-hidden bg-white lg:col-span-2">
                <CardContent className="p-0">
                  <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-600">
                      <Download className="h-4 w-4" />
                    </div>
                    <h3 className="font-bold text-sm text-gray-900">App Android · actualización obligatoria</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Solo funciona en la <strong>app instalada desde Play</strong> (no en el navegador). Usá el <strong>versionCode</strong> (1.0.26 = código <strong>26</strong>).
                      Si tenés la <strong>misma</strong> versión que el mínimo, la app <strong>no</strong> se bloquea: eso es correcto. Para obligar a quienes tienen <strong>22 o menos</strong>, poné mínimo <strong>23</strong>.
                      También se copia a <code className="text-[10px]">app_config/android</code> (requiere reglas Firestore de lectura pública).
                    </p>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-500">VersionCode mínimo requerido</Label>
                      <Input
                        type="number"
                        min={0}
                        value={settings.minAndroidVersionCode}
                        onChange={(e) => handleSettingChange('minAndroidVersionCode', parseInt(e.target.value, 10) || 0)}
                        className="rounded-xl border-gray-100 h-11"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-amber-50/80 rounded-xl border border-amber-100">
                      <div>
                        <p className="text-xs font-bold text-gray-900">Modo prueba (bloquear también el mínimo)</p>
                        <p className="text-[10px] text-gray-500">Activalo solo para ver el cartel con la versión actual instalada.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSettingChange('forceUpdateBlockAtMinimum', !settings.forceUpdateBlockAtMinimum)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${
                          settings.forceUpdateBlockAtMinimum ? 'bg-amber-500' : 'bg-gray-200'
                        }`}
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                          settings.forceUpdateBlockAtMinimum ? 'left-6' : 'left-1'
                        }`} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-500">Mensaje para el usuario</Label>
                      <Input
                        value={settings.forceUpdateMessage}
                        onChange={(e) => handleSettingChange('forceUpdateMessage', e.target.value)}
                        className="rounded-xl border-gray-100 h-11"
                        placeholder="Texto del cartel de actualización"
                      />
                    </div>
                    <Button onClick={() => saveSettings('actualización app')} className="w-full rounded-xl h-11 font-bold">
                      Guardar regla de actualización
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm overflow-hidden bg-white lg:col-span-2">
                <CardContent className="p-0">
                  <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-500/10 rounded-lg text-gray-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      <h3 className="font-bold text-sm text-gray-900">Auditoría de administración</h3>
                    </div>
                    <Button variant="outline" size="sm" onClick={exportAuditCsv} className="rounded-xl">
                      <Download className="h-4 w-4 mr-1" /> Exportar CSV
                    </Button>
                  </div>
                  <div className="p-4 max-h-64 overflow-y-auto space-y-2">
                    {auditLoading ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Cargando registros...</p>
                    ) : auditLogs.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Sin acciones registradas aún.</p>
                    ) : (
                      auditLogs.slice(0, 20).map((log) => (
                        <div key={log.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 p-3 bg-gray-50 rounded-xl text-xs">
                          <span className="font-bold text-gray-800">{log.action}</span>
                          <span className="text-gray-500">{log.createdAt.toLocaleString('es-AR')}</span>
                          <span className="text-gray-600 truncate">{log.details || `${log.targetType}:${log.targetId}`}</span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Modales - Deben estar dentro del layout principal pero al final */}
        {showCreateCategory && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in zoom-in duration-300">
            <Card className="w-full max-w-md border-none shadow-2xl bg-white overflow-hidden rounded-3xl">
              <CardContent className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-gray-900">Nueva Categoría</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowCreateCategory(false)} className="rounded-xl">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <form onSubmit={handleCreateCategory} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-gray-400 uppercase">Nombre</Label>
                    <Input value={newCategory.name} onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))} placeholder="Ej: Barbería" required className="h-12 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label className="text-xs font-black text-gray-400 uppercase">Icono</Label>
                        <Input value={newCategory.icon} onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))} placeholder="💄" required className="h-12 rounded-xl text-center text-xl" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-xs font-black text-gray-400 uppercase">Orden</Label>
                        <Input type="number" placeholder="1" className="h-12 rounded-xl" />
                     </div>
                  </div>
                  <Button type="submit" className="w-full h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20">Crear Categoría</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {editingCategory && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in zoom-in duration-300">
            <Card className="w-full max-w-md border-none shadow-2xl bg-white overflow-hidden rounded-3xl">
              <CardContent className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-gray-900">Editar Categoría</h3>
                  <Button variant="ghost" size="icon" onClick={() => setEditingCategory(null)} className="rounded-xl">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <form onSubmit={handleEditCategory} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-gray-400 uppercase">Nombre</Label>
                    <Input value={editingCategory.name} onChange={(e) => setEditingCategory((prev: any) => ({ ...prev, name: e.target.value }))} required className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-gray-400 uppercase">Icono</Label>
                    <Input value={editingCategory.icon} onChange={(e) => setEditingCategory((prev: any) => ({ ...prev, icon: e.target.value }))} required className="h-12 rounded-xl text-center text-xl" />
                  </div>
                  <Button type="submit" className="w-full h-14 rounded-2xl font-black text-lg">Guardar Cambios</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {editingUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in zoom-in duration-300">
            <Card className="w-full max-w-md border-none shadow-2xl bg-white overflow-hidden rounded-3xl">
              <CardContent className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-gray-900">Rol de Usuario</h3>
                  <Button variant="ghost" size="icon" onClick={() => setEditingUser(null)} className="rounded-xl">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                   <p className="text-sm font-bold text-gray-900">{editingUser.displayName || 'Sin nombre'}</p>
                   <p className="text-xs text-gray-500">{editingUser.email}</p>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  setIsProcessing(true)
                  const formData = new FormData(e.target as HTMLFormElement)
                  const newRole = formData.get('role') as string
                  await handleUpdateUserRole(editingUser.id, newRole)
                  setIsProcessing(false)
                  setAdminActionStatus({ type: 'success', message: 'Rol actualizado correctamente' })
                  setTimeout(() => setAdminActionStatus(null), 3000)
                }} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-gray-400 uppercase">Asignar Rol</Label>
                    <select name="role" defaultValue={editingUser.role} className="w-full h-12 px-4 rounded-xl border border-gray-100 bg-white text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none">
                      <option value="client">Cliente Estándar</option>
                      <option value="provider">Proveedor de Servicios</option>
                      <option value="admin">Administrador Total</option>
                    </select>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isProcessing}
                    className="w-full h-14 rounded-2xl font-black text-lg flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Procesando...
                      </>
                    ) : 'Confirmar Rol'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {editingService && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in zoom-in duration-300">
            <Card className="w-full max-w-lg border-none shadow-2xl bg-white overflow-hidden rounded-3xl max-h-[90vh] overflow-y-auto">
              <CardContent className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-gray-900">Editar servicio</h3>
                  <Button variant="ghost" size="icon" onClick={() => setEditingService(null)} className="rounded-xl">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <form onSubmit={handleSaveServiceEdit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input value={editingService.name || ''} onChange={(e) => setEditingService({ ...editingService, name: e.target.value })} className="rounded-xl" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Input value={editingService.description || ''} onChange={(e) => setEditingService({ ...editingService, description: e.target.value })} className="rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Precio</Label>
                      <Input type="number" value={editingService.price ?? ''} onChange={(e) => setEditingService({ ...editingService, price: e.target.value })} className="rounded-xl" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Categoría</Label>
                      <select
                        value={editingService.category || ''}
                        onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                        className="w-full h-11 px-3 rounded-xl border border-gray-100 bg-white text-sm font-medium"
                        required
                      >
                        <option value="" disabled>Seleccionar rubro</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>{categorySelectLabel(cat.name, cat.icon)}</option>
                        ))}
                        {editingService.category && !findOfficialCategoryName(editingService.category, officialCategoryNames) && (
                          <option value={editingService.category}>{editingService.category} (actual, no oficial)</option>
                        )}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Dirección</Label>
                    <Input value={editingService.address || ''} onChange={(e) => setEditingService({ ...editingService, address: e.target.value })} className="rounded-xl" />
                  </div>
                  <Button type="submit" disabled={isProcessing} className="w-full h-12 rounded-xl font-bold">
                    {isProcessing ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {recategorizeTarget && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in zoom-in duration-300">
            <Card className="w-full max-w-lg border-none shadow-2xl bg-white overflow-hidden rounded-3xl max-h-[90vh] overflow-y-auto">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Recategorizar</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {recategorizeTarget.type === 'unmatched'
                        ? 'Servicios que no coinciden con un rubro oficial'
                        : `Servicios en ${recategorizeTarget.category?.name}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setRecategorizeTarget(null)} className="rounded-xl">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {(recategorizeTarget.type === 'unmatched'
                    ? unmatchedServices
                    : services.filter((service) =>
                        serviceMatchesCategory(service as Record<string, unknown>, recategorizeTarget.category?.name || '')
                      )
                  ).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No hay servicios en este grupo.</p>
                  ) : (
                    (recategorizeTarget.type === 'unmatched'
                      ? unmatchedServices
                      : services.filter((service) =>
                          serviceMatchesCategory(service as Record<string, unknown>, recategorizeTarget.category?.name || '')
                        )
                    ).map((service) => (
                      <div key={service.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{service.name}</p>
                            <p className="text-[11px] text-gray-500 truncate">{service.providerName || 'Proveedor'}</p>
                          </div>
                          <Badge variant="secondary" className="text-[9px] shrink-0">
                            {(service.category || 'SIN RUBRO').toUpperCase()}
                          </Badge>
                        </div>
                        <select
                          value={findOfficialCategoryName(service.category, officialCategoryNames) || recategorizeTarget.category?.name || ''}
                          disabled={isProcessing}
                          onChange={(e) => handleRecategorizeService(service.id, e.target.value, service.name)}
                          className="w-full h-10 px-3 rounded-xl border border-gray-100 bg-white text-xs font-bold"
                        >
                          <option value="" disabled>Elegir categoría</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.name}>{categorySelectLabel(cat.name, cat.icon)}</option>
                          ))}
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  </div>
)
}
