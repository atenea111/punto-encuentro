"use client"

import type React from "react"
import { useState, useEffect, useMemo, useRef } from "react"
import { Capacitor } from "@capacitor/core"
import { App } from "@capacitor/app"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogoText } from "@/components/logo"
import { CustomAlert } from "@/components/CustomAlert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"
import { useServices } from "@/hooks/useServices"
import { useBookings } from "@/hooks/useBookings"
import { useRoles } from "@/hooks/useRoles"
import { useAdminDashboard } from "@/hooks/useAdminDashboard"
import { useReports } from "@/hooks/useReports"
import { useCategories } from "@/hooks/useCategories"
import { useUsers } from "@/hooks/useUsers"
import { useAnalytics } from "@/hooks/useAnalytics"
import { useGeolocation } from "@/hooks/useGeolocation"
import { calcularDistanciaKm, formatearDistancia } from "@/lib/locationUtils"
import { db, auth, storage, uploadFile } from "@/lib/firebase"
import { useReviews } from "@/hooks/useReviews"
import { doc, setDoc, updateDoc, collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from "firebase/firestore"
import {
  Search,
  Star,
  Clock,
  Phone,
  Mail,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Banknote,
  Building2,
  Plus,
  Calendar,
  Users,
  TrendingUp,
  Filter,
  User,
  MapPin,
  MapPinOff,
  Home,
  Settings,
  Trophy,
  LayoutDashboard,
  FolderTree,
  Wrench,
  BarChart3,
  FileText,
  Bell,
  LogOut,
  Menu,
  X,
  PieChart,
  Shield,
  Briefcase,
  ShieldAlert,
  Wallet,
  Flame,
  Activity,
  CalendarCheck,
  AlertCircle,
  Send,
  MessageSquare,
} from "lucide-react"


// Función para calcular la distancia entre dos puntos (Haversine formula)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0
  const R = 6371 // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

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
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'users', label: 'Usuarios', icon: Users },
        { id: 'services', label: 'Servicios', icon: Wrench },
        { id: 'categories', label: 'Categorías', icon: FolderTree },
        { id: 'reports', label: 'Reportes', icon: FileText },
        { id: 'analytics', label: 'Estadísticas', icon: BarChart3 },
        { id: 'settings', label: 'Ajustes', icon: Settings },
      ].map((item) => (
        <Button
          key={item.id}
          variant={activeTab === item.id ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => setActiveTab(item.id)}
        >
          <item.icon className="w-5 h-5 mr-3" />
          {item.label}
        </Button>
      ))}
    </nav>
    <div className="p-4 border-t">
      <Button variant="ghost" className="w-full justify-start text-red-600" onClick={logout}>
        <LogOut className="w-5 h-5 mr-3" />
        Cerrar sesión
      </Button>
    </div>
  </div>
)

const AdminBottomNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => (
  <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 z-50">
    {[
      { id: 'dashboard', icon: LayoutDashboard },
      { id: 'users', icon: Users },
      { id: 'services', icon: Wrench },
      { id: 'categories', icon: FolderTree },
      { id: 'reports', icon: FileText },
      { id: 'analytics', icon: BarChart3 },
      { id: 'settings', icon: Settings },
    ].map((item) => (
      <Button
        key={item.id}
        variant="ghost"
        className={activeTab === item.id ? "text-primary" : ""}
        onClick={() => setActiveTab(item.id)}
      >
        <item.icon className="w-6 h-6" />
      </Button>
    ))}
  </div>
)

export default function HomePage() {
  const { user, signIn, signUp, logout, loading: authLoading } = useAuth()
  const { services, loading: servicesLoading, searchServices, createService } = useServices()
  const { createBooking, getBookingsByClient } = useBookings()
  const { isAdmin, isClient, isProvider, updateUserRole, loading: rolesLoading } = useRoles()
  const { logInteraction } = useAnalytics()
  
  // Inicializar userType y flujo desde localStorage para que al recargar vaya directo al home del usuario
  const [userType, setUserType] = useState<"client" | "provider" | null>(() => {
    if (typeof window === "undefined") return null
    const saved = localStorage.getItem("userType")
    return saved === "client" || saved === "provider" ? saved : null
  })
  const [clientFlow, setClientFlow] = useState<
    "onboarding" | "login" | "register" | "home" | "profile" | "agenda" | "service-detail" | "booking" | "payment" | "chat"
  >(() => {
    if (typeof window === "undefined") return "onboarding"
    return localStorage.getItem("userType") === "client" ? "home" : "onboarding"
  })
  const [providerFlow, setProviderFlow] = useState<
    | "onboarding"
    | "login"
    | "register"
    | "dashboard"
    | "profile"
    | "agenda"
    | "services"
    | "create-service"
    | "edit-service"
    | "subscription"
    | "statistics"
    | "chat"
  >(() => {
    if (typeof window === "undefined") return "onboarding"
    return localStorage.getItem("userType") === "provider" ? "dashboard" : "onboarding"
  })
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedProviderService, setSelectedProviderService] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [authError, setAuthError] = useState("")
  const [authSuccess, setAuthSuccess] = useState("")
  const [bookingSource, setBookingSource] = useState<'anuncio' | 'recomendados' | 'cerca_tuyo' | 'rubro' | 'buscador'>("anuncio")
  const [activeChat, setActiveChat] = useState<any>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Ref para la función "atrás" actual (usada por el botón físico de Android)
  const handleBackRef = useRef<() => void>(() => {})

  // Actualizar la acción "atrás" según el flujo actual (cliente / proveedor / raíz)
  useEffect(() => {
    const goBack = () => {
      if (user && isAdmin) {
        App.minimizeApp()
        return
      }
      if (user && !userType) {
        App.minimizeApp()
        return
      }
      if (userType === "client") {
        if (clientFlow === "payment") setClientFlow("booking")
        else if (clientFlow === "booking") setClientFlow("service-detail")
        else if (clientFlow === "service-detail") {
          setClientFlow("home")
          setSelectedService(null)
        }
        else if (clientFlow === "profile" || clientFlow === "agenda") setClientFlow("home")
        else if (clientFlow === "home") App.minimizeApp()
        else if (clientFlow === "login" || clientFlow === "register") setClientFlow("onboarding")
        else if (clientFlow === "onboarding") App.minimizeApp()
        return
      }
      if (userType === "provider") {
        if (providerFlow === "edit-service") {
          setProviderFlow("services")
          setSelectedProviderService(null)
        }
        else if (providerFlow === "create-service") setProviderFlow("services")
        else if (providerFlow === "services" || providerFlow === "statistics") setProviderFlow("dashboard")
        else if (providerFlow === "profile" || providerFlow === "agenda" || providerFlow === "subscription") setProviderFlow("dashboard")
        else if (providerFlow === "dashboard") App.minimizeApp()
        else if (providerFlow === "login" || providerFlow === "register") setProviderFlow("onboarding")
        else if (providerFlow === "onboarding") App.minimizeApp()
        return
      }
      App.minimizeApp()
    }
    handleBackRef.current = goBack
  }, [user, userType, isAdmin, clientFlow, providerFlow])

  // Listener del botón atrás físico (solo en la app nativa Android)
  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return
    let listenerHandle: { remove: () => Promise<void> } | null = null
    App.addListener("backButton", () => {
      handleBackRef.current()
    }).then((handle) => {
      listenerHandle = handle
    })
    return () => {
      listenerHandle?.remove?.()
    }
  }, [])

  // Sincronizar estado inicial al montar o cuando el usuario cambia
  useEffect(() => {
    if (typeof window === "undefined" || rolesLoading || !user) return

    const savedUserType = localStorage.getItem('userType') as "client" | "provider" | null
    
    // Si Firestore dice que somos un proveedor (y no estamos forzando el modo cliente manualmente)
    if (isProvider && savedUserType !== "client") {
      setUserType("provider")
      if (providerFlow === "onboarding") setProviderFlow("dashboard")
      localStorage.setItem("userType", "provider")
    } 
    // Si Firestore dice que somos cliente (y no estamos forzando el modo proveedor manualmente)
    else if (isClient && savedUserType !== "provider") {
      setUserType("client")
      if (clientFlow === "onboarding") setClientFlow("home")
      localStorage.setItem("userType", "client")
    }
    // Si no aplica ninguna regla fuerte de Firestore, respetamos lo que haya en LocalStorage
    else if (savedUserType) {
      setUserType(savedUserType)
      if (savedUserType === "provider" && providerFlow === "onboarding") setProviderFlow("dashboard")
      if (savedUserType === "client" && clientFlow === "onboarding") setClientFlow("home")
    }
  }, [user, rolesLoading, isClient, isProvider, userType, providerFlow, clientFlow])

  // Cambiar de rol: actualizar Firestore, estado local y llevar al home del nuevo rol. Devuelve si tuvo éxito.
  const switchToProvider = async (): Promise<{ success: boolean }> => {
    const result = await updateUserRole("provider", [])
    if (result.success) {
      setUserType("provider")
      setProviderFlow("dashboard")
      localStorage.setItem("userType", "provider")
    }
    return result
  }
  const switchToClient = async (): Promise<{ success: boolean }> => {
    const result = await updateUserRole("client", [])
    if (result.success) {
      setUserType("client")
      setClientFlow("home")
      localStorage.setItem("userType", "client")
    }
    return result
  }

  // Limpiar localStorage al cerrar sesión
  useEffect(() => {
    if (!authLoading && !user) {
      localStorage.removeItem('userType')
      setUserType(null)
    }
  }, [user, authLoading])

  // Obtener ubicación del usuario
  useEffect(() => {
    const getPos = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            })
            setLocationError(null)
          },
          (error) => {
            console.error("Error obteniendo ubicación:", error)
            if (error.code === 1) { // Permission Denied
              setLocationError("permission_denied")
            } else {
              setLocationError("other")
            }
          }
        )
      }
    }
    getPos()
  }, [])

  // Mostrar loading mientras se verifica la autenticaci?n
  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Debug: Log del estado de roles
  console.log('User:', user?.email)
  console.log('isAdmin:', isAdmin)
  console.log('rolesLoading:', rolesLoading)

  const LocationBanner = () => (
    <div className="bg-orange-50 border-b border-orange-200 p-4 sticky top-0 z-[60]">
      <div className="flex gap-4 items-start max-w-4xl mx-auto">
        <div className="bg-orange-100 p-2 rounded-full">
          <MapPinOff className="h-5 w-5 text-orange-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-orange-900 text-sm">Ubicación desactivada</h3>
          <p className="text-orange-800 text-xs mt-1 leading-relaxed">
            Para mostrarte servicios <b>cerca de tu casa</b> y calcular distancias, necesitamos acceso al GPS.
            Por favor, actívalo en la configuración de tu navegador.
          </p>
          <div className="flex gap-3 mt-3">
            <Button
              size="sm"
              variant="orange"
              className="h-8 text-xs"
              onClick={() => window.location.reload()}
            >
              Ya lo activé
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs text-orange-700 hover:bg-orange-100"
              onClick={() => setLocationError(null)}
            >
              Entendido
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
  // Si el usuario es admin, mostrar panel de administración
  if (user && isAdmin) {
    return <AdminDashboard user={user} logout={logout} />
  }

  // Si el usuario está logueado pero no se ha seleccionado tipo de usuario, mostrar selección
  if (user && !userType && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <img
              src="/logonuevo.jpeg"
              alt="Punto Encuentro"
              className="w-20 h-20 mx-auto mb-4 rounded-lg object-cover"
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Bienvenido de vuelta!</h1>
            <p className="text-gray-600">Selecciona cómo quieres usar la aplicación</p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => setUserType("client")}
              className="w-full h-16 text-lg"
              variant="outline"
            >
              <User className="w-6 h-6 mr-2" />
              Soy Cliente
            </Button>

            <Button
              onClick={() => setUserType("provider")}
              className="w-full h-16 text-lg"
              variant="outline"
            >
              <Building2 className="w-6 h-6 mr-2" />
              Soy Proveedor
            </Button>
          </div>

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={logout}
              className="text-sm text-gray-500"
            >
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (userType === "client") {
    return (
      <>
        {locationError === "permission_denied" && <LocationBanner />}
        <ClientFlow
          flow={clientFlow}
          setFlow={setClientFlow}
          selectedService={selectedService}
          setSelectedService={setSelectedService}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
          signIn={signIn}
          signUp={signUp}
          setAuthError={setAuthError}
          authError={authError}
          setAuthSuccess={setAuthSuccess}
          authSuccess={authSuccess}
          services={services}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          searchServices={searchServices}
          user={user}
          createBooking={createBooking}
          getBookingsByClient={getBookingsByClient}
          userLocation={userLocation}
          activeChat={activeChat}
          setActiveChat={setActiveChat}
          logout={logout}
          onSwitchToProvider={switchToProvider}
          setBookingSource={setBookingSource}
          bookingSource={bookingSource}
        />
      </>
    )
  }

  if (userType === "provider") {
    return (
      <>
        {locationError === "permission_denied" && <LocationBanner />}
        <ProviderFlow 
          flow={providerFlow} 
          setFlow={setProviderFlow}
          signIn={signIn}
          signUp={signUp}
          setAuthError={setAuthError}
          authError={authError}
          setAuthSuccess={setAuthSuccess}
          authSuccess={authSuccess}
          services={services}
          createService={createService}
          user={user}
          logout={logout}
          userLocation={userLocation}
          selectedProviderService={selectedProviderService}
          setSelectedProviderService={setSelectedProviderService}
          onSwitchToClient={switchToClient}
          activeChat={activeChat}
          setActiveChat={setActiveChat}
        />
      </>
    )
  }

  return (
    <>
      {locationError === "permission_denied" && <LocationBanner />}
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl space-y-8">
          {/* Logo y descripción */}
          <div className="text-center">
            <img
              src="/logonuevo.jpeg"
              alt="Punto Encuentro"
              className="w-32 h-32 mx-auto mb-6 rounded-lg object-cover"
            />
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Un espacio para encontrar, ofrecer y ayudarnos entre todos.
            </p>
          </div>

          {/* Alertas */}
          {authError && (
            <CustomAlert
              type="error"
              title="Error"
              message={authError}
              onClose={() => setAuthError("")}
            />
          )}

          {authSuccess && (
            <CustomAlert
              type="success"
              title="¡Éxito!"
              message={authSuccess}
              onClose={() => setAuthSuccess("")}
            />
          )}

          {/* Cards de opciones */}
          <div className="flex flex-row gap-4 max-w-4xl mx-auto">
            {/* Card para contratar servicios */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow flex-1" onClick={() => setUserType("client")}>
              <CardContent className="p-4 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <div className="text-2xl">🔍</div>
                </div>
                <h2 className="text-lg font-semibold mb-2">Contratar Servicios</h2>
                <p className="text-sm text-muted-foreground">
                  Busca servicios, ayuda o soluciones cerca tuyo
                </p>
              </CardContent>
            </Card>

            {/* Card para ofrecer servicios */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow flex-1" onClick={() => setUserType("provider")}>
              <CardContent className="p-4 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <div className="text-2xl">💼</div>
                </div>
                <h2 className="text-lg font-semibold mb-2">Ofrecer Servicios</h2>
                <p className="text-sm text-muted-foreground">
                  Ofrece tu trabajo y encuentra oportunidades
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

function ProviderFlow({
  flow,
  setFlow,
  signIn,
  signUp,
  setAuthError,
  authError,
  setAuthSuccess,
  authSuccess,
  services,
  createService,
  user,
  logout,
  userLocation,
  selectedProviderService,
  setSelectedProviderService,
  onSwitchToClient,
  activeChat,
  setActiveChat
}: {
  flow: string
  setFlow: (flow: any) => void
  signIn: (email: string, password: string) => Promise<{ success: boolean, error?: string }>
  signUp: (email: string, password: string) => Promise<{ success: boolean, error?: string }>
  setAuthError: (error: string) => void
  authError: string
  setAuthSuccess: (message: string) => void
  authSuccess: string
  services: any[]
  createService: (serviceData: any) => Promise<{ success: boolean, error?: string }>
  user: any
  logout: () => Promise<{ success: boolean }>
  userLocation: { lat: number, lng: number } | null
  selectedProviderService: any
  setSelectedProviderService: (service: any) => void
  onSwitchToClient: () => Promise<{ success: boolean }>
  activeChat: any
  setActiveChat: (chat: any) => void
}) {
  const [profileData, setProfileData] = useState<any>(null)

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uid) return
      try {
        const { doc, getDoc } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase")
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          setProfileData(userDoc.data())
        }
      } catch (error) {
        console.error('Error loading profile in ProviderFlow:', error)
      }
    }
    loadProfile()
  }, [user])
  if (flow === "login") {
    return <ProviderLogin setFlow={setFlow} signIn={signIn} setAuthError={setAuthError} authError={authError} setAuthSuccess={setAuthSuccess} authSuccess={authSuccess} />
  }

  if (flow === "register") {
    return <ProviderRegister setFlow={setFlow} signUp={signUp} setAuthError={setAuthError} authError={authError} setAuthSuccess={setAuthSuccess} authSuccess={authSuccess} />
  }

  if (flow === "dashboard") {
    return <ProviderDashboard setFlow={setFlow} user={user} services={services} logout={logout} />
  }

  if (flow === "profile") {
    return <ProviderProfile setFlow={setFlow} user={user} logout={logout} onSwitchToClient={onSwitchToClient} services={services} userLocation={userLocation} />
  }

  if (flow === "agenda") {
    return <ProviderAgenda setFlow={setFlow} user={user} setActiveChat={setActiveChat} />
  }

  if (flow === "services") {
    return <ProviderServices setFlow={setFlow} services={services} user={user} setSelectedProviderService={setSelectedProviderService} />
  }

  if (flow === "create-service") {
    return <CreateService setFlow={setFlow} createService={createService} user={user} userLocation={userLocation} />
  }

  if (flow === "edit-service") {
    return <EditService setFlow={setFlow} user={user} service={selectedProviderService} userLocation={userLocation} />
  }

  if (flow === "subscription") {
    return <ProviderSubscription setFlow={setFlow} />
  }

  if (flow === "statistics") {
    return <ProviderStatistics setFlow={setFlow} user={user} services={services} profileData={profileData} />
  }

  if (flow === "chat") {
    return (
      <ChatWindow
        user={user}
        partnerId={activeChat?.partnerId}
        partnerName={activeChat?.partnerName}
        onBack={() => setFlow("dashboard")}
      />
    )
  }

  return <ProviderOnboarding setFlow={setFlow} />
}

function ClientFlow({
  flow,
  setFlow,
  user,
  services,
  selectedService,
  setSelectedService,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  searchTerm,
  setSearchTerm,
  searchServices,
  createBooking,
  getBookingsByClient,
  userLocation,
  logout,
  activeChat,
  setActiveChat,
  signIn,
  signUp,
  setAuthError,
  authError,
  setAuthSuccess,
  authSuccess,
  onSwitchToProvider,
  setBookingSource,
  bookingSource
}: {
  flow: string
  setFlow: (flow: string) => void
  user: any
  services: any[]
  selectedService: any
  setSelectedService: (service: any) => void
  selectedDate: string
  setSelectedDate: (date: string) => void
  selectedTime: string
  setSelectedTime: (time: string) => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  searchServices: (term: string) => any[]
  createBooking: (bookingData: any) => Promise<{ success: boolean, error?: string }>
  getBookingsByClient: (id: string) => any[]
  userLocation: { lat: number, lng: number } | null
  logout: () => Promise<{ success: boolean }>
  activeChat: any
  setActiveChat: (chat: any) => void
  signIn: (email: string, password: string) => Promise<{ success: boolean, error?: string }>
  signUp: (email: string, password: string) => Promise<{ success: boolean, error?: string }>
  setAuthError: (error: string) => void
  authError: string
  setAuthSuccess: (message: string) => void
  authSuccess: string
  onSwitchToProvider: () => Promise<{ success: boolean }>
  setBookingSource: (source: any) => void
  bookingSource: string
}) {
  if (flow === "login") {
    return <ClientLogin setFlow={setFlow} signIn={signIn} setAuthError={setAuthError} authError={authError} setAuthSuccess={setAuthSuccess} authSuccess={authSuccess} />
  }

  if (flow === "register") {
    return <ClientRegister setFlow={setFlow} signUp={signUp} setAuthError={setAuthError} authError={authError} setAuthSuccess={setAuthSuccess} authSuccess={authSuccess} />
  }

  if (flow === "home") {
    return (
      <ClientHome
        setFlow={setFlow}
        setSelectedService={setSelectedService}
        services={services}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchServices={searchServices}
        user={user}
        setBookingSource={setBookingSource}
        userLocation={userLocation}
        setActiveChat={setActiveChat}
      />
    )
  }

  if (flow === "profile") {
    return <ClientProfile setFlow={setFlow} user={user} logout={logout} onSwitchToProvider={onSwitchToProvider} />
  }

  if (flow === "agenda") {
    return <ClientAgenda setFlow={setFlow} user={user} setActiveChat={setActiveChat} />
  }

  if (flow === "service-detail") {
    return <ServiceDetail service={selectedService} setFlow={setFlow} bookingSource={bookingSource} userLocation={userLocation} setActiveChat={setActiveChat} />
  }

  if (flow === "booking") {
    return (
      <BookingCalendar
        service={selectedService}
        setFlow={setFlow}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedTime={selectedTime}
        setSelectedTime={setSelectedTime}
        bookingSource={bookingSource}
      />
    )
  }

  if (flow === "payment") {
    return (
      <PaymentScreen
        service={selectedService}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        setFlow={setFlow}
        user={user}
        createBooking={createBooking}
        bookingSource={bookingSource}
        setActiveChat={setActiveChat}
      />
    )
  }

  if (flow === "chat") {
    return (
      <ChatWindow
        user={user}
        partnerId={activeChat?.partnerId}
        partnerName={activeChat?.partnerName}
        onBack={() => setFlow(selectedService ? "service-detail" : "home")}
      />
    )
  }

  return <ClientOnboarding setFlow={setFlow} />
}

function ClientOnboarding({ setFlow }: { setFlow: (flow: string) => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">Punto Encuentro</h1>
          <p className="text-muted-foreground">Encuentra el servicio perfecto</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <Button onClick={() => setFlow("register")} className="w-full h-12 text-base">
              Registrarse
            </Button>

            <Button onClick={() => setFlow("login")} variant="outline" className="w-full h-12 text-base">
              Iniciar sesión
            </Button>
          </CardContent>
        </Card>

        <Button variant="ghost" onClick={() => window.location.reload()} className="w-full">
          ← Volver
        </Button>
      </div>
    </div>
  )
}

function ClientLogin({ setFlow, signIn, setAuthError, authError, setAuthSuccess, authSuccess }: {
  setFlow: (flow: string) => void
  signIn: (email: string, password: string) => Promise<{ success: boolean, error?: string }>
  setAuthError: (error: string) => void
  authError: string
  setAuthSuccess: (message: string) => void
  authSuccess: string
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAuthError("")
    setAuthSuccess("")

    const result = await signIn(email, password)

    if (result.success) {
      setAuthSuccess("¡Bienvenido! Iniciando sesión...")
      setTimeout(() => {
        setFlow("home")
      }, 1500)
    } else {
      setAuthError(result.error || "Error al iniciar sesión")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <img
            src="/logonuevo.jpeg"
            alt="Punto Encuentro"
            className="w-24 h-24 mx-auto mb-4 rounded-lg object-cover"
          />
          <h1 className="text-3xl font-bold text-primary mb-2">Punto Encuentro</h1>
          <p className="text-muted-foreground">Inicia sesión en tu cuenta</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            {authError && (
              <CustomAlert
                type="error"
                title="Error al iniciar sesión"
                message={authError}
                onClose={() => setAuthError("")}
              />
            )}

            {authSuccess && (
              <CustomAlert
                type="success"
                title="¡Éxito!"
                message={authSuccess}
                onClose={() => setAuthSuccess("")}
              />
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 text-base">
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>
            </form>

            <div className="text-center">
              <Button variant="link" onClick={() => setFlow("register")} className="text-sm text-muted-foreground">
                ¿No tienes cuenta? Regístrate
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button variant="ghost" onClick={() => setFlow("onboarding")} className="w-full">
          ← Volver
        </Button>
      </div>
    </div>
  )
}

function ClientRegister({ setFlow, signUp, setAuthError, authError, setAuthSuccess, authSuccess }: {
  setFlow: (flow: string) => void
  signUp: (email: string, password: string) => Promise<{ success: boolean, error?: string }>
  setAuthError: (error: string) => void
  authError: string
  setAuthSuccess: (message: string) => void
  authSuccess: string
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAuthError("")
    setAuthSuccess("")

    try {
      const result = await signUp(email, password)

      if (result.success) {
        // Obtener el usuario actual de Firebase Auth
        const { auth } = await import("@/lib/firebase")
        const currentUser = auth.currentUser

        if (currentUser) {
          // Actualizar perfil con nombre
          const { updateProfile } = await import("firebase/auth")

          if (name) {
            await updateProfile(currentUser, { displayName: name })
          }

          // Guardar usuario en Firestore con rol de cliente
          const { doc, setDoc } = await import("firebase/firestore")
          const { db } = await import("@/lib/firebase")

          await setDoc(doc(db, 'users', currentUser.uid), {
            email: email,
            displayName: name,
            role: 'client',
            permissions: [],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }

        setAuthSuccess("¡Cuenta creada exitosamente! Bienvenido a Punto Encuentro.")
        setTimeout(() => {
          setFlow("home")
        }, 2000)
      } else {
        setAuthError(result.error || "Error al registrarse")
      }
    } catch (error: any) {
      console.error('Error en registro:', error)
      setAuthError(error.message || "Error al registrarse")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <img
            src="/logonuevo.jpeg"
            alt="Punto Encuentro"
            className="w-24 h-24 mx-auto mb-4 rounded-lg object-cover"
          />
          <h1 className="text-3xl font-bold text-primary mb-2">Punto Encuentro</h1>
          <p className="text-muted-foreground">Crea tu cuenta</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            {authError && (
              <CustomAlert
                type="error"
                title="Error al registrarse"
                message={authError}
                onClose={() => setAuthError("")}
              />
            )}

            {authSuccess && (
              <CustomAlert
                type="success"
                title="¡Éxito!"
                message={authSuccess}
                onClose={() => setAuthSuccess("")}
              />
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  placeholder="Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 text-base">
                {loading ? "Registrando..." : "Registrarse"}
              </Button>
            </form>

            <div className="text-center">
              <Button variant="link" onClick={() => setFlow("login")} className="text-sm text-muted-foreground">
                ¿Ya tienes cuenta? Inicia sesión
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button variant="ghost" onClick={() => setFlow("onboarding")} className="w-full">
          ← Volver
        </Button>
      </div>
    </div>
  )
}

function ClientHome({
  setFlow,
  setSelectedService,
  services,
  searchTerm,
  setSearchTerm,
  searchServices,
  user,
  setBookingSource,
  userLocation,
  setActiveChat
}: {
  setFlow: (flow: string) => void
  setSelectedService: (service: any) => void
  services: any[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  searchServices: (term: string) => any[]
  user: any
  setBookingSource: (source: any) => void
  userLocation: { lat: number, lng: number } | null
  setActiveChat?: (chat: any) => void
}) {
  const { categories } = useCategories()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"home" | "recommendations" | "nearby" | "category" | "all-categories">("home")
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [maxPrice, setMaxPrice] = useState<number | "all">("all")
  const [onlyNearby, setOnlyNearby] = useState(false)
  const { position: userPosition, loading, setPosition } = useGeolocation()
  const { logInteraction } = useAnalytics()

  // Calcular distancia de cada servicio al usuario
  const calcularDistanciaServicio = (service: any): string | null => {
    if (!userPosition || !service.latitude || !service.longitude) return null
    const dist = calcularDistanciaKm(
      userPosition.latitude, userPosition.longitude,
      service.latitude, service.longitude
    )
    return formatearDistancia(dist)
  }

  // Las categorías dinámicas de la base de datos
  const allCategories = categories.map(cat => ({
    name: cat.name,
    icon: <span>{cat.icon}</span>,
    rawIcon: cat.icon,
    active: cat.active
  })).filter(c => c.active !== false)

  // Mostrar solo las primeras 4 categorías en el home
  const mainCategories = allCategories.slice(0, 4)

  // Servicios con distancia calculada
  const servicesWithDistance = useMemo(() => {
    return services.map(service => {
      if (userLocation && service.lat && service.lng) {
        const distance = getDistance(userLocation.lat, userLocation.lng, service.lat, service.lng)
        return { ...service, distance }
      }
      return service
    })
  }, [services, userLocation])

  const nearbyServices = useMemo(() => {
    if (!userLocation) return []
    return servicesWithDistance
      .filter(s => s.distance !== undefined && s.distance < 15) // Dentro de 15km
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
  }, [servicesWithDistance, userLocation])

  const recommendedServices = useMemo(() => {
    // Si hay ubicación, excluir los que ya salen en "Cerca tuyo" para no repetir tanto? 
    // O simplemente mostrar los que no están taaaan cerca pero tienen buen rating
    return servicesWithDistance
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
  }, [servicesWithDistance])

  const filteredServices = searchTerm
    ? searchServices(searchTerm)
    : services.filter((service) => {
        const matchesCategory = !selectedCategory || service.category === selectedCategory
        const matchesPrice = maxPrice === "all" || Number(service.price) <= maxPrice
        
        let matchesNearby = true
        if (onlyNearby && userPosition && service.latitude && service.longitude) {
          const dist = calcularDistanciaKm(
            userPosition.latitude, userPosition.longitude,
            service.latitude, service.longitude
          )
          matchesNearby = dist <= 10 // Ejemplo: servicios a menos de 10km
        } else if (onlyNearby) {
          matchesNearby = false
        }

        return matchesCategory && matchesPrice && matchesNearby
      })

  const generateCalendar = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      days.push(date)
    }
    return days
  }

  const handleServiceClick = (service: any, source?: 'anuncio' | 'recomendados' | 'cerca_tuyo' | 'rubro' | 'buscador') => {
    setSelectedService(service)
    logInteraction('perfil_proveedor')
    // Determinar origen automáticamente si no se provee
    let finalSource = source
    if (!finalSource) {
      if (searchTerm) finalSource = 'buscador'
      else if (viewMode === 'recommendations') finalSource = 'recomendados'
      else if (viewMode === 'nearby') finalSource = 'cerca_tuyo'
      else if (viewMode === 'category') finalSource = 'rubro'
      else finalSource = 'anuncio'
    }
    setBookingSource(finalSource!)
    setFlow("service-detail")
  }

  const handleVerMas = () => {
    setViewMode("recommendations")
  }

  const handleCercaTuyo = () => {
    setViewMode("nearby")
  }

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategoryName(categoryName)
    setViewMode("category")
    logInteraction('categorias')
  }

  const handleBackToHome = () => {
    setViewMode("home")
    setSelectedCategory(null)
  }

  const handleVerMasCategorias = () => {
    setViewMode("all-categories")
  }




  if (viewMode === "recommendations") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm p-4 flex items-center">
          <button onClick={handleBackToHome} className="mr-3">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold text-primary">Recomendados</h1>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4">
            {services.map((service) => (
              <Card
                key={service.id}
                className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                onClick={() => handleServiceClick(service)}
              >
                <div className="relative w-full h-48">
                  {/* Imagen de fondo que ocupa toda la card */}
                  <img
                    src={service.image || "/placeholder.svg"}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay con gradiente para mejor legibilidad del texto */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  {/* Contenido sobre la imagen */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <div className="flex flex-col gap-2 mb-2">
                      <span className="text-base font-medium">{service.providerName || 'Proveedor'}</span>
                      <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-white self-start">
                        {service.category}
                      </span>
                    </div>
                    <p className="text-sm mb-2 opacity-90">{service.name}</p>
                    {calcularDistanciaServicio(service) && (
                      <p className="text-xs text-green-300 mb-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {calcularDistanciaServicio(service)}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>
                        {service.rating} ({service.reviews} vecinos)
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 pb-safe">
          <div className="flex justify-around py-3">
            <button onClick={() => setFlow("home")} className="flex flex-col items-center gap-1">
              <div className="text-primary">
                <Home className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-medium text-primary">Inicio</span>
            </button>
            <button onClick={() => setFlow("agenda")} className="flex flex-col items-center gap-1">
              <div className="text-gray-400">
                <Calendar className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-medium text-gray-400">Agenda</span>
            </button>
            <button onClick={() => setFlow("profile")} className="flex flex-col items-center gap-1">
              <div className="text-gray-400">
                <User className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-medium text-gray-400">Perfil</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (viewMode === "nearby") {
    // Filtrar servicios que tienen coordenadas y ordenarlos por distancia
    const serviciosConDistancia = services
      .filter((service) => service.latitude && service.longitude && userPosition)
      .map((service) => ({
        ...service,
        _distanciaKm: userPosition ? calcularDistanciaKm(
          userPosition.latitude, userPosition.longitude,
          service.latitude, service.longitude
        ) : Infinity,
        _distanciaTexto: calcularDistanciaServicio(service)
      }))
      .sort((a, b) => a._distanciaKm - b._distanciaKm)

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm p-4 flex items-center">
          <button onClick={handleBackToHome} className="mr-3">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold text-primary">Cerca tuyo</h1>
        </div>
        <div className="p-4">
          {!userPosition && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
              📍 Activa la ubicación para ver servicios cerca tuyo
            </div>
          )}
          <div className="grid grid-cols-1 gap-4">
            {serviciosConDistancia
              .map((service) => (
                <Card
                  key={service.id}
                  className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                  onClick={() => handleServiceClick(service)}
                >
                  <div className="relative w-full h-48">
                    {/* Imagen de fondo que ocupa toda la card */}
                    <img
                      src={service.image || "/placeholder.svg"}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Overlay con gradiente para mejor legibilidad del texto */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    {/* Contenido sobre la imagen */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-medium">{service.providerName || 'Proveedor'}</span>
                        <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-white">
                          {service.category}
                        </span>
                      </div>
                      <p className="text-sm mb-1 opacity-90">{service.name}</p>
                      {service._distanciaTexto && (
                        <p className="text-xs text-green-300 mb-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {service._distanciaTexto}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>
                          {service.rating} ({service.reviews} vecinos)
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 pb-safe">
          <div className="flex justify-around py-3">
            <button onClick={() => setFlow("home")} className="flex flex-col items-center gap-1">
              <div className="text-primary">
                <Home className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-medium text-primary">Inicio</span>
            </button>
            <button onClick={() => setFlow("agenda")} className="flex flex-col items-center gap-1">
              <div className="text-gray-400">
                <Calendar className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-medium text-gray-400">Agenda</span>
            </button>
            <button onClick={() => setFlow("profile")} className="flex flex-col items-center gap-1">
              <div className="text-gray-400">
                <User className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-medium text-gray-400">Perfil</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (viewMode === "all-categories") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm p-4 flex items-center">
          <button onClick={handleBackToHome} className="mr-3">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold text-primary">Todas las Categorías</h1>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-4">
            {allCategories.map((category) => (
              <div
                key={category.name}
                className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleCategoryClick(category.name)}
              >
                <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mb-3">
                  <span className="text-2xl">{category.icon}</span>
                </div>
                <span className="text-sm font-medium text-center">{category.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 pb-safe z-40">
          <div className="flex justify-around py-3">
            <button onClick={() => setFlow("home")} className="flex flex-col items-center gap-1">
              <div className="text-primary">
                <Home className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-medium text-primary">Inicio</span>
            </button>
            <button onClick={() => setFlow("agenda")} className="flex flex-col items-center gap-1">
              <div className="text-gray-400">
                <Calendar className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-medium text-gray-400">Agenda</span>
            </button>
            <button onClick={() => setFlow("profile")} className="flex flex-col items-center gap-1">
              <div className="text-gray-400">
                <User className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-medium text-gray-400">Perfil</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (viewMode === "category") {
    const categoryServices = services.filter(
      (service) => service.category?.toLowerCase() === selectedCategoryName.toLowerCase(),
    )

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm p-4 flex items-center">
          <button onClick={handleBackToHome} className="mr-3">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold text-primary">{selectedCategoryName}</h1>
        </div>
        <div className="p-4">
          {categoryServices.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {categoryServices.map((service) => (
                <Card
                  key={service.id}
                  className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                  onClick={() => handleServiceClick(service)}
                >
                  <div className="relative w-full h-48">
                    {/* Imagen de fondo que ocupa toda la card */}
                    <img
                      src={service.image || "/placeholder.svg"}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Overlay con gradiente para mejor legibilidad del texto */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    {/* Contenido sobre la imagen */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <div className="flex flex-col gap-2 mb-2">
                        <span className="text-base font-medium">{service.providerName || 'Proveedor'}</span>
                        <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-white self-start">
                          {service.category}
                        </span>
                      </div>
                      <p className="text-sm mb-2 opacity-90">{service.name}</p>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>
                          {service.rating} ({service.reviews} vecinos)
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No hay servicios disponibles en esta categoría</p>
            </div>
          )}
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 pb-safe">
          <div className="flex justify-around py-3">
            <button onClick={() => setFlow("home")} className="flex flex-col items-center gap-1">
              <div className="text-primary">
                <Home className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-medium text-primary">Inicio</span>
            </button>
            <button onClick={() => setFlow("agenda")} className="flex flex-col items-center gap-1">
              <div className="text-gray-400">
                <Calendar className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-medium text-gray-400">Agenda</span>
            </button>
            <button onClick={() => setFlow("profile")} className="flex flex-col items-center gap-1">
              <div className="text-gray-400">
                <User className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-medium text-gray-400">Perfil</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-primary pt-8 pb-6 px-4 rounded-b-[2rem] shadow-lg">
          <div className="text-center mb-4">
          <h1 className="text-white text-xl font-bold italic tracking-tight">
            Punto Encuentro
          </h1>
          {userPosition?.address ? (
            <div className="flex flex-col items-center gap-1">
              <div 
                className="flex items-center justify-center gap-1 text-white/90 text-[10px] font-medium mt-1 bg-white/10 backdrop-blur-sm self-center mx-auto w-fit px-3 py-1 rounded-full border border-white/20 cursor-pointer active:scale-95 transition-all"
                onClick={() => {
                  const city = prompt("Introduce tu ciudad manualmente:");
                  if (city) {
                    setPosition({
                      latitude: -34.6037, // Centro genérico si es manual
                      longitude: -58.3816,
                      city: city,
                      address: city
                    });
                  }
                }}
              >
                <MapPin className="h-2.5 w-2.5" />
                <span>{userPosition.address}</span>
                <span className="text-[8px] bg-white/20 px-1 rounded ml-1">Cambiar</span>
              </div>
            </div>
          ) : (
            <div 
              className="flex items-center justify-center gap-1 text-white/60 text-[10px] mt-1 italic cursor-pointer"
              onClick={() => {
                const city = prompt("Introduce tu ciudad manualmente:");
                if (city) {
                  setPosition({
                    latitude: -34.6037,
                    longitude: -58.3816,
                    city: city,
                    address: city
                  });
                }
              }}
            >
              {loading ? (
                <>
                  <div className="w-2 h-2 rounded-full border border-white/30 border-t-white animate-spin" />
                  <span>Buscando ubicación...</span>
                </>
              ) : (
                <span>📍 Tocar para elegir ciudad</span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="¿Qué estás buscando?"
              className="pl-10 h-12 bg-white border-none rounded-xl shadow-sm italic text-gray-400"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                if (e.target.value.length === 3) logInteraction('buscador')
              }}
            />
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            className={`h-12 w-12 border-none rounded-xl shadow-sm transition-colors ${isFilterOpen || maxPrice !== "all" || onlyNearby ? "bg-primary text-white" : "bg-white text-primary"}`}
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Categorías</h2>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {mainCategories.map((category, index) => (
              <div
                key={category.name}
                className="flex flex-col items-center gap-2 cursor-pointer min-w-fit"
                onClick={() => handleCategoryClick(category.name)}
              >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all ${index === 0 ? "bg-primary border-primary text-white" : "bg-white border-gray-100 text-primary"}`}>
                  <span className="text-3xl">{category.rawIcon}</span>
                </div>
                <span className="text-sm font-medium text-gray-700">{category.name}</span>
              </div>
            ))}
            <div
              className="flex flex-col items-center gap-2 cursor-pointer min-w-fit"
              onClick={handleVerMasCategorias}
            >
              <div className="w-20 h-20 bg-white border-2 border-gray-100 rounded-full flex items-center justify-center text-primary">
                <Plus className="h-8 w-8" />
              </div>
              <span className="text-sm font-medium text-gray-700">Más</span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-bold">Recomendados</h2>
            {filteredServices.length > 0 && (
              <button onClick={handleVerMas} className="text-sm text-gray-400 font-medium">
                Ver más
              </button>
            )}
          </div>
          {filteredServices.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {filteredServices.slice(0, 4).map((service) => (
                <Card
                  key={service.id}
                  className="cursor-pointer hover:shadow-md transition-shadow flex-shrink-0 w-44 h-64 rounded-2xl overflow-hidden border-none relative"
                  onClick={() => handleServiceClick(service, 'recomendados')}
                >
                  <img
                    src={service.image || "/placeholder.svg"}
                    alt={service.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold truncate">{service.providerName || service.name}</span>
                      <span className="text-[10px] bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-white font-medium">
                        {service.category}
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3 w-3 fill-white text-white" />
                        <span className="text-white font-semibold">
                          {service.rating} ({service.reviews})
                        </span>
                      </div>
                      {calcularDistanciaServicio(service) && (
                        <div className="flex items-center gap-1 text-[10px] text-primary-foreground/80 font-medium">
                          <MapPin className="h-2.5 w-2.5" />
                          <span>A {calcularDistanciaServicio(service)} de ti</span>
                        </div>
                      )}
                    </div>
                  </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No hay servicios recomendados</p>
            <p className="text-sm mt-1">Los servicios aparecer&#225;n aqu&#237; cuando est&#233;n disponibles</p>
          </div>
        )}
        </div>
        </div>

        <div className="pb-8">
          <h2 className="text-xl font-bold mb-4">Cerca tuyo</h2>
          {filteredServices.length > 0 ? (
            <div className="space-y-4">
              {filteredServices.slice(0, 3).map((service) => (
                <Card
                  key={service.id}
                  className="cursor-pointer hover:shadow-sm transition-shadow border-none bg-white rounded-2xl overflow-hidden shadow-sm"
                  onClick={() => handleServiceClick(service, 'cerca_tuyo')}
                >
                  <CardContent className="p-3">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                        <img 
                          src={service.image || "/placeholder.svg"} 
                          alt={service.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-center py-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-primary/5 px-2 py-0.5 rounded-full">
                            {service.category}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm mb-0.5 line-clamp-1">{service.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                          <User className="h-3 w-3" />
                          <span>{service.providerName || 'Particular'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <p className="text-primary font-black text-sm">${service.price}</p>
                          {calcularDistanciaServicio(service) && (
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                              <MapPin className="h-2.5 w-2.5" />
                              <span>A {calcularDistanciaServicio(service)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button className="self-start mt-1 text-gray-300">
                        <Filter className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-3">📍</div>
                  <p className="font-medium text-gray-700">Sin servicios súper cercanos</p>
                  <p className="text-sm mt-1">Comparte tu ubicación para ver quién está a la vuelta de tu casa</p>
                  {!userLocation && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        if ("geolocation" in navigator) {
                          navigator.geolocation.getCurrentPosition(() => window.location.reload())
                        }
                      }}
                    >
                      Permitir ubicación
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Overlay de Filtros */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-t-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
            
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-800">Filtros</h3>
              <button 
                onClick={() => {
                  setMaxPrice("all");
                  setOnlyNearby(false);
                }}
                className="text-primary font-bold text-sm"
              >
                Limpiar todo
              </button>
            </div>

            <div className="space-y-8 mb-10 text-gray-800">
              {/* Filtro de Precio */}
              <div>
                <Label className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 block">
                  Precio máximo: {maxPrice === "all" ? "Todos" : `$${maxPrice}`}
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {[1000, 5000, 10000, 20000].map((price) => (
                    <button
                      key={price}
                      onClick={() => setMaxPrice(price)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${maxPrice === price ? "bg-primary text-white" : "bg-gray-100 text-gray-400"}`}
                    >
                      ${price}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtro de Cercanía */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${onlyNearby ? "bg-primary text-white" : "bg-white text-gray-400"}`}>
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Cerca de mí</p>
                    <p className="text-[10px] text-gray-400">Radio de 10km</p>
                  </div>
                </div>
                <button
                  onClick={() => setOnlyNearby(!onlyNearby)}
                  className={`w-12 h-6 rounded-full transition-all relative ${onlyNearby ? "bg-primary" : "bg-gray-200"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${onlyNearby ? "right-1" : "left-1"}`} />
                </button>
              </div>
            </div>

            <Button 
              className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20"
              onClick={() => setIsFilterOpen(false)}
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 pb-safe z-40">
        <div className="flex justify-around py-3">
          <button onClick={() => setFlow("home")} className="flex flex-col items-center gap-1">
            <div className="text-primary">
              <Home className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-medium text-primary">Inicio</span>
          </button>
          <button onClick={() => setFlow("agenda")} className="flex flex-col items-center gap-1">
            <div className="text-gray-400">
              <Calendar className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-medium text-gray-400">Agenda</span>
          </button>
          <button onClick={() => setFlow("profile")} className="flex flex-col items-center gap-1">
            <div className="text-gray-400">
              <User className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-medium text-gray-400">Perfil</span>
          </button>
        </div>
      </div>
      </>
  )
}

function ServiceDetail({ service, setFlow, bookingSource }: { service: any; setFlow: (flow: string) => void; bookingSource: string }) {
  const { position: userPosition } = useGeolocation()
  const [providerProfile, setProviderProfile] = useState<any>(null)

  // Cargar perfil real del proveedor desde Firestore
  useEffect(() => {
    const loadProvider = async () => {
      if (!service?.providerId) return
      try {
        const { doc, getDoc } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase")
        const userDoc = await getDoc(doc(db, 'users', service.providerId))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setProviderProfile(data)
          
          // Fallback: si el proveedor no tiene ciudad en su perfil, resolverla desde las coordenadas del servicio
          if (!data.city && service.latitude && service.longitude) {
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${service.latitude}&lon=${service.longitude}&zoom=10&addressdetails=1`)
              const geo = await res.json()
              const city = geo.address.city || geo.address.town || geo.address.village || geo.address.suburb || geo.address.state_district || ''
              const state = geo.address.state || ''
              const displayLoc = city && state ? `${city}, ${state}` : city || state || ''
              if (displayLoc) {
                setProviderProfile((prev: any) => ({ ...prev, city: displayLoc }))
              }
            } catch (err) {
              console.error('Error reverse geocoding provider:', err)
            }
          }
        }
      } catch (error) {
        console.error('Error cargando proveedor:', error)
      }
    }
    loadProvider()
  }, [service?.providerId, service?.latitude, service?.longitude])
  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'oklch(0.98 0.01 200)' }}>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Servicio no encontrado</p>
            <Button onClick={() => setFlow("home")}>Volver al inicio</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const providerName = providerProfile?.businessName || providerProfile?.displayName || service.providerName || 'Proveedor'
  const dist = (userPosition && service.latitude && service.longitude)
    ? calcularDistanciaKm(userPosition.latitude, userPosition.longitude, service.latitude, service.longitude)
    : null
  const distText = dist !== null ? formatearDistancia(dist) : null
  const providerCity = providerProfile?.city || ''
  const providerPhone = providerProfile?.phone || ''
  const providerEmail = providerProfile?.email || service.providerEmail || ''
  const providerAvatar = providerProfile?.profileImage || `/placeholder.svg`
  const coverImg = providerProfile?.coverImage || service.image || '/placeholder.svg'
  const businessHours = providerProfile?.businessHours || null

  // Formatear horarios para mostrar un resumen
  const getHoursSummary = () => {
    if (!businessHours) return null
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    const saturday = businessHours.saturday
    const sunday = businessHours.sunday
    const weekdayHours = weekdays.map(d => businessHours[d]).filter(Boolean)
    const allSameWeekday = weekdayHours.every((h: string) => h === weekdayHours[0])
    
    const lines = []
    if (allSameWeekday && weekdayHours[0] && weekdayHours[0] !== 'Cerrado') {
      lines.push({ label: 'Lun a Vie', hours: weekdayHours[0] })
    }
    if (saturday && saturday !== 'Cerrado') {
      lines.push({ label: 'Sábado', hours: saturday })
    }
    if (sunday && sunday !== 'Cerrado') {
      lines.push({ label: 'Domingo', hours: sunday })
    }
    return lines.length > 0 ? lines : null
  }

  const hoursSummary = getHoursSummary()

  return (
    <div className="min-h-screen bg-gray-50 pb-36">
      {/* Cover Image con flecha y badge categoría */}
      <div className="relative">
        <img 
          src={coverImg} 
          alt={service.name} 
          className="w-full h-56 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />
        
        {/* Back button */}
        <button 
          onClick={() => setFlow("home")} 
          className="absolute top-10 left-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>

        {/* Category badge */}
        <div className="absolute top-10 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-md">
          <span className="text-sm font-semibold text-gray-700">{service.category}</span>
        </div>

        {/* Avatar centrado sobre el borde inferior */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-12">
          <div className="w-24 h-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
            <img 
              src={providerAvatar} 
              alt={providerName} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Nombre, ciudad, rating */}
      <div className="text-center mt-14 px-4">
        <h2 className="text-xl font-bold text-gray-800">{providerName}</h2>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
          {providerCity && (
            <div className="flex items-center gap-1 text-sm text-gray-500 font-medium">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span className="max-w-[150px] truncate">{providerCity}</span>
            </div>
          )}
          
          {distText && (
            <div className="flex items-center gap-1 text-[11px] text-primary/70 font-bold bg-primary/5 px-2 py-0.5 rounded-full">
              <span>{distText}</span>
            </div>
          )}

          {(providerCity || distText) && <span className="text-gray-300">•</span>}
          
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold text-gray-700">{service.rating || '0'}</span>
          </div>
        </div>
      </div>

      {/* Contacto */}
      <div className="px-6 mt-6">
        <h3 className="text-sm font-bold text-gray-800 mb-3">Contacto</h3>
        <div className="space-y-2.5">
          {providerPhone && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Phone className="h-3.5 w-3.5 text-primary" />
              </div>
              <span>{providerPhone}</span>
            </div>
          )}
          {providerEmail && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="truncate">{providerEmail}</span>
            </div>
          )}
        </div>
      </div>

      {/* Sobre el servicio */}
      <div className="px-6 mt-6">
        <h3 className="text-sm font-bold text-gray-800 mb-2">Sobre el servicio</h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          {service.description || 'Este proveedor aún no ha agregado una descripción de su servicio.'}
        </p>
      </div>

      {/* Horarios */}
      {hoursSummary && (
        <div className="px-6 mt-6">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              {hoursSummary.map((line: any, i: number) => (
                <p key={i} className="text-sm text-gray-600">
                  <span className="font-medium">{line.label}</span>
                  <br />
                  <span className="text-gray-400">{line.hours.replace(' - ', 'hs a ')}hs</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom sticky bar: Precio + Agendar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 pb-safe z-40">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400">Desde</span>
            <p className="text-xl font-black text-gray-800">${Number(service.price).toLocaleString('es-AR')}</p>
          </div>
          <Button 
            onClick={() => setFlow("booking")} 
            className="h-11 px-8 rounded-xl text-white font-semibold"
            style={{ backgroundColor: '#FF7F50' }}
          >
            Agendar Turner
          </Button>
        </div>
      </div>
    </div>
  )
}

function ServiceReviews({ serviceId }: { serviceId: string }) {
  const { reviews, loading } = useReviews(serviceId)

  return (
    <Card className="bg-white">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-4">Reseñas de vecinos</h3>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Aún no hay reseñas para este servicio.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-medium text-sm">{review.clientName}</p>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < review.rating ? "fill-current" : ""}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


function BookingCalendar({
  service,
  setFlow,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  bookingSource,
}: {
  service: any
  setFlow: (flow: string) => void
  selectedDate: string
  setSelectedDate: (date: string) => void
  selectedTime: string
  setSelectedTime: (time: string) => void
  bookingSource: string
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const { logInteraction } = useAnalytics()

  const availableTimes = ["10:00", "11:30", "15:00", "16:30", "18:00"]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      days.push({
        day,
        dateStr,
        isAvailable: day >= new Date().getDate() || month > new Date().getMonth() || year > new Date().getFullYear(),
      })
    }

    return days
  }

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  const days = getDaysInMonth(currentMonth)

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const handleConfirmBooking = () => {
    if (selectedDate && selectedTime) {
      logInteraction('reserva_btn')
      setFlow("payment")
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'oklch(0.98 0.01 200)' }}>
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setFlow("service-detail")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Agendar Turno</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Service Summary */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold">{service.name}</h3>
            <p className="text-primary font-bold">{service.price}</p>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="font-semibold">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <Button variant="ghost" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => (
                <div key={index} className="aspect-square">
                  {day && (
                    <Button
                      variant={selectedDate === day.dateStr ? "default" : "ghost"}
                      size="sm"
                      className="w-full h-full"
                      disabled={!day.isAvailable}
                      onClick={() => setSelectedDate(day.dateStr)}
                    >
                      {day.day}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Available Times */}
        {selectedDate && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Horarios disponibles</h3>
              <div className="grid grid-cols-3 gap-2">
                {availableTimes.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirm Button */}
        <Button
          onClick={handleConfirmBooking}
          disabled={!selectedDate || !selectedTime}
          className="w-full h-12 text-base"
        >
          Confirmar turno
        </Button>
      </div>
    </div>
  )
}

function PaymentScreen({
  service,
  selectedDate,
  selectedTime,
  setFlow,
  user,
  createBooking,
  bookingSource,
}: {
  service: any
  selectedDate: string
  selectedTime: string
  setFlow: (flow: string) => void
  user: any
  createBooking: (bookingData: any) => Promise<{success: boolean, error?: string}>
  bookingSource: string
}) {
  const [selectedPayment, setSelectedPayment] = useState<string>("")
  const [showTransferDetails, setShowTransferDetails] = useState(false)
  const [loading, setLoading] = useState(false)
  const [providerBankDetails, setProviderBankDetails] = useState<{cbu?: string, alias?: string, accountHolder?: string} | null>(null)
  
  // Obtener datos bancarios reales del proveedor
  useEffect(() => {
    const fetchProviderBankDetails = async () => {
      if (service?.providerId) {
        try {
          const { doc, getDoc } = await import("firebase/firestore")
          const { db } = await import("@/lib/firebase")
          const providerDoc = await getDoc(doc(db, 'users', service.providerId))
          if (providerDoc.exists()) {
            const data = providerDoc.data()
            setProviderBankDetails({
              cbu: data.cbu,
              alias: data.alias,
              accountHolder: data.accountHolder
            })
          }
        } catch (error) {
          console.error("Error fetching provider details:", error)
        }
      }
    }
    fetchProviderBankDetails()
  }, [service?.providerId])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handlePaymentSelect = (method: string) => {
    setSelectedPayment(method)
    if (method === "transfer") {
      setShowTransferDetails(true)
    } else {
      setShowTransferDetails(false)
    }
  }

  const handleConfirmPayment = async () => {
    if (!selectedPayment || !user || !service) {
      alert("Por favor completa todos los campos")
      return
    }

    setLoading(true)

    try {
      const bookingData = {
        serviceId: service.id,
        serviceName: service.name,
        clientId: user.uid,
        clientName: user.displayName || user.email || 'Cliente',
        clientEmail: user.email || '',
        providerId: service.providerId,
        providerName: service.providerName || 'Proveedor',
        date: selectedDate,
        time: selectedTime,
        price: typeof service.price === 'string' ? parseFloat(service.price.replace('$', '')) : service.price,
        status: 'pending' as const,
        paymentMethod: selectedPayment as 'cash' | 'mercadopago' | 'transfer',
        paymentStatus: selectedPayment === 'cash' ? 'pending' as const : 'paid' as const,
        source: bookingSource,
      }

      const result = await createBooking(bookingData)

      if (result.success) {
        setIsSuccess(true)
      } else {
        alert("Error al confirmar el turno. Por favor intenta nuevamente.")
      }
    } catch (error: any) {
      console.error('Error creating booking:', error)
      alert("Error al confirmar el turno. Por favor intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: 'oklch(0.98 0.01 200)' }}>
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <div className="text-4xl text-green-600">✓</div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Reserva Confirmada!</h2>
        <p className="text-gray-600 mb-8 max-w-sm">
          Tu turno para <span className="font-bold text-primary">{service.name}</span> ha sido registrado exitosamente.
        </p>

        <div className="w-full max-w-sm space-y-3">
          <Button
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg"
            onClick={() => {
              setActiveChat({
                partnerId: service.providerId,
                partnerName: service.providerName || "Proveedor"
              })
              setFlow("chat")
            }}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chatear con el profesional
          </Button>
          <Button
            variant="ghost"
            className="w-full h-12 rounded-xl text-gray-500 font-medium"
            onClick={() => setFlow("home")}
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'oklch(0.98 0.01 200)' }}>
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setFlow("booking")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Pago</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Booking Summary */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Resumen de la reserva</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Servicio:</span> {service.name}
              </p>
              <p>
                <span className="font-medium">Fecha:</span> {formatDate(selectedDate)}
              </p>
              <p>
                <span className="font-medium">Hora:</span> {selectedTime}
              </p>
              <p>
                <span className="font-medium">Precio:</span>{" "}
                <span className="text-primary font-bold">{service.price}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Método de pago</h3>
            <div className="space-y-3">
              <Button
                variant={selectedPayment === "cash" ? "default" : "outline"}
                className="w-full justify-start h-12"
                onClick={() => handlePaymentSelect("cash")}
              >
                <Banknote className="h-4 w-4 mr-3" />
                Efectivo
              </Button>

              <Button
                variant={selectedPayment === "mercadopago" ? "default" : "outline"}
                className="w-full justify-start h-12"
                onClick={() => handlePaymentSelect("mercadopago")}
              >
                <CreditCard className="h-4 w-4 mr-3" />
                MercadoPago
              </Button>

              <Button
                variant={selectedPayment === "transfer" ? "default" : "outline"}
                className="w-full justify-start h-12"
                onClick={() => handlePaymentSelect("transfer")}
              >
                <Building2 className="h-4 w-4 mr-3" />
                Transferencia bancaria
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transfer Details */}
        {showTransferDetails && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Datos para transferencia</h3>
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Titular:</span> {providerBankDetails?.accountHolder || service.providerName || service.name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">CBU / CVU:</span> {providerBankDetails?.cbu || "No especificado"}
                </p>
                {providerBankDetails?.alias && (
                  <p className="text-sm">
                    <span className="font-medium">Alias:</span> {providerBankDetails.alias}
                  </p>
                )}
                <p className="text-sm border-t pt-2 mt-2 border-gray-200">
                  <span className="font-medium">Monto:</span> {service.price}
                </p>
              </div>
              <Button variant="outline" className="w-full mt-3 bg-transparent">
                Enviar comprobante
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Confirm Payment */}
        <Button
          onClick={handleConfirmPayment}
          disabled={!selectedPayment || loading}
          className="w-full h-12 text-base"
          variant="orange"
        >
          {loading ? "Confirmando..." : "Confirmar pago"}
        </Button>
      </div>
    </div>
  )
}

function ClientProfile({ setFlow, user, logout, onSwitchToProvider }: { setFlow: (flow: string) => void; user: any; logout: () => Promise<{ success: boolean }>; onSwitchToProvider: () => Promise<{ success: boolean }> }) {
  const { getBookingsByClient } = useBookings()
  const [switchingRole, setSwitchingRole] = useState(false)
  const [showConfirmSwitch, setShowConfirmSwitch] = useState(false)
  const [roleAlert, setRoleAlert] = useState<"success" | "error" | null>(null)
  const [roleAlertMessage, setRoleAlertMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    address: "",
    profileImage: "/placeholder.svg"
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [success, setSuccess] = useState("")

  // Cargar datos del perfil desde Firestore al montar
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uid) return
      try {
        const { doc, getDoc } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase")
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setProfileData(prev => ({
            ...prev,
            name: data.name || data.displayName || user?.displayName || "",
            email: data.email || user?.email || "",
            phone: data.phone || "",
            address: data.address || "",
            profileImage: data.profileImage || "/placeholder.svg"
          }))
        }
      } catch (error) {
        console.error('Error cargando perfil:', error)
      }
    }
    loadProfile()
  }, [user])
  
  const handleLogout = async () => {
    setLoading(true)
    try {
      const result = await logout()
      if (result.success) {
        localStorage.removeItem('userType')
        window.location.reload()
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const { doc, setDoc } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")
      const { updateProfile } = await import("firebase/auth")
      const { auth } = await import("@/lib/firebase")

      if (user?.uid) {
        // Actualizar perfil de Firebase Auth
        if (profileData.name) {
          await updateProfile(auth.currentUser!, { displayName: profileData.name })
        }

        // Actualizar en Firestore
        await setDoc(doc(db, 'users', user.uid), {
          ...profileData,
          updatedAt: new Date()
        }, { merge: true })

        setSuccess("¡Perfil actualizado exitosamente!")
        setIsEditing(false)
        setTimeout(() => setSuccess(""), 3000)
      }
    } catch (error) {
      console.error("Error al guardar perfil:", error)
      setSuccess("Error al guardar el perfil")
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 5MB')
      return
    }

    setUploadingImage(true)
    
    try {
      const { uploadImage } = await import("@/lib/uploadImage")
      const imageUrl = await uploadImage(file, `profiles/${user?.uid}/profile`)
      setProfileData(prev => ({ ...prev, profileImage: imageUrl }))
      
      // Guardar en Firestore inmediatamente
      const { doc, setDoc } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")
      if (user?.uid) {
        await setDoc(doc(db, 'users', user.uid), {
          profileImage: imageUrl,
          updatedAt: new Date()
        }, { merge: true })
      }
      
      setUploadingImage(false)
      setSuccess('¡Imagen de perfil actualizada!')
      setTimeout(() => setSuccess(""), 3000)
    } catch (error: any) {
      console.error('Error subiendo imagen:', error)
      setUploadingImage(false)
      alert(error.message || 'Error al subir la imagen')
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'oklch(0.98 0.01 200)' }}>
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => setFlow("home")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-primary">Mi Perfil</h1>
        </div>
      </div>

      {success && (
        <div className="p-4">
          <CustomAlert
            type="success"
            title="¡Éxito!"
            message={success}
            onClose={() => setSuccess("")}
          />
        </div>
      )}

      <div className="p-4 space-y-4">
        <Card className="bg-white">
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 overflow-hidden">
                  {profileData.profileImage && profileData.profileImage !== "/placeholder.svg" ? (
                    <img
                      src={profileData.profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-primary">
                      {(user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
                    </span>
                  )}
                </div>
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  </div>
                )}
                {isEditing && (
                  <div className="absolute -bottom-2 -right-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="client-profile-upload"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-8 h-8 rounded-full p-0"
                      onClick={() => document.getElementById('client-profile-upload')?.click()}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? '⏳' : '📷'}
                    </Button>
                  </div>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-3 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="client-name">Nombre</Label>
                    <Input
                      id="client-name"
                      value={profileData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-email">Email</Label>
                    <Input
                      id="client-email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-phone">Teléfono</Label>
                    <Input
                      id="client-phone"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="11 1234-5678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-address">Dirección</Label>
                    <Input
                      id="client-address"
                      value={profileData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      placeholder="Calle, número, ciudad"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                      Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="flex-1">
                      {loading ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold">
                    {profileData.name || user?.displayName || 'Usuario'}
                  </h2>
                  <p className="text-muted-foreground">
                    {profileData.email || user?.email || 'Sin email'}
                  </p>
                  {profileData.phone && (
                    <p className="text-sm text-muted-foreground mt-1">
                      📞 {profileData.phone}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    className="w-full bg-transparent mt-4"
                    onClick={() => setIsEditing(true)}
                  >
                    Editar perfil
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Mis reservas</h3>
              <Button variant="ghost" size="sm" onClick={() => setFlow("agenda")}>
                Ver todas
              </Button>
            </div>
            <div className="space-y-2">
              {user ? (
                (() => {
                  const userBookings = getBookingsByClient(user.uid) || []
                  return userBookings.length > 0 ? (
                    userBookings.slice(0, 3).map((booking) => (
                      <div key={booking.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">{booking.serviceName || 'Servicio'}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.date || 'Fecha no disponible'} - {booking.time || 'Hora no disponible'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-blue-100 text-blue-800'
                              }`}>
                              {booking.status === 'confirmed' ? 'Confirmada' :
                                booking.status === 'pending' ? 'Pendiente' :
                                  booking.status === 'cancelled' ? 'Cancelada' :
                                    booking.status === 'completed' ? 'Completada' :
                                      'Desconocido'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ${booking.price || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No tienes reservas aún</p>
                      <p className="text-xs">¡Explora servicios y haz tu primera reserva!</p>
                    </div>
                  )
                })()
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Inicia sesión para ver tus reservas</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {roleAlert && (
          <div className="p-0">
            <CustomAlert
              type={roleAlert}
              title={roleAlert === "success" ? "¡Listo!" : "Error"}
              message={roleAlertMessage}
              onClose={() => { setRoleAlert(null); setRoleAlertMessage("") }}
            />
          </div>
        )}

        <Card className="bg-white">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Cambiar de rol</h3>
            <p className="text-sm text-muted-foreground mb-3">
              ¿Quieres ofrecer tus servicios? Cambia a modo Proveedor para publicar y gestionar tus ofertas.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowConfirmSwitch(true)}
              disabled={switchingRole}
            >
              <Building2 className="h-4 w-4 mr-2" />
              {switchingRole ? "Cambiando..." : "Quiero ser Proveedor"}
            </Button>
          </CardContent>
        </Card>

        <AlertDialog open={showConfirmSwitch} onOpenChange={setShowConfirmSwitch}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Cambiar a modo Proveedor?</AlertDialogTitle>
              <AlertDialogDescription>
                Tendrás acceso al panel para publicar y gestionar tus servicios, ver reservas y tu agenda. Podrás volver a modo Cliente cuando quieras desde tu perfil.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  setShowConfirmSwitch(false)
                  setSwitchingRole(true)
                  setRoleAlert(null)
                  const result = await onSwitchToProvider()
                  setSwitchingRole(false)
                  if (!result.success) {
                    setRoleAlert("error")
                    setRoleAlertMessage("Falló la actualización. Intente más tarde.")
                  }
                }}
              >
                Sí, cambiar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button 
          variant="destructive" 
          className="w-full" 
          onClick={handleLogout}
          disabled={loading}
        >
          {loading ? "Cerrando sesión..." : "Cerrar sesión"}
        </Button>
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 pb-safe z-40">
        <div className="flex justify-around py-3">
          <button onClick={() => setFlow("home")} className="flex flex-col items-center gap-1">
            <div className="text-gray-400">
              <Home className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-medium text-gray-400">Inicio</span>
          </button>
          <button onClick={() => setFlow("agenda")} className="flex flex-col items-center gap-1">
            <div className="text-gray-400">
              <Calendar className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-medium text-gray-400">Agenda</span>
          </button>
          <button onClick={() => setFlow("profile")} className="flex flex-col items-center gap-1">
            <div className="text-primary">
              <User className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-medium text-primary">Perfil</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function ClientAgenda({ setFlow, user, setActiveChat, onBack }: { setFlow: (flow: string) => void; user: any; setActiveChat?: (chat: any) => void; onBack?: () => void }) {
  const { getBookingsByClient, cancelBooking, fetchBookings } = useBookings()
  const { addReview } = useReviews()
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(false)

  // Estado para calificar
  const [showRateModal, setShowRateModal] = useState(false)
  const [ratingBooking, setRatingBooking] = useState<any>(null)
  const [ratingScore, setRatingScore] = useState(5)
  const [ratingComment, setRatingComment] = useState("")

  // Obtener reservas del cliente
  const clientBookings = getBookingsByClient(user?.uid) || []

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
      return
    }

    setLoading(true)
    try {
      const result = await cancelBooking(bookingId)
      if (result.success) {
        await fetchBookings() // Refrescar la lista
        alert('Reserva cancelada exitosamente')
      } else {
        alert('Error al cancelar la reserva')
      }
    } catch (error) {
      console.error('Error canceling booking:', error)
      alert('Error al cancelar la reserva')
    } finally {
      setLoading(false)
    }
  }

  // Generar días del mes actual
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Días del mes anterior (para completar la semana)
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevMonth = new Date(year, month, -i)
      days.push({
        date: prevMonth.getDate(),
        fullDate: prevMonth.toISOString().split('T')[0],
        isCurrentMonth: false,
        bookings: []
      })
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const fullDate = new Date(year, month, day).toISOString().split('T')[0]
      const dayBookings = clientBookings.filter(booking =>
        booking.date === fullDate
      )

      days.push({
        date: day,
        fullDate,
        isCurrentMonth: true,
        bookings: dayBookings
      })
    }

    // Completar con días del siguiente mes
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonth = new Date(year, month + 1, day)
      days.push({
        date: day,
        fullDate: nextMonth.toISOString().split('T')[0],
        isCurrentMonth: false,
        bookings: []
      })
    }

    return days
  }

  const calendarDays = generateCalendarDays()
  const selectedDateBookings = selectedDate ?
    clientBookings.filter(booking => booking.date === selectedDate) : []

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1)
      } else {
        newMonth.setMonth(prev.getMonth() + 1)
      }
      return newMonth
    })
  }

  return (
    <div className="min-h-screen bg-[#f7fdfd] pb-24">
      <div className="p-4 flex items-center justify-between sticky top-0 bg-[#f7fdfd] z-10">
        <button onClick={() => setFlow("home")} className="p-2">
          <ArrowLeft className="h-6 w-6 text-gray-800" />
        </button>
        <h1 className="text-xl font-bold text-gray-800 flex-1 text-center pr-10">Agenda</h1>
      </div>

      <div className="p-6 space-y-8">
        {/* Calendario */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50">
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="text-xl font-bold text-gray-800">
              {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).charAt(0).toUpperCase() + currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).slice(1)}
            </h3>
            <div className="flex items-center gap-6">
              <button 
                onClick={() => navigateMonth('prev')}
                className="text-gray-300 p-1"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button 
                onClick={() => navigateMonth('next')}
                className="text-gray-300 p-1"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-6">
            {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-gray-400">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <button
                key={index}
                onClick={() => {
                  if (day.isCurrentMonth) {
                    setSelectedDate(day.fullDate)
                  }
                }}
                className={`
                  h-10 w-10 mx-auto flex flex-col items-center justify-center text-sm rounded-xl transition-all relative
                  ${day.isCurrentMonth ? 'text-gray-800 font-medium' : 'text-gray-200'}
                  ${selectedDate === day.fullDate ? 'bg-primary text-white shadow-lg' : ''}
                `}
              >
                <span>{day.date}</span>
                {day.bookings.length > 0 && day.isCurrentMonth && selectedDate !== day.fullDate && (
                  <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Listado de citas */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 px-2">Próximas citas</h2>
          
          {(selectedDate ? selectedDateBookings : clientBookings.filter(b => new Date(b.date) >= new Date())).length > 0 ? (
            (selectedDate ? selectedDateBookings : clientBookings.filter(b => new Date(b.date) >= new Date()))
              .slice(0, 5)
              .map((booking) => (
              <Card key={booking.id} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden relative">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${booking.providerName}&background=random`} 
                        alt={booking.providerName} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-800 text-base">{booking.serviceName}</h4>
                      </div>
                      <p className="text-sm text-gray-400 font-medium">{booking.providerName}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="w-4 h-4 rounded-full bg-[#30cad0]/20 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#30cad0]" />
                        </div>
                        <p className="text-xs font-bold text-[#30cad0]">
                          {new Date(booking.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}, {booking.time}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 text-gray-300">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 pb-safe z-20">
        <div className="flex justify-around py-3">
          <button onClick={() => setFlow("home")} className="flex flex-col items-center gap-1">
            <div className="text-gray-400">
              <Home className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-medium text-gray-400">Inicio</span>
          </button>
          <button onClick={() => setFlow("agenda")} className="flex flex-col items-center gap-1">
            <div className="text-primary">
              <Calendar className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-medium text-primary">Agenda</span>
          </button>
          <button onClick={() => setFlow("profile")} className="flex flex-col items-center gap-1">
            <div className="text-gray-400">
              <User className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-medium text-gray-400">Perfil</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function ProviderOnboarding({ setFlow }: { setFlow: (flow: string) => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">Punto Encuentro</h1>
          <p className="text-muted-foreground">Ofrece tus servicios</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <Button onClick={() => setFlow("register")} className="w-full h-12 text-base">
              Registrarse como proveedor
            </Button>

            <Button onClick={() => setFlow("login")} variant="outline" className="w-full h-12 text-base">
              Iniciar sesión
            </Button>
          </CardContent>
        </Card>

        <Button variant="ghost" onClick={() => window.location.reload()} className="w-full">
          ← Volver
        </Button>
      </div>
    </div>
  )
}

function ProviderLogin({
  setFlow,
  signIn,
  setAuthError,
  authError,
  setAuthSuccess,
  authSuccess
}: {
  setFlow: (flow: string) => void
  signIn: (email: string, password: string) => Promise<{ success: boolean, error?: string }>
  setAuthError: (error: string) => void
  authError: string
  setAuthSuccess: (message: string) => void
  authSuccess: string
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError("")

    const result = await signIn(email, password)
    if (result.success) {
      setAuthSuccess("¡Inicio de sesión exitoso!")
      setTimeout(() => {
        setFlow("dashboard")
      }, 1500)
    } else {
      setAuthError(result.error || "Error al iniciar sesión")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <img
            src="/logonuevo.jpeg"
            alt="Punto Encuentro"
            className="w-24 h-24 mx-auto mb-4 rounded-lg object-cover"
          />
          <h1 className="text-3xl font-bold text-primary mb-2">Punto Encuentro</h1>
          <p className="text-muted-foreground">Inicia sesión como proveedor</p>
        </div>

        {authError && (
          <CustomAlert
            type="error"
            title="Error"
            message={authError}
            onClose={() => setAuthError("")}
          />
        )}

        {authSuccess && (
          <CustomAlert
            type="success"
            title="¡Éxito!"
            message={authSuccess}
            onClose={() => setAuthSuccess("")}
          />
        )}

        <Card>
          <CardContent className="p-6 space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider-email">Email</Label>
                <Input
                  id="provider-email"
                  type="email"
                  placeholder="tu@negocio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider-password">Contraseña</Label>
                <Input
                  id="provider-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full h-12 text-base">
                Iniciar sesión
              </Button>
            </form>

            <div className="text-center">
              <Button variant="link" onClick={() => setFlow("register")} className="text-sm text-muted-foreground">
                ¿No tienes cuenta? Regístrate
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button variant="ghost" onClick={() => setFlow("onboarding")} className="w-full">
          ← Volver
        </Button>
      </div>
    </div>
  )
}

function ProviderRegister({
  setFlow,
  signUp,
  setAuthError,
  authError,
  setAuthSuccess,
  authSuccess
}: {
  setFlow: (flow: string) => void
  signUp: (email: string, password: string) => Promise<{ success: boolean, error?: string }>
  setAuthError: (error: string) => void
  authError: string
  setAuthSuccess: (message: string) => void
  authSuccess: string
}) {
  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    phone: "",
    password: "",
  })

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError("")
    setAuthSuccess("")

    try {
      const result = await signUp(formData.email, formData.password)

      if (result.success) {
        // Obtener el usuario actual de Firebase Auth
        const { auth } = await import("@/lib/firebase")
        const currentUser = auth.currentUser

        if (currentUser) {
          // Actualizar perfil con nombre del negocio
          const { updateProfile } = await import("firebase/auth")

          if (formData.businessName) {
            await updateProfile(currentUser, { displayName: formData.businessName })
          }

          // Guardar usuario en Firestore con rol de proveedor
          const { doc, setDoc } = await import("firebase/firestore")
          const { db } = await import("@/lib/firebase")

          await setDoc(doc(db, 'users', currentUser.uid), {
            email: formData.email,
            displayName: formData.businessName,
            phone: formData.phone,
            role: 'provider',
            permissions: [],
            isActive: true,
            isVerified: false, // Requiere verificación del admin
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }

        setAuthSuccess("¡Registro exitoso! Bienvenido a Punto Encuentro")
        setTimeout(() => {
          setFlow("dashboard")
        }, 2000)
      } else {
        setAuthError(result.error || "Error al registrarse")
      }
    } catch (error: any) {
      console.error('Error en registro:', error)
      setAuthError(error.message || "Error al registrarse")
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <img
            src="/logonuevo.jpeg"
            alt="Punto Encuentro"
            className="w-24 h-24 mx-auto mb-4 rounded-lg object-cover"
          />
          <h1 className="text-3xl font-bold text-primary mb-2">Punto Encuentro</h1>
          <p className="text-muted-foreground">Registra tu negocio</p>
        </div>

        {authError && (
          <CustomAlert
            type="error"
            title="Error"
            message={authError}
            onClose={() => setAuthError("")}
          />
        )}

        {authSuccess && (
          <CustomAlert
            type="success"
            title="¡Éxito!"
            message={authSuccess}
            onClose={() => setAuthSuccess("")}
          />
        )}

        <Card>
          <CardContent className="p-6 space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business-name">Nombre del negocio</Label>
                <Input
                  id="business-name"
                  placeholder="Spa Relax"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange("businessName", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-email">Email</Label>
                <Input
                  id="business-email"
                  type="email"
                  placeholder="contacto@sparelax.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-phone">Teléfono</Label>
                <Input
                  id="business-phone"
                  placeholder="11 1234-5678"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-password">Contraseña</Label>
                <Input
                  id="business-password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full h-12 text-base">
                Registrarse
              </Button>
            </form>

            <div className="text-center">
              <Button variant="link" onClick={() => setFlow("login")} className="text-sm text-muted-foreground">
                ¿Ya tienes cuenta? Inicia sesión
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button variant="ghost" onClick={() => setFlow("onboarding")} className="w-full">
          ← Volver
        </Button>
      </div>
    </div>
  )
}

function ProviderDashboard({ setFlow, user, services, logout }: { setFlow: (flow: string) => void; user: any; services: any[]; logout: () => Promise<{ success: boolean }> }) {
  const { getBookingsByProvider } = useBookings()

  // Filtrar servicios del proveedor actual
  const providerServices = (services || []).filter(service => service.providerId === user?.uid)

  // Obtener reservas del proveedor
  const providerBookings = getBookingsByProvider(user?.uid) || []

  // Calcular estadísticas
  const totalClients = new Set(providerBookings.map(booking => booking.clientId)).size
  const totalRevenue = providerBookings
    .filter(booking => booking.paymentStatus === 'paid')
    .reduce((sum, booking) => sum + booking.price, 0)

  // Próximas citas (próximos 7 días)
  const upcomingAppointments = providerBookings
    .filter(booking => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const bookingDate = new Date(booking.date)
      return bookingDate >= today && booking.status === 'confirmed'
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3)

  // Solicitudes pendientes
  const pendingRequests = providerBookings.filter(b => b.status === 'pending')

  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleConfirmBooking = async (bookingId: string) => {
    setLoading(true)
    try {
      await updateBooking(bookingId, { status: 'confirmed' })
      alert('Reserva confirmada')
    } catch (e) {
      alert('Error al confirmar')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('¿Rechazar esta reserva?')) return
    setLoading(true)
    try {
      await updateBooking(bookingId, { status: 'cancelled' })
      alert('Reserva rechazada')
    } catch (e) {
      alert('Error al rechazar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'oklch(0.98 0.01 200)' }}>
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-primary">Panel de Control</h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setFlow("agenda")}>
              Mis Reservas
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setFlow("profile")}>
              Perfil
            </Button>
            <Button variant="ghost" size="sm" onClick={async () => {
              const result = await logout()
              if (result.success) {
                localStorage.removeItem('userType')
                window.location.reload()
              }
            }} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              Salir
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {!isSubscribed && (
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-primary">¡Mejora tu negocio con Premium!</h3>
                  <p className="text-sm text-muted-foreground">Promociones ilimitadas, estadísticas y más</p>
                </div>
                <Button size="sm" onClick={() => setFlow("subscription")}>
                  Ver planes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Requests Alert */}
        {pendingRequests.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  <h3 className="font-bold text-yellow-900">Tienes {pendingRequests.length} solicitudes pendientes</h3>
                </div>
                <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white" onClick={() => setFlow("agenda")}>
                  Ver todas
                </Button>
              </div>
              <div className="space-y-2">
                {pendingRequests.slice(0, 2).map(req => (
                  <div key={req.id} className="bg-white/50 p-3 rounded-lg flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{req.clientName}</p>
                      <p className="text-muted-foreground">{req.serviceName} - {new Date(req.date).toLocaleDateString()} {req.time}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="xs" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleConfirmBooking(req.id)} disabled={loading}>Confirmar</Button>
                      <Button size="xs" variant="outline" className="text-red-600 border-red-200" onClick={() => handleCancelBooking(req.id)} disabled={loading}>Rechazar</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{totalClients}</p>
              <p className="text-sm text-muted-foreground">Clientes únicos</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Ingresos totales</p>
            </CardContent>
          </Card>
        </div>

        {/* Services */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Mis Servicios</h3>
              <Button size="sm" variant="outline" onClick={() => setFlow("services")}>
                <Plus className="h-4 w-4 mr-2" />
                Gestionar servicios
              </Button>
            </div>
            <div className="space-y-3">
              {providerServices.length > 0 ? (
                providerServices.slice(0, 3).map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-muted-foreground">{service.reviews || 0} reservas</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">${service.price}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">No tienes servicios aún</p>
                  <p className="text-xs">¡Crea tu primer servicio!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Próximos Turnos</h3>
              <Button size="sm" variant="outline" onClick={() => setFlow("agenda")}>
                <Calendar className="h-4 w-4 mr-2" />
                Gestionar reservas
              </Button>
            </div>
            <div className="space-y-3">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{appointment.clientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(appointment.date).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit'
                        })} - {appointment.time}
                      </p>
                      <p className="text-xs text-muted-foreground">{appointment.serviceName}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                        {appointment.status === 'confirmed' ? 'Confirmado' :
                          appointment.status === 'pending' ? 'Pendiente' :
                            appointment.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tienes citas próximas</p>
                  <p className="text-xs">Las próximas citas aparecerán aquí</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 pb-safe z-40">
        <div className="flex justify-around py-3">
          <button className="flex flex-col items-center gap-1">
            <Home className="h-6 w-6 text-primary" />
            <span className="text-[10px] font-medium text-primary">Inicio</span>
          </button>
          <button onClick={() => setFlow("agenda")} className="flex flex-col items-center gap-1">
            <Calendar className="h-6 w-6 text-gray-400" />
            <span className="text-[10px] font-medium text-gray-400">Agenda</span>
          </button>
          <button onClick={() => setFlow("profile")} className="flex flex-col items-center gap-1">
            <User className="h-6 w-6 text-gray-400" />
            <span className="text-[10px] font-medium text-gray-400">Perfil</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function ProviderProfile({ setFlow, user, logout, onSwitchToClient, services }: { setFlow: (flow: string) => void; user: any; logout: () => Promise<{ success: boolean }>; onSwitchToClient: () => Promise<{ success: boolean }>; services: any[] }) {
  const { position: userPosition } = useGeolocation()
  const { getBookingsByProvider } = useBookings()
  const providerBookings = getBookingsByProvider(user?.uid) || []
  const providerServices = services.filter((s: any) => s.providerId === user?.uid)

  const [switchingRole, setSwitchingRole] = useState(false)
  const [showConfirmSwitch, setShowConfirmSwitch] = useState(false)
  const [roleAlert, setRoleAlert] = useState<"success" | "error" | null>(null)
  const [roleAlertMessage, setRoleAlertMessage] = useState("")
  const [profileData, setProfileData] = useState({
    businessName: user?.displayName || "Mi Negocio",
    email: user?.email || "",
    phone: "",
    address: "",
    description: "",
    website: "",
    instagram: "",
    facebook: "",
    businessHours: {
      monday: "09:00 - 18:00",
      tuesday: "09:00 - 18:00",
      wednesday: "09:00 - 18:00",
      thursday: "09:00 - 18:00",
      friday: "09:00 - 18:00",
      saturday: "09:00 - 14:00",
      sunday: "Cerrado"
    },
    profileImage: "/placeholder.svg",
    coverImage: "/placeholder.svg",
    city: "",
    cbu: "",
    alias: "",
    accountHolder: "",
    createdAt: null as any
  })

  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")

  // Stats dinámicos (después de profileData)
  const uniqueClients = new Set(providerBookings.map((b: any) => b.clientId)).size
  const avgRating = providerServices.length > 0
    ? (providerServices.reduce((sum: number, s: any) => sum + (s.rating || 0), 0) / providerServices.length).toFixed(1)
    : '0'
  const accountCreatedAt = profileData?.createdAt || user?.metadata?.creationTime
  const experienceYears = accountCreatedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(accountCreatedAt).getTime()) / (1000 * 60 * 60 * 24 * 365)))
    : 0

  // Cargar datos del perfil desde Firestore al montar
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uid) return
      try {
        const { doc, getDoc } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase")
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setProfileData(prev => ({
            ...prev,
            businessName: data.businessName || data.displayName || user?.displayName || "Mi Negocio",
            email: data.email || user?.email || "",
            phone: data.phone || "",
            address: data.address || "",
            description: data.description || "",
            website: data.website || "",
            instagram: data.instagram || "",
            facebook: data.facebook || "",
            profileImage: data.profileImage || "/placeholder.svg",
            coverImage: data.coverImage || "/placeholder.svg",
            city: data.city || "",
            cbu: data.cbu || "",
            alias: data.alias || "",
            accountHolder: data.accountHolder || "",
            createdAt: data.createdAt?.toDate?.() || data.createdAt || null,
            ...(data.businessHours ? { businessHours: data.businessHours } : {})
          }))
        }
      } catch (error) {
        console.error('Error cargando perfil:', error)
      }
    }
    loadProfile()
  }, [user])

  const handleSave = async () => {
    setLoading(true)
    try {
      // Guardar en Firestore
      const { doc, setDoc } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")
      const { updateProfile } = await import("firebase/auth")
      const { auth } = await import("@/lib/firebase")

      if (user?.uid) {
        // Actualizar perfil de Firebase Auth
        if (profileData.businessName) {
          await updateProfile(auth.currentUser!, { displayName: profileData.businessName })
        }

        // Actualizar en Firestore
        await setDoc(doc(db, 'users', user.uid), {
          ...profileData,
          updatedAt: new Date()
        }, { merge: true })

        setSuccess("¡Perfil actualizado exitosamente!")
        setIsEditing(false)
        setTimeout(() => setSuccess(""), 3000)
      }
    } catch (error) {
      console.error("Error al guardar perfil:", error)
      setSuccess("Error al guardar el perfil")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    try {
      const result = await logout()
      if (result.success) {
        localStorage.removeItem('userType')
        window.location.reload()
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }

  const handleHoursChange = (day: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      businessHours: { ...prev.businessHours, [day]: value }
    }))
  }

  const [uploadingImage, setUploadingImage] = useState<'profile' | 'cover' | null>(null)

  const handleImageUpload = async (type: 'profile' | 'cover', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 5MB')
      return
    }

    setUploadingImage(type)
    
    try {
      const { uploadImage } = await import("@/lib/uploadImage")
      const imageUrl = await uploadImage(file, `profiles/${user?.uid}/${type}`)
      
      if (type === 'profile') {
        setProfileData(prev => ({ ...prev, profileImage: imageUrl }))
      } else {
        setProfileData(prev => ({ ...prev, coverImage: imageUrl }))
      }
      
      // Guardar en Firestore inmediatamente
      const { doc, setDoc } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")
      if (user?.uid) {
        await setDoc(doc(db, 'users', user.uid), {
          [type === 'profile' ? 'profileImage' : 'coverImage']: imageUrl,
          updatedAt: new Date()
        }, { merge: true })
      }
      
      setUploadingImage(null)
      setSuccess(`¡Imagen ${type === 'profile' ? 'de perfil' : 'de portada'} actualizada!`)
      setTimeout(() => setSuccess(""), 3000)
    } catch (error: any) {
      console.error('Error subiendo imagen:', error)
      setUploadingImage(null)
      alert(error.message || 'Error al subir la imagen')
    }
  }

  // Si está editando, mostrar el formulario actual sin cambios
  if (isEditing) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'oklch(0.98 0.01 200)' }}>
        <div className="bg-white shadow-sm p-4">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Editar Perfil</h1>
          </div>
        </div>

        {success && (
          <div className="p-4">
            <CustomAlert type="success" title="¡Éxito!" message={success} onClose={() => setSuccess("")} />
          </div>
        )}

        <div className="p-4 space-y-6">
          {/* Cover Image */}
          <Card>
            <CardContent className="p-0">
              <div className="relative h-32 bg-gradient-to-r from-primary/20 to-primary/10 rounded-t-lg">
                <img src={profileData.coverImage} alt="Cover" className="w-full h-full object-cover rounded-t-lg" />
                <div className="absolute inset-0 bg-black/20 rounded-t-lg" />
                {uploadingImage === 'cover' && (
                  <div className="absolute inset-0 bg-black/50 rounded-t-lg flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-sm">Subiendo imagen...</p>
                    </div>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload('cover', e)} className="hidden" id="cover-upload" />
                  <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); document.getElementById('cover-upload')?.click() }} disabled={uploadingImage === 'cover'}>
                    {uploadingImage === 'cover' ? 'Subiendo...' : 'Cambiar portada'}
                  </Button>
                </div>
              </div>

              <div className="relative px-6 pb-6">
                <div className="flex items-end -mt-12 gap-4">
                  <div className="relative">
                    <img src={profileData.profileImage} alt="Profile" className="w-24 h-24 rounded-full border-4 border-white object-cover" />
                    {uploadingImage === 'profile' && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      </div>
                    )}
                    <div className="absolute -bottom-2 -right-2">
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload('profile', e)} className="hidden" id="profile-upload" />
                      <Button size="sm" variant="secondary" className="w-8 h-8 rounded-full p-0" onClick={(e) => { e.stopPropagation(); document.getElementById('profile-upload')?.click() }} disabled={uploadingImage === 'profile'}>
                        {uploadingImage === 'profile' ? '⏳' : '📷'}
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 pb-2">
                    <h2 className="text-xl font-semibold">{profileData.businessName}</h2>
                    <p className="text-muted-foreground">{profileData.email}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Information Form */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Información del Negocio</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business-name">Nombre del Negocio</Label>
                    <Input id="business-name" value={profileData.businessName} onChange={(e) => handleInputChange("businessName", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" value={profileData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} placeholder="11 1234-5678" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad / Localidad</Label>
                  <Input id="city" value={profileData.city} onChange={(e) => handleInputChange("city", e.target.value)} placeholder="Ej: Carmen de Areco" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input id="address" value={profileData.address} onChange={(e) => handleInputChange("address", e.target.value)} placeholder="Av. Corrientes 1234, CABA" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <textarea id="description" className="w-full p-3 border border-gray-300 rounded-md resize-none" rows={3} value={profileData.description} onChange={(e) => handleInputChange("description", e.target.value)} placeholder="Describe tu negocio y servicios..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Sitio Web</Label>
                    <Input id="website" value={profileData.website} onChange={(e) => handleInputChange("website", e.target.value)} placeholder="https://minegocio.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input id="instagram" value={profileData.instagram} onChange={(e) => handleInputChange("instagram", e.target.value)} placeholder="@minegocio" />
                  </div>
                </div>
              </div>

              {/* Datos Bancarios */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h4 className="text-md font-semibold mb-4 text-primary">Datos para recibir transferencias</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountHolder">Nombre del Titular</Label>
                    <Input id="accountHolder" placeholder="Ej: Juan Pérez" value={profileData.accountHolder} onChange={(e) => handleInputChange("accountHolder", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cbu">CBU / CVU</Label>
                    <Input id="cbu" placeholder="Ej: 0000003100012345678901" value={profileData.cbu} onChange={(e) => handleInputChange("cbu", e.target.value)} />
                  </div>
                  <div className="space-y-2 md:col-span-2 text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                    <span className="font-medium mr-2">O</span>
                    <Label htmlFor="alias" className="mr-2">Alias:</Label>
                    <Input id="alias" placeholder="Ej: mi.negocio.mp" value={profileData.alias} onChange={(e) => handleInputChange("alias", e.target.value)} className="inline-block w-auto max-w-[250px]" />
                  </div>
                </div>
              </div>

              {/* Horarios */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h4 className="text-md font-semibold mb-4">Horarios de Atención</h4>
                <div className="space-y-3">
                  {Object.entries(profileData.businessHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center justify-between">
                      <span className="capitalize font-medium">{day === 'monday' ? 'Lunes' : day === 'tuesday' ? 'Martes' : day === 'wednesday' ? 'Miércoles' : day === 'thursday' ? 'Jueves' : day === 'friday' ? 'Viernes' : day === 'saturday' ? 'Sábado' : 'Domingo'}</span>
                      <Input value={hours} onChange={(e) => handleHoursChange(day, e.target.value)} className="w-32 text-right" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">Cancelar</Button>
                <Button onClick={handleSave} disabled={loading} className="flex-1">{loading ? "Guardando..." : "Guardar Cambios"}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Vista principal del perfil (diseño nuevo tipo imagen de referencia)
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header curvo teal con avatar centrado */}
      <div className="relative">
        <div className="bg-primary pt-10 pb-16 px-4 rounded-b-[2.5rem]">
          <div className="flex items-center justify-between text-white">
            <button onClick={() => setFlow("dashboard")} className="p-2">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold">Perfil</h1>
            <div className="w-10" />
          </div>
        </div>

        {/* Avatar centrado sobre el borde del header */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-14">
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 border-primary bg-white overflow-hidden shadow-lg">
              <img 
                src={profileData.profileImage} 
                alt={profileData.businessName} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Nombre y ciudad */}
      <div className="text-center mt-16 px-4">
        <h2 className="text-xl font-bold text-gray-800">{profileData.businessName}</h2>
        {(profileData.city || userPosition?.address) && (
          <p className="text-sm text-primary font-medium flex items-center justify-center gap-1 mt-1">
            <MapPin className="h-3.5 w-3.5" />
            {profileData.city || userPosition?.address}
          </p>
        )}
      </div>

      {/* Stats Row */}
      <div className="flex justify-center gap-8 mt-5 px-6">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-lg font-black text-gray-800">+{uniqueClients}</span>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">Clientes</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-primary" />
            <span className="text-lg font-black text-gray-800">{avgRating}</span>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">Calificación</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-lg font-black text-gray-800">{experienceYears > 0 ? experienceYears : '<1'}</span>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">{experienceYears === 1 ? 'año' : 'años'}</span>
        </div>
      </div>

      {/* Info pills */}
      <div className="px-6 mt-6 space-y-3">
        {profileData.email && (
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <span className="truncate">{profileData.email}</span>
          </div>
        )}
        {profileData.phone && (
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Phone className="h-4 w-4 text-primary" />
            </div>
            <span>{profileData.phone}</span>
          </div>
        )}
        {profileData.address && (
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <span>{profileData.address}</span>
          </div>
        )}
      </div>

      {/* Botón Editar Perfil */}
      <div className="px-6 mt-6">
        <Button 
          onClick={() => setIsEditing(true)} 
          className="w-full h-11 rounded-xl text-white font-semibold"
          style={{ backgroundColor: '#FF7F50' }}
        >
          Editar perfil
        </Button>
      </div>

      {success && (
        <div className="px-6 mt-4">
          <CustomAlert type="success" title="¡Éxito!" message={success} onClose={() => setSuccess("")} />
        </div>
      )}

      {roleAlert && (
        <div className="px-6 mt-4">
          <CustomAlert type={roleAlert} title={roleAlert === "success" ? "¡Listo!" : "Error"} message={roleAlertMessage} onClose={() => { setRoleAlert(null); setRoleAlertMessage("") }} />
        </div>
      )}

      {/* Sección Otros */}
      <div className="px-6 mt-6">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Otros</h3>
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-0 divide-y divide-gray-50">
            <button onClick={() => setFlow("services")} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Settings className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-gray-700">Mis servicios</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </button>
            <button onClick={() => setFlow("statistics")} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-gray-700">Mis estadísticas</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </button>
            <button onClick={() => setFlow("subscription")} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Star className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-gray-700">Mi suscripción</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </button>
            <button onClick={() => setShowConfirmSwitch(true)} disabled={switchingRole} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-gray-700">{switchingRole ? "Cambiando..." : "Quiero ser Cliente"}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Cerrar sesión */}
      <div className="px-6 mt-4">
        <button onClick={handleLogout} disabled={loading} className="w-full text-center text-sm text-red-400 font-medium py-3">
          {loading ? "Cerrando sesión..." : "Cerrar sesión"}
        </button>
      </div>

      {/* Alert Dialog para cambio de rol */}
      <AlertDialog open={showConfirmSwitch} onOpenChange={setShowConfirmSwitch}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar a modo Cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Tendrás acceso a buscar servicios, hacer reservas y ver tu agenda. Podrás volver a modo Proveedor cuando quieras desde tu perfil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              setShowConfirmSwitch(false)
              setSwitchingRole(true)
              setRoleAlert(null)
              const result = await onSwitchToClient()
              setSwitchingRole(false)
              if (!result.success) {
                setRoleAlert("error")
                setRoleAlertMessage("Falló la actualización. Intente más tarde.")
              }
            }}>
              Sí, cambiar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 pb-safe z-40">
        <div className="flex justify-around py-3">
          <button onClick={() => setFlow("dashboard")} className="flex flex-col items-center gap-1">
            <Home className="h-6 w-6 text-gray-400" />
            <span className="text-[10px] font-medium text-gray-400">Inicio</span>
          </button>
          <button onClick={() => setFlow("agenda")} className="flex flex-col items-center gap-1">
            <Calendar className="h-6 w-6 text-gray-400" />
            <span className="text-[10px] font-medium text-gray-400">Agenda</span>
          </button>
          <button className="flex flex-col items-center gap-1">
            <User className="h-6 w-6 text-primary" />
            <span className="text-[10px] font-medium text-primary">Perfil</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function ProviderAgenda({ setFlow, user, setActiveChat }: { setFlow: (flow: string) => void; user: any; setActiveChat: (chat: any) => void }) {
  const { getBookingsByProvider, updateBooking, fetchBookings } = useBookings()
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(false)

  // Obtener reservas del proveedor
  const providerBookings = getBookingsByProvider(user?.uid) || []

  const handleConfirmBooking = async (bookingId: string) => {
    setLoading(true)
    try {
      const result = await updateBooking(bookingId, { status: 'confirmed' })
      if (result.success) {
        await fetchBookings()
        alert('Reserva confirmada exitosamente')
      } else {
        alert('Error al confirmar la reserva')
      }
    } catch (error) {
      console.error('Error confirming booking:', error)
      alert('Error al confirmar la reserva')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
      return
    }

    setLoading(true)
    try {
      const result = await updateBooking(bookingId, { status: 'cancelled' })
      if (result.success) {
        await fetchBookings()
        alert('Reserva cancelada exitosamente')
      } else {
        alert('Error al cancelar la reserva')
      }
    } catch (error) {
      console.error('Error canceling booking:', error)
      alert('Error al cancelar la reserva')
    } finally {
      setLoading(false)
    }
  }

  // Generar días del mes actual
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Días del mes anterior (para completar la semana)
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevMonth = new Date(year, month, -i)
      days.push({
        date: prevMonth.getDate(),
        fullDate: prevMonth.toISOString().split('T')[0],
        isCurrentMonth: false,
        bookings: []
      })
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const fullDate = new Date(year, month, day).toISOString().split('T')[0]
      const dayBookings = providerBookings.filter(booking =>
        booking.date === fullDate
      )

      days.push({
        date: day,
        fullDate,
        isCurrentMonth: true,
        bookings: dayBookings
      })
    }

    // Completar con días del siguiente mes
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonth = new Date(year, month + 1, day)
      days.push({
        date: day,
        fullDate: nextMonth.toISOString().split('T')[0],
        isCurrentMonth: false,
        bookings: []
      })
    }

    return days
  }

  const calendarDays = generateCalendarDays()
  const selectedDateBookings = selectedDate ?
    providerBookings.filter(booking => booking.date === selectedDate) : []

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1)
      } else {
        newMonth.setMonth(prev.getMonth() + 1)
      }
      return newMonth
    })
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'oklch(0.99 0.01 200)' }}>
      {/* Header Premium */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-100 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFlow("dashboard")}
              className="rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mis Reservas</h1>
              <p className="text-xs text-muted-foreground">Gestiona tus próximos turnos</p>
            </div>
          </div>
          <div className="bg-primary/10 p-2 rounded-full">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Calendario Moderno */}
        <Card className="overflow-hidden border-none shadow-xl shadow-gray-200/50 bg-white/50 backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="p-6 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  Calendario
                </h3>
                <div className="flex items-center gap-1 bg-white p-1 rounded-full shadow-sm border border-gray-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => navigateMonth('prev')}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-bold min-w-[140px] text-center capitalize">
                    {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full rotate-180"
                    onClick={() => navigateMonth('next')}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, i) => (
                  <div key={i} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Días del calendario */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => {
                  const isToday = day.fullDate === new Date().toISOString().split('T')[0];
                  const isSelected = selectedDate === day.fullDate;
                  const hasBookings = day.bookings.length > 0 && day.isCurrentMonth;
                  const hasPending = day.isCurrentMonth && day.bookings.some(b => b.status === 'pending');

                  return (
                    <button
                      key={index}
                      onClick={() => day.isCurrentMonth && setSelectedDate(day.fullDate)}
                      className={`
                        relative aspect-square flex flex-col items-center justify-center rounded-xl transition-all duration-200
                        ${day.isCurrentMonth
                          ? 'hover:bg-primary/5 active:scale-90 cursor-pointer'
                          : 'opacity-20 cursor-default'}
                        ${isSelected
                          ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105 z-10'
                          : 'text-gray-700'}
                        ${isToday && !isSelected ? 'border-2 border-primary/20 bg-primary/5' : ''}
                      `}
                    >
                      <span className={`text-sm font-bold ${isSelected ? 'text-white' : ''}`}>
                        {day.date}
                      </span>
                      {hasBookings && (
                        <span className={`
                          absolute bottom-1.5 w-1.5 h-1.5 rounded-full
                          ${isSelected ? 'bg-white' : (hasPending ? 'bg-yellow-500 animate-pulse' : 'bg-green-500')}
                        `} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Citas del día seleccionado */}
        {selectedDate && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-gray-800 capitalize flex items-center gap-2">
                <div className="w-1.5 h-6 bg-primary rounded-full" />
                Citas del {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </h3>
              <span className="text-xs font-medium text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">
                {selectedDateBookings.length} {selectedDateBookings.length === 1 ? 'cita' : 'citas'}
              </span>
            </div>

            <div className="space-y-3">
              {selectedDateBookings.length > 0 ? (
                selectedDateBookings.map((booking) => (
                  <Card key={booking.id} className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white">
                    <CardContent className="p-0">
                      <div className="flex h-full">
                        <div className={`w-1.5 ${booking.status === 'confirmed' ? 'bg-green-500' :
                          booking.status === 'pending' ? 'bg-yellow-500' :
                            booking.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'
                          }`} />
                        <div className="flex-1 p-4 lg:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                              <User className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-gray-900">{booking.clientName}</h4>
                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                                  ${booking.price}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                                <MessageSquare className="h-3.5 w-3.5" />
                                {booking.serviceName}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                                <Clock className="h-3 w-3" />
                                {booking.time}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                  'bg-blue-100 text-blue-700'
                              }`}>
                              {booking.status === 'confirmed' ? 'Confirmada' :
                                booking.status === 'pending' ? 'Pendiente' :
                                  booking.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                            </span>

                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setActiveChat({
                                    partnerId: booking.clientId,
                                    partnerName: booking.clientName || "Cliente"
                                  })
                                  setFlow("chat")
                                }}
                                className="h-10 w-12 p-0 bg-primary/5 text-primary hover:bg-primary/10 rounded-xl flex flex-col items-center justify-center transition-all active:scale-90 border border-primary/10 shadow-sm"
                                title="Chatear con el cliente"
                              >
                                <div className="relative">
                                  <MessageSquare className="h-4 w-4" />
                                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary rounded-full border border-white"></span>
                                </div>
                                <span className="text-[8px] font-black uppercase mt-0.5">Chat</span>
                              </Button>

                              {booking.status === 'confirmed' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={async () => {
                                      setLoading(true)
                                      try {
                                        await updateBooking(booking.id, { status: 'completed' })
                                        alert('Servicio completado')
                                      } finally {
                                        setLoading(false)
                                      }
                                    }}
                                    disabled={loading}
                                    className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4"
                                  >
                                    Finalizar
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCancelBooking(booking.id)}
                                    disabled={loading}
                                    className="h-8 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg px-4"
                                  >
                                    Cancelar
                                  </Button>
                                </>
                              )}
                              {booking.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleConfirmBooking(booking.id)}
                                    disabled={loading}
                                    className="h-8 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg px-4"
                                  >
                                    Confirmar
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCancelBooking(booking.id)}
                                    disabled={loading}
                                    className="h-8 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg px-4"
                                  >
                                    Rechazar
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 rounded-3xl bg-white/30 border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 opacity-50">
                    <Clock className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium text-center">No hay citas para este día</p>
                  <p className="text-xs text-muted-foreground text-center mt-1">Tu agenda está despejada</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Todas las citas (Historial) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-gray-300 rounded-full" />
              Historial de Solicitudes
            </h3>
            <span className="text-xs font-medium text-muted-foreground">Recientes</span>
          </div>

          <div className="grid gap-3">
            {providerBookings.length > 0 ? (
              providerBookings.slice(0, 10).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-50 hover:border-primary/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-primary/5 transition-colors">
                    <User className={`h-5 w-5 ${booking.status === 'confirmed' ? 'text-green-500' :
                      booking.status === 'pending' ? 'text-yellow-500' : 'text-gray-400'
                      }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">{booking.clientName}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground font-medium">
                        {new Date(booking.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} • {booking.time}
                      </p>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <p className="text-xs text-muted-foreground truncate">{booking.serviceName}</p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActiveChat({
                          partnerId: booking.clientId,
                          partnerName: booking.clientName || "Cliente"
                        })
                        setFlow("chat")
                      }}
                      className="h-10 w-12 p-0 bg-gray-50 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl flex flex-col items-center justify-center transition-all active:scale-90 border border-gray-100"
                      title="Chatear"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span className="text-[8px] font-black uppercase mt-0.5">Chat</span>
                    </Button>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${booking.status === 'confirmed' ? 'bg-green-50 text-green-600 border border-green-100' :
                      booking.status === 'pending' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                        'bg-gray-50 text-gray-500 border border-gray-100'
                      }`}>
                      {booking.status === 'confirmed' ? 'Ok' :
                        booking.status === 'pending' ? 'Pending' :
                          booking.status === 'cancelled' ? 'X' : 'Done'}
                    </span>
                    {booking.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleConfirmBooking(booking.id)}
                        className="h-8 w-8 p-0 rounded-full text-green-600 hover:bg-green-50"
                      >
                        ✓
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-white rounded-3xl border border-gray-100 italic text-gray-400 text-sm">
                No hay historial de citas
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


function ProviderServices({ setFlow, services, user, setSelectedProviderService }: { setFlow: (flow: string) => void; services: any[]; user: any; setSelectedProviderService: (service: any) => void }) {
  const { getBookingsByProvider } = useBookings()
  const { deleteService, updateService } = useServices()

  // Filtrar servicios del proveedor actual
  const providerServices = services.filter(service => service.providerId === user?.uid)

  // Obtener reservas para cada servicio
  const servicesWithBookings = providerServices.map(service => {
    const serviceBookings = getBookingsByProvider(user?.uid).filter(booking => booking.serviceId === service.id)
    return {
      ...service,
      bookings: serviceBookings.length,
      active: (service as any).active !== false
    }
  })

  const handleDeleteService = async (serviceId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este servicio?")) {
      const result = await deleteService(serviceId)
      if (result.success) {
        alert("Servicio eliminado exitosamente")
      } else {
        alert("Error al eliminar el servicio")
      }
    }
  }

  const toggleServiceStatus = async (serviceId: string) => {
    const service = providerServices.find(s => s.id === serviceId)
    if (service) {
      const newStatus = (service as any).active === false
      const result = await updateService(serviceId, { active: newStatus } as any)
      if (result.success) {
        alert(`Servicio ${newStatus ? 'activado' : 'desactivado'} exitosamente`)
      }
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'oklch(0.98 0.01 200)' }}>
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => setFlow("dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Gestión de Servicios</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Create Service Button */}
        <Button onClick={() => setFlow("create-service")} className="w-full h-12 text-base">
          <Plus className="h-4 w-4 mr-2" />
          Crear nuevo servicio
        </Button>

        {/* Services List */}
        <div className="space-y-3">
          {servicesWithBookings.length > 0 ? (
            servicesWithBookings.map((service) => (
              <Card key={service.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{service.name}</h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${service.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {service.active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Duración: {service.duration}</span>
                        <span>Categoría: {service.category}</span>
                        <span>{service.bookings} reservas</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary mb-2">${service.price}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => {
                      setSelectedProviderService(service)
                      setFlow("edit-service")
                    }}>
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleServiceStatus(service.id)}>
                      {service.active ? "Desactivar" : "Activar"}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteService(service.id)}>
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No tienes servicios aún</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crea tu primer servicio para empezar a recibir reservas
                </p>
                <Button onClick={() => setFlow("create-service")}>
                  Crear mi primer servicio
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function CreateService({
  setFlow,
  createService,
  user,
  userLocation
}: {
  setFlow: (flow: string) => void
  createService: (serviceData: any) => Promise<{ success: boolean, error?: string }>
  user: any
  userLocation: { lat: number, lng: number } | null
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    category: "",
    latitude: null as number | null,
    longitude: null as number | null,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const { categories } = useCategories()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const serviceData: any = {
        name: formData.name,
        description: formData.description,
        price: parseInt(formData.price),
        duration: formData.duration,
        category: formData.category,
        providerId: user?.uid,
        providerName: user?.displayName || "Proveedor",
        rating: 0,
        reviews: 0,
        image: imageUrl,
        lat: userLocation?.lat || null,
        lng: userLocation?.lng || null,
        active: true
      }
      // Subir imagen si fue seleccionada
      if (imageFile) {
        try {
          const { uploadImage } = await import("@/lib/uploadImage")
          const imageUrl = await uploadImage(imageFile, `services/${user?.uid}`)
          serviceData.image = imageUrl
        } catch (imgErr: any) {
          setError(imgErr.message || "Error al subir la imagen")
          setLoading(false)
          return
        }
      }
      // Agregar ubicación si fue capturada
      if (formData.latitude !== null && formData.longitude !== null) {
        serviceData.latitude = formData.latitude
        serviceData.longitude = formData.longitude
      }

      const result = await createService(serviceData)
      if (result.success) {
        setSuccess("¡Servicio creado exitosamente!")
        setTimeout(() => {
          setFlow("services")
        }, 1500)
      } else {
        setError(result.error || "Error al crear el servicio")
      }
    } catch (err) {
      setError("Error al crear el servicio")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'oklch(0.98 0.01 200)' }}>
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => setFlow("services")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Crear Servicio</h1>
        </div>
      </div>

      <div className="p-4">
        {error && (
          <CustomAlert
            type="error"
            title="Error"
            message={error}
            onClose={() => setError("")}
          />
        )}

        {success && (
          <CustomAlert
            type="success"
            title="¡Éxito!"
            message={success}
            onClose={() => setSuccess("")}
          />
        )}

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Imagen del servicio */}
              <div className="space-y-2">
                <Label>Imagen del servicio</Label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">📷</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setImageFile(file)
                          setImagePreview(URL.createObjectURL(file))
                        }
                      }}
                      className="hidden"
                      id="create-service-image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => document.getElementById('create-service-image-upload')?.click()}
                    >
                      {imagePreview ? 'Cambiar imagen' : 'Seleccionar imagen'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG. Máximo 5 MB</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-name">Nombre del servicio</Label>
                <Input
                  id="service-name"
                  placeholder="Ej: Masaje relajante"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-description">Descripción</Label>
                <textarea
                  id="service-description"
                  className="w-full p-3 border border-input rounded-md resize-none"
                  rows={3}
                  placeholder="Describe tu servicio..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-image">Imagen del servicio</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="service-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                  {imageFile && (
                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {imageFile.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service-price">Precio</Label>
                  <Input
                    id="service-price"
                    placeholder="$5000"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service-duration">Duración</Label>
                  <Input
                    id="service-duration"
                    placeholder="60 min"
                    value={formData.duration}
                    onChange={(e) => handleInputChange("duration", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-category">Categoría</Label>
                <select
                  id="service-category"
                  className="w-full p-3 border border-input rounded-md"
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  <optgroup label="Categorías Base">
                    {categories.filter(c => c.isBase).map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Categorías Agregadas">
                    {categories.filter(c => !c.isBase).map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Botón de ubicación */}
              <div className="space-y-2">
                <Label>Ubicación del servicio</Label>
                <Button
                  type="button"
                  variant="outline"
                  className={`w-full ${locationStatus === 'success' ? 'border-green-500 text-green-600' : ''}`}
                  disabled={locationStatus === 'loading'}
                  onClick={async () => {
                    setLocationStatus('loading')
                    try {
                      let lat, lon;
                      if (Capacitor.isNativePlatform()) {
                        const permissions = await Geolocation.checkPermissions()
                        if (permissions.location !== 'granted') {
                          await Geolocation.requestPermissions()
                        }
                        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 })
                        lat = pos.coords.latitude
                        lon = pos.coords.longitude
                      } else {
                        const pos = await new Promise<any>((resolve, reject) => {
                          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
                        })
                        lat = pos.coords.latitude
                        lon = pos.coords.longitude
                      }
                      
                      setFormData(prev => ({ ...prev, latitude: lat, longitude: lon }))
                      setLocationStatus('success')
                    } catch (err) {
                      console.error('Error capturando ubicación:', err)
                      setLocationStatus('error')
                      const manualCity = prompt("No pudimos obtener tu GPS. Por seguridad, introduce el nombre de tu ciudad/barrio para continuar:");
                      if (manualCity) {
                        setFormData(prev => ({ ...prev, latitude: -34.6, longitude: -58.4 })) // Coordenadas genéricas
                        setLocationStatus('success')
                      }
                    }
                  }}
                >
                  {locationStatus === 'loading' ? '⏳ Obteniendo GPS...' : 
                   locationStatus === 'success' ? '✅ Ubicación guardada' : 
                   '📍 Usar mi ubicación actual'}
                </Button>
                {locationStatus === 'error' && (
                  <p className="text-[10px] text-red-500 font-medium mt-1">Asegúrate de tener el GPS activado y dar permisos.</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">Permite que los clientes vean si estás cerca de ellos.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Creando..." : "Crear servicio"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setFlow("services")} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function EditService({ setFlow, service, user, updateService, userLocation }: {
  setFlow: (flow: string) => void
  service: any
  user: any
  updateService?: (id: string, data: any) => Promise<{success: boolean, error?: string}>
}) {
  const { updateService: updateServiceHook } = useServices()
  const updateServiceFn = updateService || updateServiceHook

  const [formData, setFormData] = useState({
    name: service?.name || "",
    description: service?.description || "",
    price: service?.price?.toString() || "",
    duration: (service as any)?.duration || "",
    category: service?.category || "",
    latitude: service?.latitude || null,
    longitude: service?.longitude || null,
  })
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(service?.image || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const { categories } = useCategories()

  // Cargar datos del servicio cuando cambie
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || "",
        description: service.description || "",
        price: service.price?.toString() || "",
        duration: (service as any)?.duration || "",
        category: service.category || "",
        latitude: service.latitude || null,
        longitude: service.longitude || null,
      })
    }
  }, [service])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!service?.id) {
      setError("No se encontró el servicio a editar")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const serviceData: any = {
        name: formData.name,
        description: formData.description,
        price: parseInt(formData.price.replace('$', '').replace(/\./g, '')) || parseInt(formData.price),
        duration: formData.duration,
        category: formData.category,
        latitude: formData.latitude,
        longitude: formData.longitude,
      }
      // Subir nueva imagen si fue seleccionada
      if (imageFile) {
        try {
          const { uploadImage } = await import("@/lib/uploadImage")
          const imageUrl = await uploadImage(imageFile, `services/${service.id}`)
          serviceData.image = imageUrl
        } catch (imgErr: any) {
          setError(imgErr.message || "Error al subir la imagen")
          setLoading(false)
          return
        }
      }

      const result = await updateServiceFn(service.id, serviceData)

      if (result.success) {
        setSuccess("¡Servicio actualizado exitosamente!")
        setTimeout(() => {
          setFlow("services")
        }, 1500)
      } else {
        setError(result.error || "Error al actualizar el servicio")
      }
    } catch (err: any) {
      setError(err.message || "Error al actualizar el servicio")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'oklch(0.98 0.01 200)' }}>
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => setFlow("services")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Editar Servicio</h1>
        </div>
      </div>

      <div className="p-4">
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Imagen del servicio */}
              <div className="space-y-2">
                <Label>Imagen del servicio</Label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300">
                    {imagePreview && imagePreview !== '/placeholder.svg' ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">📷</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setImageFile(file)
                          setImagePreview(URL.createObjectURL(file))
                        }
                      }}
                      className="hidden"
                      id="edit-service-image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => document.getElementById('edit-service-image-upload')?.click()}
                    >
                      {imagePreview && imagePreview !== '/placeholder.svg' ? 'Cambiar imagen' : 'Seleccionar imagen'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG. Máximo 5 MB</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-service-name">Nombre del servicio</Label>
                <Input
                  id="edit-service-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-service-description">Descripción</Label>
                <textarea
                  id="edit-service-description"
                  className="w-full p-3 border border-input rounded-md resize-none"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-service-price">Precio</Label>
                  <Input
                    id="edit-service-price"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-service-duration">Duración</Label>
                  <Input
                    id="edit-service-duration"
                    value={formData.duration}
                    onChange={(e) => handleInputChange("duration", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-service-category">Categoría</Label>
                <select
                  id="edit-service-category"
                  className="w-full p-3 border border-input rounded-md"
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  <optgroup label="Categorías Base">
                    {categories.filter(c => c.isBase).map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Categorías Agregadas">
                    {categories.filter(c => !c.isBase).map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Botón de ubicación */}
              <div className="space-y-2">
                <Label>Ubicación del servicio</Label>
                <Button
                  type="button"
                  variant="outline"
                  className={`w-full ${locationStatus === 'success' ? 'border-green-500 text-green-600' : ''}`}
                  disabled={locationStatus === 'loading'}
                  onClick={async () => {
                    setLocationStatus('loading')
                    try {
                      let lat, lon;
                      if (Capacitor.isNativePlatform()) {
                        const permissions = await Geolocation.checkPermissions()
                        if (permissions.location !== 'granted') {
                          await Geolocation.requestPermissions()
                        }
                        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 })
                        lat = pos.coords.latitude
                        lon = pos.coords.longitude
                      } else {
                        const pos = await new Promise<any>((resolve, reject) => {
                          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
                        })
                        lat = pos.coords.latitude
                        lon = pos.coords.longitude
                      }
                      
                      setFormData(prev => ({ ...prev, latitude: lat, longitude: lon }))
                      setLocationStatus('success')
                    } catch (err) {
                      console.error('Error capturando ubicación:', err)
                      setLocationStatus('error')
                      const manualCity = prompt("No pudimos obtener tu GPS. Introduce tu ciudad/barrio para actualizar:");
                      if (manualCity) {
                        setFormData(prev => ({ ...prev, latitude: -34.6, longitude: -58.4 }))
                        setLocationStatus('success')
                      }
                    }
                  }}
                >
                  {locationStatus === 'loading' ? '⏳ Obteniendo GPS...' : 
                   locationStatus === 'success' ? '✅ Ubicación actualizada' : 
                   '📍 Actualizar mi ubicación'}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Permite que los clientes vean si estás cerca de ellos.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar cambios"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setFlow("services")} className="flex-1" disabled={loading}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ProviderStatistics({ setFlow, user, services, profileData }: { setFlow: (flow: string) => void; user: any; services: any[]; profileData: any }) {
  const { getBookingsByProvider, bookings } = useBookings()
  
  // Filtrar servicios del proveedor
  const providerServices = services.filter(service => service.providerId === user?.uid)
  const providerBookings = getBookingsByProvider(user?.uid) || []
  
  // Calcular estadísticas generales
  const totalViews = providerServices.reduce((sum, s) => sum + ((s as any).views || 0), 0)
  const totalBookings = providerBookings.length
  const totalContacts = totalBookings
  const conversionRate = totalViews > 0 ? (totalBookings / totalViews) * 100 : 0
  
  // Ciudad dinámica
  const city = profileData?.city || "tu localidad"
  const category = providerServices[0]?.category || ""

  // CALCULO DE RANKING REAL
  const calculateRank = () => {
    if (totalBookings === 0 || !category) return null

    // 1. Encontrar todos los proveedores en la misma categoría y ciudad
    // Nota: Como no todos los proveedores tienen 'city' seteado aún, comparamos con los que sí o usamos la categoría
    const relevantProviders = new Set<string>()
    services.forEach(s => {
      if (s.category === category) {
        relevantProviders.add(s.providerId)
      }
    })

    // 2. Contar reservas para cada proveedor relevante
    const providerPerformance = Array.from(relevantProviders).map(pId => {
      const pBookings = bookings.filter(b => b.providerId === pId).length
      return { id: pId, count: pBookings }
    })

    // 3. Ordenar por rendimiento
    providerPerformance.sort((a, b) => b.count - a.count)

    // 4. Encontrar mi posición
    const myRank = providerPerformance.findIndex(p => p.id === user?.uid) + 1
    const totalInRank = providerPerformance.length

    return { rank: myRank, total: totalInRank }
  }

  const myPerformance = calculateRank()

  // AGREGACIÓN DE ORÍGENES REALES
  const calculateSources = () => {
    const sources = [
      { name: 'Anuncio', key: 'anuncio' },
      { name: 'Recomendados', key: 'recomendados' },
      { name: 'Cerca tuyo', key: 'cerca_tuyo' },
      { name: 'Por rubro', key: 'rubro' },
      { name: 'Por buscador', key: 'buscador' }
    ]

    if (totalBookings === 0) {
      return sources.map(s => ({ ...s, value: 0 }))
    }

    return sources.map(s => {
      const count = providerBookings.filter(b => b.source === s.key).length
      return {
        name: s.name,
        value: Number(((count / totalBookings) * 100).toFixed(1))
      }
    }).sort((a, b) => b.value - a.value)
  }

  const realSources = calculateSources()
  
  // Datos para el gráfico de líneas (Últimos 7 días)
  const getLast7DaysData = () => {
    const data = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayBookings = providerBookings.filter(b => {
        const bDate = b.createdAt instanceof Date ? b.createdAt.toISOString().split('T')[0] : 
                     (typeof (b.createdAt as any) === 'string' ? (b.createdAt as any).split('T')[0] : '')
        return bDate === dateStr
      }).length
      data.push(dayBookings)
    }
    return data
  }
  
  const weeklyData = getLast7DaysData()
  const maxWeekly = Math.max(...weeklyData, 1)
  const chartPoints = weeklyData.map((val, i) => `${(i * 100) / 6},${80 - (val * 60) / maxWeekly}`).join(' ')

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Turquesa */}
      <div className="bg-primary pt-8 pb-6 px-4 rounded-b-[2rem] shadow-lg flex items-center justify-between text-white">
        <button onClick={() => setFlow("profile")} className="p-2">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold">Mis estadísticas</h1>
        <button className="p-2">
          <Settings className="h-6 w-6" />
        </button>
      </div>

      <div className="p-4 space-y-4 -mt-4">
        {/* Banner Ranking Dinámico */}
        <div className="bg-[#FF7F50] rounded-2xl p-4 flex items-center justify-between text-white shadow-md min-h-[80px]">
          <div className="space-y-1">
            {myPerformance ? (
              <>
                <h3 className="text-base font-bold leading-tight">
                  {myPerformance.rank <= 3 
                    ? `¡Estás en el top ${myPerformance.rank} de\n${city}!` 
                    : `Estás en el puesto #${myPerformance.rank}\nen ${city}`}
                </h3>
                <p className="text-[10px] opacity-90 flex items-center gap-1">
                  Mirá tu evolución en el ranking <ArrowRight className="h-3 w-3" />
                </p>
              </>
            ) : (
              <>
                <h3 className="text-base font-bold leading-tight">
                  Todavía no tenemos datos<br />para este ranking en {city}
                </h3>
                <p className="text-[10px] opacity-90">Empezá a recibir reservas para subir</p>
              </>
            )}
          </div>
          <div className="relative">
            <Trophy className="h-10 w-10 opacity-30 absolute -right-2 -top-2" />
            <div className="flex items-end gap-0.5">
              <div className={`w-4 h-6 ${myPerformance?.rank === 2 ? 'bg-white' : 'bg-white/40'} rounded-t-sm flex items-center justify-center text-[10px] font-bold text-[#FF7F50]`}>2</div>
              <div className={`w-5 h-8 ${myPerformance?.rank === 1 ? 'bg-white' : 'bg-white/60'} rounded-t-sm flex items-center justify-center text-xs font-bold -mb-0.5 text-[#FF7F50]`}>1</div>
              <div className={`w-4 h-4 ${myPerformance?.rank === 3 ? 'bg-white' : 'bg-white/20'} rounded-t-sm flex items-center justify-center text-[8px] font-bold text-[#FF7F50]`}>3</div>
            </div>
          </div>
        </div>

        {/* Card Principal de Conversión */}
        <Card className="bg-white border-none rounded-[2rem] shadow-sm overflow-hidden">
          <CardContent className="p-8 flex flex-col items-center">
            <div className="relative w-40 h-40 mb-8">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
                <circle
                  cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" 
                  strokeDasharray={440} strokeDashoffset={440 - (440 * Math.min(conversionRate, 100)) / 100}
                  strokeLinecap="round" fill="transparent" className="text-primary transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-primary">{Math.round(conversionRate)}%</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Conversión</span>
              </div>
            </div>

            <div className="w-full flex justify-center items-center gap-12 border-t border-gray-50 pt-8">
              <div className="text-center">
                <p className="text-2xl font-black text-gray-800">{totalViews}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Visitas</p>
              </div>
              <div className="w-px h-8 bg-gray-100" />
              <div className="text-center">
                <p className="text-2xl font-black text-gray-800">{totalContacts}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contactos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Resumen / Evolución */}
        <Card className="bg-white border-none rounded-[2rem] shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-gray-800">Resumen Semanal</h3>
              <div className="flex gap-4 text-xs font-bold">
                <span className="text-primary border-b-2 border-primary">Reservas</span>
              </div>
            </div>

            <div className="h-32 w-full relative pt-4">
              {totalBookings > 0 ? (
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <polyline fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary opacity-20" points={chartPoints} />
                  <polyline fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary" points={chartPoints} />
                  {weeklyData.map((val, i) => (
                    <circle key={i} cx={`${(i * 100) / 6}%`} cy={`${80 - (val * 60) / maxWeekly}%`} r="3" className="fill-white stroke-primary stroke-2" />
                  ))}
                </svg>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-300 text-[10px] uppercase font-bold tracking-widest">
                  Sin datos esta semana
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Orígenes de contacto Dinámicos */}
        <Card className="bg-white border-none rounded-[2rem] shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <h3 className="text-lg font-black text-gray-800 mb-6">Orígenes de contacto</h3>
            
            <div className="flex flex-col items-center mb-8">
              <span className="text-3xl font-black text-gray-800">{totalContacts}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Contactos</span>
            </div>

            <div className="space-y-6">
              {realSources.map((source, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-gray-400">{source.name}</span>
                    <span className="text-gray-800">{source.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-1000"
                      style={{ width: `${source.value}%` }}
                    />
                  </div>
                </div>
              ))}
              {totalBookings === 0 && (
                <p className="text-center text-[10px] text-gray-400 font-bold uppercase py-4">
                  Esperando tus primeros contactos
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 pb-safe z-40">
        <div className="flex justify-around py-3">
          <button onClick={() => setFlow("dashboard")} className="flex flex-col items-center gap-1">
            <TrendingUp className="h-6 w-6 text-gray-400" />
            <span className="text-[10px] font-medium text-gray-400">Dashboard</span>
          </button>
          <button onClick={() => setFlow("agenda")} className="flex flex-col items-center gap-1">
            <Calendar className="h-6 w-6 text-gray-400" />
            <span className="text-[10px] font-medium text-gray-400">Agenda</span>
          </button>
          <button onClick={() => setFlow("profile")} className="flex flex-col items-center gap-1">
            <User className="h-6 w-6 text-gray-400" />
            <span className="text-[10px] font-medium text-gray-400">Perfil</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function ProviderSubscription({ setFlow }: { setFlow: (flow: string) => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setFlow("dashboard")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold text-primary">Planes Premium</h1>
      </div>

      <div className="p-6 flex-1 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 shadow-xl">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
              <Star className="h-10 w-10 text-primary" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-primary">¡Acceso Total Desbloqueado!</h2>
              <p className="text-lg text-gray-700 leading-relaxed italic">
                "Todos los planes premium están desbloqueados, por favor utiliza la aplicación con tranquilidad y disfrute de Punto Encuentro."
              </p>
            </div>

            <div className="pt-6 border-t border-primary/10">
              <p className="font-bold text-gray-900 text-sm">Ceo</p>
              <p className="text-xl font-serif text-primary">Mateo Yoyovich</p>
            </div>

            <Button onClick={() => setFlow("dashboard")} className="w-full mt-4">
              Volver al Panel
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AdminDashboard({ user, logout }: { user: any, logout: () => Promise<{ success: boolean }> }) {
  const { categories, loading: categoriesLoading, createCategory, updateCategory, deleteCategory, toggleCategoryStatus } = useCategories()
  const { services } = useServices()
  const { bookings } = useBookings()
  const { users, loading: usersLoading, updateUserRole, toggleUserStatus, deleteUser, getUsersByRole } = useUsers()
  const { analytics, loading: analyticsLoading } = useAnalytics()
  const { stats, loading: dashboardLoading, refresh } = useAdminDashboard()

  const [activeTab, setActiveTab] = useState<'dashboard' | 'categories' | 'users' | 'services' | 'analytics' | 'reports' | 'settings'>('dashboard')
  const [showAlerts, setShowAlerts] = useState(false)
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
  const [userFilter, setUserFilter] = useState<'all' | 'client' | 'provider' | 'admin'>('all')
  const [serviceFilter, setServiceFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Estados para configuración
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    appointmentReminders: true,
    autoAcceptBookings: false,
    emailVerificationRequired: true,
    openRegistration: true,
    sessionTimeout: 60,
    commissionRate: 10,
    minPrice: 50,
    maxPrice: 10000,
    appName: 'Punto Encuentro',
    appDescription: 'Plataforma de servicios profesionales',
    appEmail: 'contacto@puntoencuentro.com'
  })

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategory.name || !newCategory.icon) return

    const result = await createCategory(newCategory)
    if (result.success) {
      setNewCategory({ name: '', icon: '', description: '', active: true })
      setShowCreateCategory(false)
    }
  }

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return

    const result = await updateCategory(editingCategory.id, editingCategory)
    if (result.success) {
      setEditingCategory(null)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      await deleteCategory(id)
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    const result = await updateUserRole(userId, newRole as any)
    if (result.success) {
      setEditingUser(null)
    }
  }

  const handleToggleUserStatus = async (userId: string) => {
    await toggleUserStatus(userId)
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      await deleteUser(userId)
    }
  }

  const filteredUsers = userFilter === 'all'
    ? users
    : getUsersByRole(userFilter as any)

  const filteredServices = serviceFilter === 'all'
    ? services
    : services.filter(service =>
      serviceFilter === 'active' ? (service as any).active !== false : (service as any).active === false
    )

  // Funciones para configuración
  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const saveSettings = async (section: string) => {
    try {
      // Aquí se guardaría en Firebase o base de datos
      console.log(`Guardando configuración de ${section}:`, settings)
      alert(`✅ Configuración de ${section} guardada exitosamente`)
    } catch (error) {
      console.error('Error guardando configuración:', error)
      alert('❌ Error al guardar la configuración')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col md:flex-row">
      {/* Navegación para escritorio */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} logout={async () => {
        const result = await logout()
        if (result.success) {
          localStorage.removeItem('userType')
          window.location.reload()
        }
      }} />

      {/* Navegación para móvil */}
      <AdminBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

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
                  {activeTab === 'categories' && 'Gestión de Categorías'}
                  {activeTab === 'reports' && 'Informes y Reportes'}
                  {activeTab === 'analytics' && 'Analíticas Avanzadas'}
                  {activeTab === 'settings' && 'Configuración Global'}
                </h1>
                <p className="hidden md:block text-[10px] text-muted-foreground mt-1 tracking-tight">Bienvenido, {user?.displayName || user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-gray-500" />
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
                <div className="flex justify-end">
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

                {/* Panel de Alertas */}
                {showAlerts && (
                  <Card className={stats.alerts.length > 0 ? "border-yellow-200 bg-yellow-50" : "border-gray-200 bg-gray-50"}>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3">⚠️ Alertas que necesitan atención</h3>
                      {stats.alerts.length > 0 ? (
                        <div className="space-y-2">
                          {stats.alerts.map((alert, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-white rounded">
                              <span className="text-sm">{alert.message}</span>
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                                {alert.count}
                              </span>
                            </div>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <AdminStatCard 
                title="Publicaciones" 
                value={stats.newPublications} 
                icon={FileText} 
                color="bg-indigo-500" 
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
                       <Bell className={`h-5 w-5 ${stats.alerts.length > 0 ? 'text-orange-500 animate-pulse' : 'text-gray-400'}`} />
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
                <p className="text-xs text-muted-foreground mt-1">Administra los rubros disponibles en la plataforma</p>
              </div>
              <Button 
                onClick={() => setShowCreateCategory(true)}
                className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Categoría
              </Button>
            </div>

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
                          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                            {category.icon}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 truncate">{category.name}</h3>
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
                            <Settings className="h-4 w-4" />
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
                        >
                          Ver Detalles
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
              <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'client', label: 'Clientes' },
                  { id: 'provider', label: 'Proveedores' }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setUserFilter(filter.id as any)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                      userFilter === filter.id 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {filter.label}
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
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        <Button size="sm" variant="outline" className="h-8 text-[10px] rounded-lg" onClick={() => setEditingUser(user)}>
                          Editar
                        </Button>
                        <Button size="sm" variant="outline" className={`h-8 text-[10px] rounded-lg ${!user.isActive ? 'text-green-600' : 'text-orange-600'}`} onClick={() => toggleUserStatus(user.id)}>
                          {!user.isActive ? 'Activar' : 'Suspender'}
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-[10px] rounded-lg text-red-600" onClick={() => deleteUser(user.id)}>
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
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => setEditingUser(user)}>
                            <Settings className="h-4 w-4 text-gray-400" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-red-400 hover:text-red-600" onClick={() => deleteUser(user.id)}>
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
                  { id: 'inactive', label: 'Inactivos' }
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredServices.map(service => (
                <Card key={service.id} className="border-none shadow-sm group hover:shadow-md transition-all overflow-hidden bg-white">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shadow-inner">
                        {categories.find(c => c.name === service.category)?.icon || '🛠️'}
                      </div>
                      <Badge variant={(service as any).isActive !== false ? "success" : "destructive"} className="text-[10px]">
                        {(service as any).isActive !== false ? 'ACTIVO' : 'INACTIVO'}
                      </Badge>
                    </div>
                    
                    <h3 className="font-bold text-gray-900 truncate mb-1">{service.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 h-8 leading-relaxed">
                      {service.description}
                    </p>
                    
                    <div className="mt-6 pt-4 border-t border-gray-50 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-medium">Proveedor</span>
                        <span className="font-bold text-gray-700 truncate max-w-[150px]">{service.providerName}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-medium">Categoría</span>
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-none px-1.5 h-5 text-[9px] font-bold">
                          {service.category.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-medium text-xs">Precio</span>
                        <span className="text-lg font-black text-primary">${service.price}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-6">
                      <Button variant="outline" size="sm" className="rounded-xl h-10 font-bold text-xs">
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-xl h-10 font-bold text-xs text-red-600 hover:bg-red-50">
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                              <h4 className="text-3xl font-black text-gray-900">${monthlyReport.promoSummary.totalRevenue.toLocaleString()}</h4>
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
              <AdminStatCard title="Ingresos" value={`$${analytics.totalRevenue.toLocaleString()}`} icon={Wallet} color="bg-green-500" />
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
                             <p className="text-sm font-black text-primary">${booking.price}</p>
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
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <LayoutDashboard className="h-4 w-4" />
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
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                      <Bell className="h-4 w-4" />
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
                          onClick={() => handleSettingChange(item.id, !(settings as any)[item.id])}
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
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.target as HTMLFormElement)
                  const newRole = formData.get('role') as string
                  handleUpdateUserRole(editingUser.id, newRole)
                }} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-gray-400 uppercase">Asignar Rol</Label>
                    <select name="role" defaultValue={editingUser.role} className="w-full h-12 px-4 rounded-xl border border-gray-100 bg-white text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none">
                      <option value="client">Cliente Estándar</option>
                      <option value="provider">Proveedor de Servicios</option>
                      <option value="admin">Administrador Total</option>
                    </select>
                  </div>
                  <Button type="submit" className="w-full h-14 rounded-2xl font-black text-lg">Confirmar Rol</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  </div>
)
}

function ChatWindow({
  user,
  partnerId,
  partnerName,
  onBack
}: {
  user: any
  partnerId: string
  partnerName: string
  onBack: () => void
}) {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const chatId = partnerId ? [user.uid, partnerId].sort().join('_') : null

  useEffect(() => {
    if (!chatId) return

    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    )

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setMessages(msgs)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [chatId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !chatId) return

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: newMessage,
        senderId: user.uid,
        senderName: user.displayName || user.email,
        createdAt: serverTimestamp()
      })

      await setDoc(doc(db, 'chats', chatId), {
        lastMessage: newMessage,
        lastMessageAt: serverTimestamp(),
        participants: [user.uid, partnerId],
        participantNames: {
          [user.uid]: user.displayName || user.email,
          [partnerId]: partnerName
        },
        updatedAt: serverTimestamp()
      }, { merge: true })

      setNewMessage("")
    } catch (error) {
      console.error("Error al enviar mensaje:", error)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-lg">{partnerName}</h2>
            <p className="text-xs text-green-500 font-medium">En línea</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center mt-10">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="h-8 w-8 text-primary/40" />
            </div>
            <p className="text-muted-foreground text-sm">Comienza la conversación con {partnerName}</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === user?.uid ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${msg.senderId === user?.uid
                  ? "bg-primary text-white rounded-tr-none"
                  : "bg-white border text-gray-800 rounded-tl-none"
                  }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p className={`text-[10px] mt-1 opacity-70 text-right`}>
                  {msg.createdAt?.toDate ?
                    new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                    "Enviando..."
                  }
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 rounded-full bg-gray-100 border-none focus-visible:ring-primary"
          />
          <Button type="submit" disabled={!newMessage.trim()} className="rounded-full w-10 h-10 p-0 flex items-center justify-center shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
