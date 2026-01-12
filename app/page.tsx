"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogoText } from "@/components/logo"
import { CustomAlert } from "@/components/CustomAlert"
import { useAuth } from "@/hooks/useAuth"
import { useServices } from "@/hooks/useServices"
import { useBookings } from "@/hooks/useBookings"
import { useRoles } from "@/hooks/useRoles"
import { useAdminDashboard } from "@/hooks/useAdminDashboard"
import { useReports } from "@/hooks/useReports"
import { useCategories } from "@/hooks/useCategories"
import { useUsers } from "@/hooks/useUsers"
import { useAnalytics } from "@/hooks/useAnalytics"
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
  Send,
  MessageSquare,
  MapPin,
  MapPinOff,
} from "lucide-react"
import { App } from '@capacitor/app'

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

export default function HomePage() {
  const { user, signIn, signUp, logout, loading: authLoading } = useAuth()
  const { services, loading: servicesLoading, searchServices, createService } = useServices()
  const { createBooking, getBookingsByClient } = useBookings()
  const { isAdmin, loading: rolesLoading } = useRoles()

  const [userType, setUserType] = useState<"client" | "provider" | null>(null)
  const [clientFlow, setClientFlow] = useState<
    "onboarding" | "login" | "register" | "home" | "profile" | "agenda" | "service-detail" | "booking" | "payment" | "chat"
  >("onboarding")
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
    | "chat"
  >("onboarding")
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedProviderService, setSelectedProviderService] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [authError, setAuthError] = useState("")
  const [authSuccess, setAuthSuccess] = useState("")
  const [activeChat, setActiveChat] = useState<any>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Persistir tipo de usuario en localStorage
  useEffect(() => {
    if (userType) {
      localStorage.setItem('userType', userType)
    }
  }, [userType])

  // Cargar tipo de usuario desde localStorage al inicializar
  useEffect(() => {
    const savedUserType = localStorage.getItem('userType') as "client" | "provider" | null
    if (savedUserType) {
      setUserType(savedUserType)
    }
  }, []) // Solo al montar

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

  // Manejar botón de retroceso de Android
  useEffect(() => {
    const setupBackButtonListener = async () => {
      try {
        await App.addListener('backButton', ({ canGoBack }) => {
          if (activeChat) {
            setActiveChat(null)
            return
          }

          if (userType === 'client') {
            if (clientFlow === 'home') {
              App.exitApp()
            } else if (['agenda', 'profile', 'favorites', 'service-detail'].includes(clientFlow)) {
              setClientFlow('home')
            } else if (clientFlow === 'booking') {
              setClientFlow('service-detail')
            } else if (clientFlow === 'payment') {
              setClientFlow('booking')
            } else {
              setClientFlow('home')
            }
          } else if (userType === 'provider') {
            if (providerFlow === 'dashboard') {
              App.exitApp()
            } else if (['agenda', 'services', 'profile', 'statistics'].includes(providerFlow)) {
              setProviderFlow('dashboard')
            } else if (['create-service', 'edit-service'].includes(providerFlow)) {
              setProviderFlow('services')
            } else {
              setProviderFlow('dashboard')
            }
          } else {
            // Si no hay usuario logueado
            App.exitApp()
          }
        })
      } catch (error) {
        console.error('Error setting up back button listener:', error)
      }
    }

    setupBackButtonListener()

    return () => {
      App.removeAllListeners()
    }
  }, [userType, clientFlow, providerFlow, activeChat])
  // Mostrar loading mientras se verifica la autenticación
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
    console.log('Mostrando panel de admin para:', user.email)
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
          user={user}
          services={services}
          selectedService={selectedService}
          setSelectedService={setSelectedService}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          searchServices={searchServices}
          createBooking={createBooking}
          getBookingsByClient={getBookingsByClient}
          userLocation={userLocation}
          activeChat={activeChat}
          setActiveChat={setActiveChat}
          signIn={signIn}
          signUp={signUp}
          setAuthError={setAuthError}
          authError={authError}
          setAuthSuccess={setAuthSuccess}
          authSuccess={authSuccess}
          logout={logout}
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
  activeChat: any
  setActiveChat: (chat: any) => void
}) {
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
    return <ProviderProfile setFlow={setFlow} user={user} logout={logout} userLocation={userLocation} />
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
    return <ProviderStatistics setFlow={setFlow} user={user} services={services} />
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
        userLocation={userLocation}
        setActiveChat={setActiveChat}
      />
    )
  }

  if (flow === "profile") {
    return <ClientProfile setFlow={setFlow} user={user} logout={logout} />
  }

  if (flow === "agenda") {
    return <ClientAgenda setFlow={setFlow} user={user} setActiveChat={setActiveChat} />
  }

  if (flow === "service-detail") {
    return <ServiceDetail service={selectedService} setFlow={setFlow} userLocation={userLocation} setActiveChat={setActiveChat} />
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
  userLocation: { lat: number, lng: number } | null
  setActiveChat?: (chat: any) => void
}) {
  const [activeTab, setActiveTab] = useState("inicio")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"home" | "recommendations" | "nearby" | "category" | "all-categories">("home")
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("")

  const allCategories = [
    { name: "Oficios", icon: "🔧" },
    { name: "Profesionales", icon: "💼" },
    { name: "Aprendizaje", icon: "📚" },
    { name: "Belleza", icon: "💄" },
    { name: "Salud", icon: "🏥" },
    { name: "Deporte", icon: "⚽" },
    { name: "Hogar", icon: "🏠" },
    { name: "Tecnología", icon: "💻" },
    { name: "Educación", icon: "🎓" },
    { name: "Mascotas", icon: "🐕" },
    { name: "Eventos", icon: "🎉" },
    { name: "Transporte", icon: "🚗" },
  ]

  // Mostrar solo las primeras 3 categorías en el home
  const mainCategories = allCategories.slice(0, 3)

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
      return matchesCategory
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

  const handleServiceClick = (service: any) => {
    setSelectedService(service)
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
  }

  const handleBackToHome = () => {
    setViewMode("home")
    setSelectedCategory(null)
  }

  const handleVerMasCategorias = () => {
    setViewMode("all-categories")
  }

  if (activeTab === "agenda") {
    return <ClientAgenda setFlow={setFlow} user={user} onBack={() => setActiveTab("inicio")} setActiveChat={setActiveChat} />
  }

  if (activeTab === "perfil") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm p-4">
          <h1 className="text-xl font-bold text-primary text-center">Perfil</h1>
        </div>
        <div className="p-4">
          <Button onClick={() => setFlow("profile")} className="w-full">
            Ver perfil completo
          </Button>
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="flex justify-around py-2">
            <button onClick={() => setActiveTab("inicio")} className="flex flex-col items-center py-2 px-4">
              <div className="text-gray-400 mb-1">🏠</div>
              <span className="text-xs text-gray-400">Inicio</span>
            </button>
            <button onClick={() => setActiveTab("agenda")} className="flex flex-col items-center py-2 px-4">
              <div className="text-gray-400 mb-1">📅</div>
              <span className="text-xs text-gray-400">Agenda</span>
            </button>
            <button onClick={() => setActiveTab("perfil")} className="flex flex-col items-center py-2 px-4">
              <div className="text-primary mb-1">👤</div>
              <span className="text-xs text-primary">Perfil</span>
            </button>
          </div>
        </div>
      </div>
    )
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
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="flex justify-around py-2">
            <button onClick={() => setActiveTab("inicio")} className="flex flex-col items-center py-2 px-4">
              <div className="text-primary mb-1">🏠</div>
              <span className="text-xs text-primary">Inicio</span>
            </button>
            <button onClick={() => setActiveTab("agenda")} className="flex flex-col items-center py-2 px-4">
              <div className="text-gray-400 mb-1">📅</div>
              <span className="text-xs text-gray-400">Agenda</span>
            </button>
            <button onClick={() => setActiveTab("perfil")} className="flex flex-col items-center py-2 px-4">
              <div className="text-gray-400 mb-1">👤</div>
              <span className="text-xs text-gray-400">Perfil</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (viewMode === "nearby") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm p-4 flex items-center">
          <button onClick={handleBackToHome} className="mr-3">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold text-primary">Cerca tuyo</h1>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4">
            {services
              .map(service => {
                if (userLocation && service.lat && service.lng) {
                  const dist = getDistance(userLocation.lat, userLocation.lng, service.lat, service.lng)
                  return { ...service, distanceVal: dist, distance: `${dist.toFixed(1)} km` }
                }
                return service
              })
              .filter((service) => service.distance)
              .sort((a, b) => (a.distanceVal || 999) - (b.distanceVal || 999))
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
                      <p className="text-xs text-primary mb-2">{service.distance}</p>
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
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="flex justify-around py-2">
            <button onClick={() => setActiveTab("inicio")} className="flex flex-col items-center py-2 px-4">
              <div className="text-primary mb-1">🏠</div>
              <span className="text-xs text-primary">Inicio</span>
            </button>
            <button onClick={() => setActiveTab("agenda")} className="flex flex-col items-center py-2 px-4">
              <div className="text-gray-400 mb-1">📅</div>
              <span className="text-xs text-gray-400">Agenda</span>
            </button>
            <button onClick={() => setActiveTab("perfil")} className="flex flex-col items-center py-2 px-4">
              <div className="text-gray-400 mb-1">👤</div>
              <span className="text-xs text-gray-400">Perfil</span>
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
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="flex justify-around py-2">
            <button onClick={() => setActiveTab("inicio")} className="flex flex-col items-center py-2 px-4">
              <div className="text-primary mb-1">🏠</div>
              <span className="text-xs text-primary">Inicio</span>
            </button>
            <button onClick={() => setActiveTab("agenda")} className="flex flex-col items-center py-2 px-4">
              <div className="text-gray-400 mb-1">📅</div>
              <span className="text-xs text-gray-400">Agenda</span>
            </button>
            <button onClick={() => setActiveTab("perfil")} className="flex flex-col items-center py-2 px-4">
              <div className="text-gray-400 mb-1">👤</div>
              <span className="text-xs text-gray-400">Perfil</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm p-4">
        <h1 className="text-xl font-bold text-primary text-center mb-4">Punto Encuentro</h1>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar servicio"
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">Categorías</h2>
          <div className="grid grid-cols-4 gap-3">
            {mainCategories.map((category) => (
              <div
                key={category.name}
                className="flex flex-col items-center cursor-pointer"
                onClick={() => handleCategoryClick(category.name)}
              >
                <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mb-2">
                  <span className="text-2xl">{category.icon}</span>
                </div>
                <span className="text-sm font-medium text-center">{category.name}</span>
              </div>
            ))}
            <div
              className="flex flex-col items-center cursor-pointer"
              onClick={handleVerMasCategorias}
            >
              <div className="w-16 h-16 bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center mb-2">
                <span className="text-2xl text-gray-500">➕</span>
              </div>
              <span className="text-sm font-medium text-center text-gray-600">Más</span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Recomendados</h2>
            {filteredServices.length > 0 && (
              <button onClick={handleVerMas} className="text-sm text-primary">
                Ver más
              </button>
            )}
          </div>
          {filteredServices.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {recommendedServices.slice(0, 4).map((service) => (
                <Card
                  key={service.id}
                  className="cursor-pointer hover:shadow-md transition-shadow flex-shrink-0 w-48 overflow-hidden"
                  onClick={() => handleServiceClick(service)}
                >
                  <div className="relative w-full h-32">
                    <img
                      src={service.image || "/placeholder.svg"}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 text-white">
                      <p className="text-xs font-bold line-clamp-1">{service.providerName}</p>
                      {service.distance !== undefined && (
                        <p className="text-[10px] text-primary-foreground bg-primary/20 backdrop-blur-sm rounded px-1 inline-block">
                          a {service.distance.toFixed(1)} km
                        </p>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="text-xs font-semibold line-clamp-1 mb-1">{service.name}</h3>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 text-[10px]">
                        <Star className="h-2 w-2 fill-yellow-400 text-yellow-400" />
                        <span>{service.rating}</span>
                      </div>
                      <span className="text-sm font-bold text-primary">${service.price}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">⭐</div>
                  <p>No hay servicios recomendados</p>
                  <p className="text-sm mt-1">Los servicios aparecerán aquí cuando estén disponibles</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <button onClick={handleCercaTuyo} className="text-lg font-semibold mb-3 text-left">
            Cerca tuyo
          </button>
          {nearbyServices.length > 0 ? (
            <div className="space-y-3">
              {nearbyServices.slice(0, 3).map((service) => (
                <Card
                  key={service.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleServiceClick(service)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={service.image || "/placeholder.svg"}
                          alt={service.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                            {service.category}
                          </span>
                          {service.distance !== undefined && (
                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                              ESTÁ MUY CERCA ({service.distance.toFixed(1)} km)
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-sm line-clamp-1">{service.name}</h3>
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <User className="h-3 w-3" /> {service.providerName}
                        </p>
                        <div className="flex justify-between items-end">
                          <div className="flex items-center gap-1 text-xs">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{service.rating}</span>
                          </div>
                          <div className="text-lg font-bold text-primary">${service.price}</div>
                        </div>
                      </div>
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

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around py-2">
          <button onClick={() => setActiveTab("inicio")} className="flex flex-col items-center py-2 px-4">
            <div className="text-primary mb-1">🏠</div>
            <span className="text-xs text-primary">Inicio</span>
          </button>
          <button onClick={() => setActiveTab("agenda")} className="flex flex-col items-center py-2 px-4">
            <div className="text-gray-400 mb-1">📅</div>
            <span className="text-xs text-gray-400">Agenda</span>
          </button>
          <button onClick={() => setActiveTab("perfil")} className="flex flex-col items-center py-2 px-4">
            <div className="text-gray-400 mb-1">👤</div>
            <span className="text-xs text-gray-400">Perfil</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function ServiceDetail({ service, setFlow, userLocation, setActiveChat }: { service: any; setFlow: (flow: string) => void, userLocation: { lat: number, lng: number } | null, setActiveChat: (chat: any) => void }) {
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'oklch(0.98 0.01 200)' }}>
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setFlow("home")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-primary">Detalle del Servicio</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Service Image */}
        <Card className="bg-white">
          <CardContent className="p-0">
            <img
              src={service.image || "/placeholder.svg"}
              alt={service.name}
              className="w-full h-48 object-cover rounded-t-lg"
            />
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-2xl font-bold">{service.name}</h2>
                  {userLocation && service.lat && service.lng && (
                    <p className="text-sm font-bold text-green-600 flex items-center gap-1 mt-1">
                      <MapPin className="h-4 w-4" />
                      A {getDistance(userLocation.lat, userLocation.lng, service.lat, service.lng).toFixed(1)} km de ti
                    </p>
                  )}
                </div>
                <span className="text-2xl font-bold text-primary">${service.price}</span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{service.rating || 0}</span>
                <span className="text-muted-foreground">• {service.reviews || 0} reseñas</span>
                <span className="text-muted-foreground">• {service.category}</span>
              </div>

              <p className="text-muted-foreground mb-3">{service.description || 'Sin descripción'}</p>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{service.providerName || 'Proveedor'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Info */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Información del servicio</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duración:</span>
                <span className="font-medium">{(service as any).duration || 60} minutos</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Categoría:</span>
                <span className="font-medium">{service.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Precio:</span>
                <span className="font-bold text-primary">${service.price}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 items-center">
          <Button
            onClick={() => setFlow("booking")}
            className="flex-[2] h-14 text-sm font-bold rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95"
            variant="orange"
          >
            Agendar turno
          </Button>

          <Button
            variant="outline"
            className="flex-1 h-14 p-0 flex flex-col items-center justify-center shrink-0 border-2 border-primary/20 bg-primary/5 text-primary rounded-2xl hover:bg-primary/10 hover:border-primary/40 transition-all active:scale-95 group shadow-sm"
            onClick={() => {
              setActiveChat({
                partnerId: service.providerId,
                partnerName: service.providerName || "Proveedor"
              })
              setFlow("chat")
            }}
          >
            <div className="relative">
              <MessageSquare className="h-5 w-5 mb-0.5 transition-transform group-hover:scale-110" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-tight">Chat</span>
          </Button>
        </div>

        {/* Reviews Section */}
        <ServiceReviews serviceId={service.id} />
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
}: {
  service: any
  setFlow: (flow: string) => void
  selectedDate: string
  setSelectedDate: (date: string) => void
  selectedTime: string
  setSelectedTime: (time: string) => void
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

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
  setActiveChat,
}: {
  service: any
  selectedDate: string
  selectedTime: string
  setFlow: (flow: string) => void
  user: any
  createBooking: (bookingData: any) => Promise<{ success: boolean, error?: string }>
  setActiveChat: (chat: any) => void
}) {
  const [selectedPayment, setSelectedPayment] = useState<string>("")
  const [showTransferDetails, setShowTransferDetails] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

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
                  <span className="font-medium">CBU:</span> 0001234567890000
                </p>
                <p className="text-sm">
                  <span className="font-medium">Titular:</span> {service.name}
                </p>
                <p className="text-sm">
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

function ClientProfile({ setFlow, user, logout }: { setFlow: (flow: string) => void; user: any; logout: () => Promise<{ success: boolean }> }) {
  const { getBookingsByClient } = useBookings()
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

  // Cargar datos actuales de Firestore al iniciar
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.uid) return

      try {
        const { getDoc, doc } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase")

        const docRef = doc(db, 'users', user.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          setProfileData(prev => ({
            ...prev,
            ...data,
            name: data.displayName || data.name || user.displayName || "",
            email: data.email || user.email || ""
          }))
        }
      } catch (error) {
        console.error("Error cargando perfil:", error)
      }
    }

    loadProfileData()
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

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido')
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 5MB')
      return
    }

    setUploadingImage(true)

    // URL temporal para feedback visual inmediato
    const imageUrl = URL.createObjectURL(file)
    setProfileData(prev => ({ ...prev, profileImage: imageUrl }))

    setUploadingImage(true)

    // Subida real a Firebase Storage
    try {
      const storagePath = `users/${user.uid}/profile_${Date.now()}`
      const downloadURL = await uploadFile(file, storagePath)

      setProfileData(prev => ({ ...prev, profileImage: downloadURL }))

      // Actualizar inmediatamente en Firestore si no estamos en modo edición (o incluso si lo estamos)
      await setDoc(doc(db, 'users', user.uid), {
        profileImage: downloadURL,
        updatedAt: new Date()
      }, { merge: true })

      setSuccess('¡Imagen de perfil actualizada!')
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error('Error al subir imagen:', error)
      alert('Error al subir la imagen. Intenta de nuevo.')
    } finally {
      setUploadingImage(false)
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

        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
          disabled={loading}
        >
          {loading ? "Cerrando sesión..." : "Cerrar sesión"}
        </Button>
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
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'oklch(0.99 0.01 200)' }}>
      {/* Header Premium */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-100 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onBack ? onBack() : setFlow("home")}
              className="rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mis Reservas</h1>
              <p className="text-xs text-muted-foreground">Gestiona tus próximos encuentros</p>
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
                          ${isSelected ? 'bg-white' : 'bg-primary'}
                        `} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reservas del día seleccionado */}
        {selectedDate && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-gray-800 capitalize flex items-center gap-2">
                <div className="w-1.5 h-6 bg-primary rounded-full transition-all" />
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </h3>
              <span className="text-xs font-medium text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">
                {selectedDateBookings.length} {selectedDateBookings.length === 1 ? 'reserva' : 'reservas'}
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
                              <Clock className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-gray-900">{booking.serviceName}</h4>
                                <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded cursor-default">
                                  ${booking.price}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5" />
                                {booking.providerName}
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
                                    partnerId: booking.providerId,
                                    partnerName: booking.providerName || "Proveedor"
                                  })
                                  setFlow("chat")
                                }}
                                className="h-10 w-12 p-0 bg-primary/5 text-primary hover:bg-primary/10 rounded-xl flex flex-col items-center justify-center transition-all active:scale-90 border border-primary/10 shadow-sm"
                                title="Chatear con el profesional"
                              >
                                <div className="relative">
                                  <MessageSquare className="h-4 w-4" />
                                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary rounded-full border border-white"></span>
                                </div>
                                <span className="text-[8px] font-black uppercase mt-0.5">Chat</span>
                              </Button>

                              {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancelBooking(booking.id)}
                                  disabled={loading}
                                  className="h-8 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                >
                                  Cancelar
                                </Button>
                              )}
                              {booking.status === 'completed' && !booking.reviewed && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setRatingBooking(booking)
                                    setShowRateModal(true)
                                  }}
                                  className="h-8 text-xs font-bold bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg shadow-lg shadow-yellow-200"
                                >
                                  Calificar
                                </Button>
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
                  <p className="text-gray-500 font-medium text-center">No hay reservas para este día</p>
                  <p className="text-xs text-muted-foreground text-center mt-1">Selecciona otra fecha en el calendario</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Todas las reservas Modernizadas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gray-300 rounded-full" />
              Historial de Reservas
            </h3>
            <span className="text-xs font-medium text-muted-foreground">Últimas 10</span>
          </div>

          <div className="grid gap-3">
            {clientBookings.length > 0 ? (
              clientBookings.slice(0, 10).map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-50 hover:border-primary/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-primary/5 transition-colors">
                    <Clock className={`h-5 w-5 ${booking.status === 'confirmed' ? 'text-green-500' :
                      booking.status === 'pending' ? 'text-yellow-500' : 'text-gray-400'
                      }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">{booking.serviceName}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground font-medium">
                        {new Date(booking.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} • {booking.time}
                      </p>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <p className="text-xs text-muted-foreground truncate">{booking.providerName}</p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActiveChat({
                          partnerId: booking.providerId,
                          partnerName: booking.providerName || "Proveedor"
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
                        booking.status === 'pending' ? 'Wait' :
                          booking.status === 'cancelled' ? 'No' : 'Fin'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-white rounded-3xl border border-gray-100 italic text-gray-400 text-sm">
                Aún no tienes historial de reservas
              </div>
            )}
          </div>
        </div>

        {/* Modal de Calificación */}
        {showRateModal && ratingBooking && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <Card className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border-none animate-in zoom-in-95 duration-300">
              <div className="h-24 bg-gradient-to-br from-primary to-orange-400 relative">
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                  <Star className="h-10 w-10 text-yellow-400 fill-yellow-400" />
                </div>
              </div>
              <CardContent className="pt-14 pb-6 px-6">
                <h3 className="text-xl font-black text-gray-900 text-center mb-1">¡Danos tu opinión!</h3>
                <p className="text-center text-sm text-muted-foreground mb-8">
                  ¿Qué te pareció el servicio de <span className="text-primary font-bold">{ratingBooking.providerName}</span>?
                </p>

                <div className="flex justify-center gap-3 mb-8">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingScore(star)}
                      className={`transition-all duration-300 hover:scale-125 ${star <= ratingScore ? "scale-110" : "grayscale opacity-50"}`}
                    >
                      <Star
                        className={`h-9 w-9 ${star <= ratingScore ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
                      />
                    </button>
                  ))}
                </div>

                <div className="space-y-2 mb-8">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 px-1">Tu experiencia</label>
                  <textarea
                    className="w-full min-h-[120px] p-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-all resize-none"
                    placeholder="Escribe aquí tu comentario (opcional)..."
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="ghost"
                    className="h-12 rounded-xl font-bold text-gray-500"
                    onClick={() => setShowRateModal(false)}
                  >
                    Cerrar
                  </Button>
                  <Button
                    className="h-12 rounded-xl font-black bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                    onClick={async () => {
                      setLoading(true)
                      try {
                        const result = await addReview({
                          serviceId: ratingBooking.serviceId,
                          clientId: user.uid,
                          clientName: user.displayName || "Compañero",
                          rating: ratingScore,
                          comment: ratingComment
                        }, ratingBooking.id)

                        if (result.success) {
                          alert('¡Gracias por tu reseña!')
                          setShowRateModal(false)
                          setRatingComment("")
                          setRatingScore(5)
                          if (fetchBookings) await fetchBookings()
                        }
                      } catch (e) {
                        alert('Error al enviar la reseña')
                      } finally {
                        setLoading(false)
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? "..." : "Enviar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
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
    <div className="min-h-screen" style={{ backgroundColor: 'oklch(0.98 0.01 200)' }}>
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
    </div>
  )
}

function ProviderProfile({ setFlow, user, logout, userLocation }: { setFlow: (flow: string) => void; user: any; logout: () => Promise<{ success: boolean }>; userLocation: { lat: number, lng: number } | null }) {
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
    lat: null as number | null,
    lng: null as number | null
  })

  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")

  // Cargar datos actuales de Firestore al iniciar
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.uid) return

      try {
        const { getDoc, doc } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase")

        const docRef = doc(db, 'users', user.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          setProfileData(prev => ({
            ...prev,
            ...data,
            businessName: data.businessName || data.displayName || user.displayName || "Mi Negocio",
            email: data.email || user.email || "",
            // Asegurarse de que businessHours esté presente
            businessHours: data.businessHours || prev.businessHours
          }))
        }
      } catch (error) {
        console.error("Error cargando perfil:", error)
      }
    }

    loadProfileData()
  }, [user])

  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false)

  const updateLocation = () => {
    setIsUpdatingLocation(true)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setProfileData(prev => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }))
          setIsUpdatingLocation(false)
          setSuccess("Ubicación GPS capturada correctamente")
          setTimeout(() => setSuccess(""), 3000)
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error)
          alert("No se pudo obtener la ubicación. Asegúrate de dar permisos.")
          setIsUpdatingLocation(false)
        }
      )
    } else {
      alert("Tu navegador no soporta geolocalización")
      setIsUpdatingLocation(false)
    }
  }

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

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido')
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 5MB')
      return
    }

    setUploadingImage(type)

    // URL temporal para feedback visual inmediato
    const imageUrl = URL.createObjectURL(file)
    if (type === 'profile') {
      setProfileData(prev => ({ ...prev, profileImage: imageUrl }))
    } else {
      setProfileData(prev => ({ ...prev, coverImage: imageUrl }))
    }

    setUploadingImage(type)

    // Subida real a Firebase Storage
    try {
      const storagePath = `users/${user.uid}/${type}_${Date.now()}`
      const downloadURL = await uploadFile(file, storagePath)

      const updateObj: any = {}
      if (type === 'profile') {
        updateObj.profileImage = downloadURL
        setProfileData(prev => ({ ...prev, profileImage: downloadURL }))
      } else {
        updateObj.coverImage = downloadURL
        setProfileData(prev => ({ ...prev, coverImage: downloadURL }))
      }

      // Actualizar en Firestore
      await setDoc(doc(db, 'users', user.uid), {
        ...updateObj,
        updatedAt: new Date()
      }, { merge: true })

      setSuccess(`¡Imagen ${type === 'profile' ? 'de perfil' : 'de portada'} actualizada!`)
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error('Error al subir imagen:', error)
      alert('Error al subir la imagen. Intenta de nuevo.')
    } finally {
      setUploadingImage(null)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'oklch(0.98 0.01 200)' }}>
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => setFlow("dashboard")}>
            ← Volver
          </Button>
          <h1 className="text-xl font-bold">Mi Perfil</h1>
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

      <div className="p-4 space-y-6">
        {/* Cover Image */}
        <Card>
          <CardContent className="p-0">
            <div className="relative h-32 bg-gradient-to-r from-primary/20 to-primary/10 rounded-t-lg">
              <img
                src={profileData.coverImage}
                alt="Cover"
                className="w-full h-full object-cover rounded-t-lg"
              />
              <div className="absolute inset-0 bg-black/20 rounded-t-lg" />
              {uploadingImage === 'cover' && (
                <div className="absolute inset-0 bg-black/50 rounded-t-lg flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm">Subiendo imagen...</p>
                  </div>
                </div>
              )}
              {isEditing && (
                <div className="absolute top-2 right-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload('cover', e)}
                    className="hidden"
                    id="cover-upload"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      const input = document.getElementById('cover-upload')
                      if (input) {
                        input.click()
                      }
                    }}
                    disabled={uploadingImage === 'cover'}
                  >
                    {uploadingImage === 'cover' ? 'Subiendo...' : 'Cambiar portada'}
                  </Button>
                </div>
              )}
            </div>

            {/* Profile Image */}
            <div className="relative px-6 pb-6">
              <div className="flex items-end -mt-12 gap-4">
                <div className="relative">
                  <img
                    src={profileData.profileImage}
                    alt="Profile"
                    className="w-24 h-24 rounded-full border-4 border-white object-cover"
                  />
                  {uploadingImage === 'profile' && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    </div>
                  )}
                  {isEditing && (
                    <div className="absolute -bottom-2 -right-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload('profile', e)}
                        className="hidden"
                        id="profile-upload"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-8 h-8 rounded-full p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          const input = document.getElementById('profile-upload')
                          if (input) {
                            input.click()
                          }
                        }}
                        disabled={uploadingImage === 'profile'}
                      >
                        {uploadingImage === 'profile' ? '⏳' : '📷'}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <h2 className="text-xl font-semibold">{profileData.businessName}</h2>
                  <p className="text-muted-foreground">{profileData.email}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Información del Negocio</h3>
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Cancelar" : "Editar"}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Nombre del Negocio</Label>
                  <Input
                    id="business-name"
                    value={profileData.businessName}
                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    disabled={!isEditing}
                    placeholder="11 1234-5678"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección (Escrita)</Label>
                <div className="flex gap-2">
                  <Input
                    id="address"
                    value={profileData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    disabled={!isEditing}
                    placeholder="Av. Corrientes 1234, CABA"
                    className="flex-1"
                  />
                  {isEditing && (
                    <Button
                      type="button"
                      onClick={updateLocation}
                      variant="outline"
                      className={profileData.lat ? "border-green-500 text-green-600" : ""}
                      disabled={isUpdatingLocation}
                    >
                      <MapPin className={`h-4 w-4 mr-1 ${isUpdatingLocation ? "animate-pulse" : ""}`} />
                      {profileData.lat ? "Actualizar GPS" : "Obtener GPS"}
                    </Button>
                  )}
                </div>
                {profileData.lat && (
                  <p className="text-[10px] text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Coordenadas GPS guardadas ({profileData.lat.toFixed(4)}, {profileData.lng?.toFixed(4)})
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <textarea
                  id="description"
                  className="w-full p-3 border border-gray-300 rounded-md resize-none"
                  rows={3}
                  value={profileData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Describe tu negocio y servicios..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Sitio Web</Label>
                  <Input
                    id="website"
                    value={profileData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://minegocio.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={profileData.instagram}
                    onChange={(e) => handleInputChange("instagram", e.target.value)}
                    disabled={!isEditing}
                    placeholder="@minegocio"
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={loading} className="flex-1">
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Horarios de Atención</h3>
            <div className="space-y-3">
              {Object.entries(profileData.businessHours).map(([day, hours]) => (
                <div key={day} className="flex items-center justify-between">
                  <span className="capitalize font-medium">{day === 'monday' ? 'Lunes' :
                    day === 'tuesday' ? 'Martes' :
                      day === 'wednesday' ? 'Miércoles' :
                        day === 'thursday' ? 'Jueves' :
                          day === 'friday' ? 'Viernes' :
                            day === 'saturday' ? 'Sábado' : 'Domingo'}</span>
                  <Input
                    value={hours}
                    onChange={(e) => handleHoursChange(day, e.target.value)}
                    disabled={!isEditing}
                    className="w-32 text-right"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mis Estadísticas - Solo para Pro */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Mis Estadísticas</h3>
                <p className="text-sm text-muted-foreground">Visualiza el rendimiento de tus anuncios (Solo Pro)</p>
              </div>
              <Button onClick={() => setFlow("statistics")} variant="orange">
                Ver estadísticas
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Configuración</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificaciones por email</p>
                  <p className="text-sm text-muted-foreground">Recibe notificaciones de nuevas reservas</p>
                </div>
                <Button variant="outline" size="sm">Activar</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Modo automático</p>
                  <p className="text-sm text-muted-foreground">Acepta reservas automáticamente</p>
                </div>
                <Button variant="outline" size="sm">Desactivar</Button>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleLogout}
                  disabled={loading}
                >
                  Cerrar sesión
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const categories = ["Belleza", "Salud", "Deporte", "Hogar", "Educación", "Tecnología", "Oficios", "Profesionales", "Aprendizaje"]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      let imageUrl = "/placeholder.svg"
      if (imageFile) {
        setUploadingImage(true)
        const storagePath = `services/${user.uid}/${Date.now()}_${imageFile.name}`
        imageUrl = await uploadFile(imageFile, storagePath)
        setUploadingImage(false)
      }

      const serviceData = {
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
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
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
  service?: any
  user?: any
  updateService?: (id: string, data: any) => Promise<{ success: boolean, error?: string }>
  userLocation: { lat: number, lng: number } | null
}) {
  const { updateService: updateServiceHook } = useServices()
  const updateServiceFn = updateService || updateServiceHook

  const [formData, setFormData] = useState({
    name: service?.name || "",
    description: service?.description || "",
    price: service?.price?.toString() || "",
    duration: (service as any)?.duration || "",
    category: service?.category || "",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const categories = ["Belleza", "Salud", "Deporte", "Hogar", "Educación", "Tecnología", "Oficios", "Profesionales", "Aprendizaje"]

  // Cargar datos del servicio cuando cambie
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || "",
        description: service.description || "",
        price: service.price?.toString() || "",
        duration: (service as any)?.duration || "",
        category: service.category || "",
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
      let imageUrl = (service as any)?.image
      if (imageFile) {
        setUploadingImage(true)
        const storagePath = `services/${user.uid}/edit_${Date.now()}_${imageFile.name}`
        imageUrl = await uploadFile(imageFile, storagePath)
        setUploadingImage(false)
      }

      const serviceData = {
        name: formData.name,
        description: formData.description,
        price: parseInt(formData.price.replace('$', '').replace(/\./g, '')) || parseInt(formData.price),
        duration: formData.duration,
        category: formData.category,
        image: imageUrl,
        lat: userLocation?.lat || (service as any)?.lat || null,
        lng: userLocation?.lng || (service as any)?.lng || null,
        active: (service as any)?.active !== false,
        updatedAt: new Date()
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
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-service-image">Imagen del servicio</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="edit-service-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                  {(imageFile || (service as any)?.image) && (
                    <div className="w-12 h-12 rounded border overflow-hidden bg-gray-50 flex-shrink-0">
                      <img
                        src={imageFile ? URL.createObjectURL(imageFile) : (service as any)?.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
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

function ProviderStatistics({ setFlow, user, services }: { setFlow: (flow: string) => void; user: any; services: any[] }) {
  const { getBookingsByProvider } = useBookings()

  // Filtrar servicios del proveedor
  const providerServices = services.filter(service => service.providerId === user?.uid)
  const providerBookings = getBookingsByProvider(user?.uid) || []

  // Calcular estadísticas
  const totalViews = providerServices.reduce((sum, s) => sum + ((s as any).views || 0), 0)
  const totalBookings = providerBookings.length
  const totalRevenue = providerBookings
    .filter(b => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + (b.price || 0), 0)
  const conversionRate = totalViews > 0 ? (totalBookings / totalViews) * 100 : 0

  // Estadísticas por servicio
  const serviceStats = providerServices.map(service => {
    const serviceBookings = providerBookings.filter(b => b.serviceId === service.id)
    const serviceRevenue = serviceBookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + (b.price || 0), 0)
    const serviceViews = (service as any).views || 0
    const serviceConversion = serviceViews > 0 ? (serviceBookings.length / serviceViews) * 100 : 0

    return {
      ...service,
      bookings: serviceBookings.length,
      revenue: serviceRevenue,
      views: serviceViews,
      conversion: serviceConversion
    }
  }).sort((a, b) => b.bookings - a.bookings)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'oklch(0.98 0.01 200)' }}>
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setFlow("profile")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-primary">Mis Estadísticas</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Resumen General */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{totalViews}</p>
              <p className="text-sm text-muted-foreground">Visualizaciones</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{totalBookings}</p>
              <p className="text-sm text-muted-foreground">Reservas</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">${totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Ingresos</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{conversionRate.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Conversión</p>
            </CardContent>
          </Card>
        </div>

        {/* Rendimiento por Servicio */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Rendimiento por Servicio</h3>
            <div className="space-y-4">
              {serviceStats.length > 0 ? (
                serviceStats.map((service) => (
                  <div key={service.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{service.name}</h4>
                      <span className="text-sm text-muted-foreground">${service.revenue.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Visualizaciones</p>
                        <p className="font-semibold">{service.views}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Reservas</p>
                        <p className="font-semibold">{service.bookings}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Conversión</p>
                        <p className="font-semibold">{service.conversion.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${Math.min(service.conversion, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No tienes servicios para mostrar estadísticas</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de tendencias (simplificado) */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Tendencias</h3>
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Los gráficos detallados están disponibles en la versión Premium</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setFlow("subscription")}
              >
                Actualizar a Premium
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ProviderSubscription({ setFlow }: { setFlow: (flow: string) => void }) {
  const [selectedPlan, setSelectedPlan] = useState<string>("")

  const premiumFeatures = [
    "Promociones ilimitadas",
    "Destacar publicaciones",
    "Estadísticas completas",
    "Notificaciones push",
    "Soporte prioritario",
    "Análisis de competencia",
  ]

  const handleSubscribe = () => {
    if (selectedPlan) {
      alert("¡Suscripción activada! Ahora tienes acceso a todas las funciones premium.")
      setFlow("dashboard")
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'oklch(0.98 0.01 200)' }}>
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setFlow("dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Suscripción Premium</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Hero Section */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Lleva tu negocio al siguiente nivel</h2>
            <p className="text-muted-foreground">
              Accede a herramientas avanzadas para hacer crecer tu negocio y destacar entre la competencia
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Beneficios Premium</h3>
            <div className="space-y-3">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                    <Star className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Plans */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Elige tu plan</h3>

          {/* Monthly Plan */}
          <Card
            className={`cursor-pointer transition-all ${selectedPlan === "monthly" ? "ring-2 ring-primary border-primary" : ""
              }`}
            onClick={() => setSelectedPlan("monthly")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Plan Mensual</h4>
                  <p className="text-sm text-muted-foreground">Facturación mensual</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">$2,999</p>
                  <p className="text-sm text-muted-foreground">por mes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Annual Plan */}
          <Card
            className={`cursor-pointer transition-all relative ${selectedPlan === "annual" ? "ring-2 ring-primary border-primary" : ""
              }`}
            onClick={() => setSelectedPlan("annual")}
          >
            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
              20% OFF
            </div>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Plan Anual</h4>
                  <p className="text-sm text-muted-foreground">Facturación anual - Ahorra $7,200</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">$28,800</p>
                  <p className="text-sm text-muted-foreground">por año</p>
                  <p className="text-xs text-green-600">$2,400/mes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscribe Button */}
        <Button onClick={handleSubscribe} disabled={!selectedPlan} className="w-full h-12 text-base">
          Suscribirme ahora
        </Button>

        {/* Terms */}
        <div className="text-center text-xs text-muted-foreground">
          <p>Al suscribirte aceptas nuestros términos y condiciones.</p>
          <p>Puedes cancelar tu suscripción en cualquier momento.</p>
        </div>
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
    <div className="min-h-screen" style={{ backgroundColor: 'oklch(0.98 0.01 200)' }}>
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-xl font-bold text-primary truncate">Panel de Administración</h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">Bienvenido, {user?.displayName || user?.email}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const result = await logout()
              if (result.success) {
                localStorage.removeItem('userType')
                window.location.reload()
              }
            }}
            className="ml-2 flex-shrink-0"
          >
            <span className="hidden sm:inline">Cerrar sesión</span>
            <span className="sm:hidden">Salir</span>
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex w-full">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'categories', label: 'Categorías', icon: '📁' },
            { id: 'users', label: 'Usuarios', icon: '👥' },
            { id: 'services', label: 'Servicios', icon: '🛠️' },
            { id: 'analytics', label: 'Analytics', icon: '📈' },
            { id: 'reports', label: 'Informes', icon: '📄' },
            { id: 'settings', label: 'Configuración', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 px-1 md:py-4 md:px-2 border-b-2 font-medium text-xs md:text-sm ${activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <div className="flex flex-col items-center space-y-1">
                <span className="text-lg md:text-xl">{tab.icon}</span>
                <span className="hidden sm:block text-xs md:text-sm">{tab.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 md:p-6">
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

                {/* Usuarios */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Usuarios activos hoy</p>
                          <p className="text-2xl font-bold text-primary">{stats.activeUsersToday}</p>
                        </div>
                        <div className="text-3xl">👥</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Nuevos esta semana</p>
                          <p className="text-2xl font-bold text-green-600">{stats.newUsersThisWeek}</p>
                        </div>
                        <div className="text-3xl">🆕</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Comercios */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Comercios activos</p>
                          <p className="text-2xl font-bold text-blue-600">{stats.activeBusinesses}</p>
                        </div>
                        <div className="text-3xl">🏪</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Pendientes de verificación</p>
                          <p className="text-2xl font-bold text-yellow-600">{stats.businessesPendingVerification}</p>
                        </div>
                        <div className="text-3xl">⏳</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Publicaciones */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Publicaciones nuevas</p>
                          <p className="text-2xl font-bold text-green-600">{stats.newPublications}</p>
                        </div>
                        <div className="text-3xl">✨</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Pendientes</p>
                          <p className="text-2xl font-bold text-yellow-600">{stats.pendingPublications}</p>
                        </div>
                        <div className="text-3xl">📋</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Denunciadas</p>
                          <p className="text-2xl font-bold text-red-600">{stats.reportedPublications}</p>
                        </div>
                        <div className="text-3xl">🚨</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Chats */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Chats iniciados</p>
                        <p className="text-2xl font-bold text-purple-600">{stats.chatsInitiated}</p>
                      </div>
                      <div className="text-3xl">💬</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Top 5 Búsquedas del día */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-4">🔍 Top 5 búsquedas del día</h3>
                    {stats.topSearches.length > 0 ? (
                      <div className="space-y-2">
                        {stats.topSearches.map((search, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg font-bold text-primary">#{index + 1}</span>
                              <span className="text-sm">{search.term}</span>
                            </div>
                            <span className="text-sm text-gray-500">{search.count} búsquedas</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No hay búsquedas registradas hoy</p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h2 className="text-lg font-semibold">Gestión de Categorías</h2>
              <Button
                onClick={() => setShowCreateCategory(true)}
                className="w-full sm:w-auto"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Categoría
              </Button>
            </div>

            {/* Lista de categorías */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {categoriesLoading ? (
                <div className="col-span-full text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Cargando categorías...</p>
                </div>
              ) : (
                categories.map(category => (
                  <Card key={category.id}>
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <span className="text-xl md:text-2xl flex-shrink-0">{category.icon}</span>
                          <h3 className="font-semibold truncate">{category.name}</h3>
                        </div>
                        <div className="flex space-x-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingCategory(category)}
                            className="p-1 md:p-2"
                          >
                            <span className="text-xs md:text-sm">✏️</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-1 md:p-2"
                          >
                            <span className="text-xs md:text-sm">🗑️</span>
                          </Button>
                        </div>
                      </div>
                      {category.description && (
                        <p className="text-xs md:text-sm text-gray-600 mb-2 line-clamp-2">{category.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full ${category.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {category.active ? 'Activa' : 'Inactiva'}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleCategoryStatus(category.id)}
                          className="text-xs"
                        >
                          {category.active ? 'Desactivar' : 'Activar'}
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
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h2 className="text-lg font-semibold">Gestión de Usuarios</h2>
              <div className="flex space-x-2">
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm w-full sm:w-auto"
                >
                  <option value="all">Todos</option>
                  <option value="client">Clientes</option>
                  <option value="provider">Proveedores</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>

            {/* Lista de usuarios - Vista móvil */}
            <div className="block md:hidden">
              <div className="space-y-3">
                {usersLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando usuarios...</p>
                  </div>
                ) : (
                  filteredUsers.map(user => (
                    <Card key={user.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                              {(user.displayName?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {user.displayName || 'Sin nombre'}
                              </div>
                              <div className="text-xs text-gray-500 truncate">{user.email || 'Sin email'}</div>
                            </div>
                          </div>
                          <div className="flex space-x-1 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingUser(user)}
                              className="p-1"
                            >
                              <span className="text-xs">✏️</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleUserStatus(user.id)}
                              className="p-1"
                            >
                              <span className="text-xs">{user.isActive ? '🚫' : '✅'}</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1"
                            >
                              <span className="text-xs">🗑️</span>
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'provider' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                              {user.role === 'admin' ? 'Admin' :
                                user.role === 'provider' ? 'Proveedor' : 'Cliente'}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                              {user.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.createdAt.toLocaleDateString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Lista de usuarios - Vista desktop */}
            <div className="hidden md:block bg-white rounded-lg shadow">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registro</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usersLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center">
                          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                          <p className="text-muted-foreground">Cargando usuarios...</p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
                                  {(user.displayName?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.displayName || 'Sin nombre'}
                                </div>
                                <div className="text-sm text-gray-500">{user.email || 'Sin email'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'provider' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                              {user.role === 'admin' ? 'Admin' :
                                user.role === 'provider' ? 'Proveedor' : 'Cliente'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                              {user.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.createdAt.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingUser(user)}
                              >
                                ✏️
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleUserStatus(user.id)}
                              >
                                {user.isActive ? '🚫' : '✅'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                🗑️
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h2 className="text-lg font-semibold">Gestión de Servicios</h2>
              <div className="flex space-x-2">
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm w-full sm:w-auto"
                >
                  <option value="all">Todos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>
            </div>

            {/* Lista de servicios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {filteredServices.map(service => (
                <Card key={service.id}>
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm md:text-lg truncate flex-1 mr-2">{service.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${(service as any).active !== false
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {(service as any).active !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    <p className="text-xs md:text-sm text-gray-600 mb-3 line-clamp-2">{service.description}</p>

                    <div className="space-y-1 md:space-y-2 mb-4">
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-gray-500">Proveedor:</span>
                        <span className="font-medium truncate ml-2">{service.providerName}</span>
                      </div>
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-gray-500">Precio:</span>
                        <span className="font-medium">${service.price}</span>
                      </div>
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-gray-500">Duración:</span>
                        <span className="font-medium">{(service as any).duration || 60} min</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                      >
                        ✏️ Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                      >
                        {(service as any).active !== false ? '🚫' : '✅'} {(service as any).active !== false ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h2 className="text-lg font-semibold">Informes</h2>
              <div className="flex gap-2">
                <Button
                  variant={reportType === 'daily' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setReportType('daily')
                    generateDailyReport()
                  }}
                >
                  Diario
                </Button>
                <Button
                  variant={reportType === 'weekly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setReportType('weekly')
                    generateWeeklyReport()
                  }}
                >
                  Semanal
                </Button>
                <Button
                  variant={reportType === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setReportType('monthly')
                    generateMonthlyReport()
                  }}
                >
                  Mensual
                </Button>
              </div>
            </div>

            {reportsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Generando informe...</p>
              </div>
            ) : (
              <>
                {/* Informe Diario */}
                {reportType === 'daily' && dailyReport && (
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-lg font-semibold mb-4">📅 Informe Diario - {new Date(dailyReport.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-primary">{dailyReport.activeUsers}</p>
                            <p className="text-sm text-gray-600">Usuarios activos</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{dailyReport.newPublications}</p>
                            <p className="text-sm text-gray-600">Publicaciones nuevas</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">{dailyReport.chatsInitiated}</p>
                            <p className="text-sm text-gray-600">Chats iniciados</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">{dailyReport.reports}</p>
                            <p className="text-sm text-gray-600">Denuncias</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Informe Semanal */}
                {reportType === 'weekly' && weeklyReport && (
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-lg font-semibold mb-4">📊 Informe Semanal - {weeklyReport.week}</h3>

                        {/* Ranking de búsquedas por ciudad */}
                        <div className="mb-6">
                          <h4 className="font-semibold mb-3">🔍 Ranking de búsquedas por ciudad</h4>
                          {weeklyReport.topSearchesByCity.length > 0 ? (
                            <div className="space-y-4">
                              {weeklyReport.topSearchesByCity.map((cityData, index) => (
                                <Card key={index} className="bg-gray-50">
                                  <CardContent className="p-4">
                                    <h5 className="font-medium mb-2">{cityData.city}</h5>
                                    <div className="space-y-1">
                                      {cityData.searches.slice(0, 5).map((search, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                          <span>#{idx + 1} {search.term}</span>
                                          <span className="text-gray-500">{search.count} búsquedas</span>
                                        </div>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No hay datos de búsquedas por ciudad</p>
                          )}
                        </div>

                        {/* Promociones con mejor rendimiento */}
                        <div className="mb-6">
                          <h4 className="font-semibold mb-3">⭐ Promociones con mejor rendimiento</h4>
                          {weeklyReport.bestPerformingPromos.length > 0 ? (
                            <div className="space-y-2">
                              {weeklyReport.bestPerformingPromos.map((promo, index) => (
                                <div key={promo.id} className="flex items-center justify-between p-3 bg-green-50 rounded">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-lg font-bold text-green-600">#{index + 1}</span>
                                    <span className="text-sm font-medium">{promo.name}</span>
                                  </div>
                                  <span className="text-sm text-green-600 font-semibold">{promo.performance.toFixed(2)}%</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No hay promociones activas</p>
                          )}
                        </div>

                        {/* Promociones con peor rendimiento */}
                        <div>
                          <h4 className="font-semibold mb-3">📉 Promociones con peor rendimiento</h4>
                          {weeklyReport.worstPerformingPromos.length > 0 ? (
                            <div className="space-y-2">
                              {weeklyReport.worstPerformingPromos.map((promo, index) => (
                                <div key={promo.id} className="flex items-center justify-between p-3 bg-red-50 rounded">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-lg font-bold text-red-600">#{index + 1}</span>
                                    <span className="text-sm font-medium">{promo.name}</span>
                                  </div>
                                  <span className="text-sm text-red-600 font-semibold">{promo.performance.toFixed(2)}%</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No hay promociones con bajo rendimiento</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Informe Mensual */}
                {reportType === 'monthly' && monthlyReport && (
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-lg font-semibold mb-4">📈 Informe Mensual - {monthlyReport.month}</h3>

                        {/* Crecimiento general */}
                        <div className="mb-6">
                          <h4 className="font-semibold mb-3">📊 Crecimiento General</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-blue-50 rounded">
                              <p className="text-2xl font-bold text-blue-600">{monthlyReport.userGrowth > 0 ? '+' : ''}{monthlyReport.userGrowth.toFixed(1)}%</p>
                              <p className="text-sm text-gray-600">Crecimiento</p>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded">
                              <p className="text-2xl font-bold text-green-600">{monthlyReport.totalUsers}</p>
                              <p className="text-sm text-gray-600">Total usuarios</p>
                            </div>
                            <div className="text-center p-3 bg-purple-50 rounded">
                              <p className="text-2xl font-bold text-purple-600">{monthlyReport.newUsers}</p>
                              <p className="text-sm text-gray-600">Nuevos usuarios</p>
                            </div>
                            <div className="text-center p-3 bg-orange-50 rounded">
                              <p className="text-2xl font-bold text-orange-600">{monthlyReport.returningUsers}</p>
                              <p className="text-sm text-gray-600">Usuarios que volvieron</p>
                            </div>
                          </div>
                        </div>

                        {/* Retención de usuarios */}
                        <div className="mb-6">
                          <h4 className="font-semibold mb-3">🔄 Retención de Usuarios</h4>
                          <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-600">Tasa de retención</p>
                                  <p className="text-3xl font-bold text-purple-600">{monthlyReport.userRetention.toFixed(1)}%</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {monthlyReport.returningUsers} de {monthlyReport.totalUsers} usuarios volvieron este mes
                                  </p>
                                </div>
                                <div className="text-4xl">🔄</div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Resumen de promociones */}
                        <div>
                          <h4 className="font-semibold mb-3">🎯 Resumen de Promociones</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card>
                              <CardContent className="p-4 text-center">
                                <p className="text-2xl font-bold text-primary">{monthlyReport.promoSummary.total}</p>
                                <p className="text-sm text-gray-600">Total promociones</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4 text-center">
                                <p className="text-2xl font-bold text-green-600">{monthlyReport.promoSummary.active}</p>
                                <p className="text-sm text-gray-600">Activas</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4 text-center">
                                <p className="text-2xl font-bold text-gray-600">{monthlyReport.promoSummary.completed}</p>
                                <p className="text-sm text-gray-600">Completadas</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4 text-center">
                                <p className="text-2xl font-bold text-green-600">${monthlyReport.promoSummary.totalRevenue.toLocaleString()}</p>
                                <p className="text-sm text-gray-600">Ingresos totales</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Mensaje cuando no hay informe generado */}
                {reportType === 'daily' && !dailyReport && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-gray-500">Haz clic en "Diario" para generar el informe del día</p>
                    </CardContent>
                  </Card>
                )}
                {reportType === 'weekly' && !weeklyReport && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-gray-500">Haz clic en "Semanal" para generar el informe de la semana</p>
                    </CardContent>
                  </Card>
                )}
                {reportType === 'monthly' && !monthlyReport && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-gray-500">Haz clic en "Mensual" para generar el informe del mes</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-lg font-semibold">Analytics y Reportes</h2>

            {/* Métricas principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              <Card>
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm font-medium text-gray-600">Usuarios Activos</p>
                      <p className="text-lg md:text-2xl font-bold text-green-600">{analytics.activeUsers}</p>
                    </div>
                    <div className="text-lg md:text-2xl">👥</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm font-medium text-gray-600">Usuarios Inactivos</p>
                      <p className="text-lg md:text-2xl font-bold text-red-600">{analytics.inactiveUsers}</p>
                    </div>
                    <div className="text-lg md:text-2xl">🚫</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm font-medium text-gray-600">Ingresos Totales</p>
                      <p className="text-sm md:text-2xl font-bold text-green-600">${analytics.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="text-lg md:text-2xl">💰</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm font-medium text-gray-600">Reservas Totales</p>
                      <p className="text-lg md:text-2xl font-bold text-blue-600">{analytics.totalBookings}</p>
                    </div>
                    <div className="text-lg md:text-2xl">📅</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Servicios más populares */}
            <Card>
              <CardContent className="p-4 md:p-6">
                <h3 className="text-lg font-semibold mb-4">Servicios Más Populares</h3>
                <div className="space-y-3">
                  {analytics.topServices.map((service, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <span className="text-sm font-medium text-gray-500 flex-shrink-0">#{index + 1}</span>
                        <span className="text-sm font-medium truncate">{service.name}</span>
                      </div>
                      <span className="text-sm text-gray-500 flex-shrink-0">{service.bookings} reservas</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reservas recientes */}
            <Card>
              <CardContent className="p-4 md:p-6">
                <h3 className="text-lg font-semibold mb-4">Reservas Recientes</h3>
                <div className="space-y-3">
                  {analytics.recentBookings.slice(0, 5).map((booking, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{booking.serviceName}</p>
                        <p className="text-xs text-gray-500 truncate">{booking.clientName}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-medium text-sm">${booking.price}</p>
                        <p className="text-xs text-gray-500">{booking.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-lg font-semibold">Configuración General</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Configuración de la aplicación */}
              <Card>
                <CardContent className="p-4 md:p-6">
                  <h3 className="text-lg font-semibold mb-4">Configuración de la Aplicación</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="app-name">Nombre de la Aplicación</Label>
                      <Input
                        id="app-name"
                        value={settings.appName}
                        onChange={(e) => handleSettingChange('appName', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="app-description">Descripción</Label>
                      <Input
                        id="app-description"
                        value={settings.appDescription}
                        onChange={(e) => handleSettingChange('appDescription', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="app-email">Email de Contacto</Label>
                      <Input
                        id="app-email"
                        value={settings.appEmail}
                        onChange={(e) => handleSettingChange('appEmail', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <Button
                      onClick={() => saveSettings('aplicación')}
                      className="w-full text-sm"
                    >
                      Guardar Configuración
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Configuración de notificaciones */}
              <Card>
                <CardContent className="p-4 md:p-6">
                  <h3 className="text-lg font-semibold mb-4">Notificaciones</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">Notificaciones por email</span>
                        <p className="text-xs text-gray-500">Recibe notificaciones de nuevas reservas</p>
                      </div>
                      <button
                        onClick={() => handleSettingChange('emailNotifications', !settings.emailNotifications)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${settings.emailNotifications
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {settings.emailNotifications ? 'Activar' : 'Desactivar'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">Notificaciones push</span>
                        <p className="text-xs text-gray-500">Notificaciones en tiempo real</p>
                      </div>
                      <button
                        onClick={() => handleSettingChange('pushNotifications', !settings.pushNotifications)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${settings.pushNotifications
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {settings.pushNotifications ? 'Activar' : 'Desactivar'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">Recordatorios de citas</span>
                        <p className="text-xs text-gray-500">Recordatorios automáticos</p>
                      </div>
                      <button
                        onClick={() => handleSettingChange('appointmentReminders', !settings.appointmentReminders)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${settings.appointmentReminders
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {settings.appointmentReminders ? 'Activar' : 'Desactivar'}
                      </button>
                    </div>
                    <Button
                      onClick={() => saveSettings('notificaciones')}
                      className="w-full text-sm"
                    >
                      Guardar Preferencias
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Configuración de pagos */}
              <Card>
                <CardContent className="p-4 md:p-6">
                  <h3 className="text-lg font-semibold mb-4">Configuración de Pagos</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="commission-rate">Tasa de Comisión (%)</Label>
                      <Input
                        id="commission-rate"
                        type="number"
                        value={settings.commissionRate}
                        onChange={(e) => handleSettingChange('commissionRate', parseInt(e.target.value))}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="min-price">Precio Mínimo de Servicio</Label>
                      <Input
                        id="min-price"
                        type="number"
                        value={settings.minPrice}
                        onChange={(e) => handleSettingChange('minPrice', parseInt(e.target.value))}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-price">Precio Máximo de Servicio</Label>
                      <Input
                        id="max-price"
                        type="number"
                        value={settings.maxPrice}
                        onChange={(e) => handleSettingChange('maxPrice', parseInt(e.target.value))}
                        className="text-sm"
                      />
                    </div>
                    <Button
                      onClick={() => saveSettings('pagos')}
                      className="w-full text-sm"
                    >
                      Guardar Configuración
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Configuración de seguridad */}
              <Card>
                <CardContent className="p-4 md:p-6">
                  <h3 className="text-lg font-semibold mb-4">Seguridad</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="session-timeout">Timeout de Sesión (minutos)</Label>
                      <Input
                        id="session-timeout"
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                        className="text-sm"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">Verificación de email obligatoria</span>
                        <p className="text-xs text-gray-500">Los usuarios deben verificar su email</p>
                      </div>
                      <button
                        onClick={() => handleSettingChange('emailVerificationRequired', !settings.emailVerificationRequired)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${settings.emailVerificationRequired
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {settings.emailVerificationRequired ? 'Activar' : 'Desactivar'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">Registro abierto</span>
                        <p className="text-xs text-gray-500">Cualquiera puede registrarse</p>
                      </div>
                      <button
                        onClick={() => handleSettingChange('openRegistration', !settings.openRegistration)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${settings.openRegistration
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {settings.openRegistration ? 'Activar' : 'Desactivar'}
                      </button>
                    </div>
                    <Button
                      onClick={() => saveSettings('seguridad')}
                      className="w-full text-sm"
                    >
                      Guardar Configuración
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear Categoría */}
      {showCreateCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardContent className="p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-4">Nueva Categoría</h3>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Belleza"
                    required
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="icon">Icono</Label>
                  <Input
                    id="icon"
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="Ej: 💄"
                    required
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descripción opcional"
                    className="text-sm"
                  />
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button type="submit" className="flex-1 text-sm">
                    Crear Categoría
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateCategory(false)}
                    className="flex-1 text-sm"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Editar Categoría */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardContent className="p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-4">Editar Categoría</h3>
              <form onSubmit={handleEditCategory} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Nombre</Label>
                  <Input
                    id="edit-name"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory((prev: any) => ({ ...prev, name: e.target.value }))}
                    required
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-icon">Icono</Label>
                  <Input
                    id="edit-icon"
                    value={editingCategory.icon}
                    onChange={(e) => setEditingCategory((prev: any) => ({ ...prev, icon: e.target.value }))}
                    required
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Descripción</Label>
                  <Input
                    id="edit-description"
                    value={editingCategory.description || ''}
                    onChange={(e) => setEditingCategory((prev: any) => ({ ...prev, description: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button type="submit" className="flex-1 text-sm">
                    Guardar Cambios
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingCategory(null)}
                    className="flex-1 text-sm"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardContent className="p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-4">Editar Usuario</h3>
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target as HTMLFormElement)
                const newRole = formData.get('role') as string
                handleUpdateUserRole(editingUser.id, newRole)
              }} className="space-y-4">
                <div>
                  <Label htmlFor="user-name">Nombre</Label>
                  <Input
                    id="user-name"
                    value={editingUser.displayName || ''}
                    disabled
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="user-email">Email</Label>
                  <Input
                    id="user-email"
                    value={editingUser.email}
                    disabled
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="user-role">Rol</Label>
                  <select
                    name="role"
                    id="user-role"
                    defaultValue={editingUser.role}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="client">Cliente</option>
                    <option value="provider">Proveedor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button type="submit" className="flex-1 text-sm">
                    Guardar Cambios
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 text-sm"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
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
