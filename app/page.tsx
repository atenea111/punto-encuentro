"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
} from "lucide-react"

export default function HomePage() {
  const { user, signIn, signUp, logout, loading: authLoading } = useAuth()
  const { services, loading: servicesLoading, searchServices, createService } = useServices()
  const { createBooking, getBookingsByClient } = useBookings()
  const { isAdmin, loading: rolesLoading } = useRoles()
  
  const [userType, setUserType] = useState<"client" | "provider" | null>(null)
  const [clientFlow, setClientFlow] = useState<
    "onboarding" | "login" | "register" | "home" | "profile" | "agenda" | "service-detail" | "booking" | "payment"
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
  >("onboarding")
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [authError, setAuthError] = useState("")
  const [authSuccess, setAuthSuccess] = useState("")

  // Persistir tipo de usuario en localStorage
  useEffect(() => {
    if (userType) {
      localStorage.setItem('userType', userType)
    }
  }, [userType])

  // Cargar tipo de usuario desde localStorage al inicializar
  useEffect(() => {
    const savedUserType = localStorage.getItem('userType') as "client" | "provider" | null
    if (savedUserType && user) {
      setUserType(savedUserType)
    }
  }, [user])

  // Limpiar localStorage al cerrar sesión
  useEffect(() => {
    if (!user) {
      localStorage.removeItem('userType')
      setUserType(null)
    }
  }, [user])

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

  // Si el usuario es admin, mostrar panel de administración
  if (user && isAdmin) {
    console.log('Mostrando panel de admin para:', user.email)
    return <AdminDashboard user={user} logout={logout} />
  }

  // Si el usuario está logueado pero no se ha seleccionado tipo de usuario, mostrar selección
  if (user && !userType) {
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
      />
    )
  }

  if (userType === "provider") {
    return (
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
      />
    )
  }

  return (
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
  user 
}: { 
  flow: string
  setFlow: (flow: any) => void
  signIn: (email: string, password: string) => Promise<{success: boolean, error?: string}>
  signUp: (email: string, password: string) => Promise<{success: boolean, error?: string}>
  setAuthError: (error: string) => void
  authError: string
  setAuthSuccess: (message: string) => void
  authSuccess: string
  services: any[]
  createService: (serviceData: any) => Promise<{success: boolean, error?: string}>
  user: any
}) {
  if (flow === "login") {
    return <ProviderLogin setFlow={setFlow} signIn={signIn} setAuthError={setAuthError} authError={authError} setAuthSuccess={setAuthSuccess} authSuccess={authSuccess} />
  }

  if (flow === "register") {
    return <ProviderRegister setFlow={setFlow} signUp={signUp} setAuthError={setAuthError} authError={authError} setAuthSuccess={setAuthSuccess} authSuccess={authSuccess} />
  }

  if (flow === "dashboard") {
    return <ProviderDashboard setFlow={setFlow} user={user} services={services} />
  }

  if (flow === "profile") {
    return <ProviderProfile setFlow={setFlow} user={user} />
  }

  if (flow === "agenda") {
    return <ProviderAgenda setFlow={setFlow} user={user} />
  }

  if (flow === "services") {
    return <ProviderServices setFlow={setFlow} services={services} user={user} />
  }

  if (flow === "create-service") {
    return <CreateService setFlow={setFlow} createService={createService} user={user} />
  }

  if (flow === "edit-service") {
    return <EditService setFlow={setFlow} />
  }

  if (flow === "subscription") {
    return <ProviderSubscription setFlow={setFlow} />
  }

  return <ProviderOnboarding setFlow={setFlow} />
}

function ClientFlow({
  flow,
  setFlow,
  selectedService,
  setSelectedService,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  signIn,
  signUp,
  setAuthError,
  authError,
  setAuthSuccess,
  authSuccess,
  services,
  searchTerm,
  setSearchTerm,
  searchServices,
  user
}: {
  flow: string
  setFlow: (flow: any) => void
  selectedService: any
  setSelectedService: (service: any) => void
  selectedDate: string
  setSelectedDate: (date: string) => void
  selectedTime: string
  setSelectedTime: (time: string) => void
  signIn: (email: string, password: string) => Promise<{success: boolean, error?: string}>
  signUp: (email: string, password: string) => Promise<{success: boolean, error?: string}>
  setAuthError: (error: string) => void
  authError: string
  setAuthSuccess: (message: string) => void
  authSuccess: string
  services: any[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  searchServices: (term: string) => any[]
  user: any
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
      />
    )
  }

  if (flow === "profile") {
    return <ClientProfile setFlow={setFlow} user={user} />
  }

  if (flow === "agenda") {
    return <ClientAgenda setFlow={setFlow} user={user} />
  }

  if (flow === "service-detail") {
    return <ServiceDetail service={selectedService} setFlow={setFlow} />
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
  signIn: (email: string, password: string) => Promise<{success: boolean, error?: string}>
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
  signUp: (email: string, password: string) => Promise<{success: boolean, error?: string}>
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

    const result = await signUp(email, password)
    
    if (result.success) {
      setAuthSuccess("¡Cuenta creada exitosamente! Bienvenido a Punto Encuentro.")
      setTimeout(() => {
        setFlow("home")
      }, 2000)
    } else {
      setAuthError(result.error || "Error al registrarse")
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
  user
}: { 
  setFlow: (flow: string) => void
  setSelectedService: (service: any) => void
  services: any[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  searchServices: (term: string) => any[]
  user: any
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
    return <ClientAgenda setFlow={setFlow} user={user} />
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
                      <span className="text-base font-medium">{service.provider}</span>
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
              .filter((service) => service.distance)
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
                        <span className="text-base font-medium">{service.provider}</span>
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
                      <span className="text-base font-medium">{service.provider}</span>
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
              {filteredServices.slice(0, 2).map((service) => (
                <Card
                  key={service.id}
                  className="cursor-pointer hover:shadow-md transition-shadow flex-shrink-0 w-36 overflow-hidden"
                  onClick={() => handleServiceClick(service)}
                >
                  <div className="relative w-full h-40">
                    {/* Imagen de fondo que ocupa toda la card */}
                    <img
                      src={service.image || "/placeholder.svg"}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Overlay con gradiente para mejor legibilidad del texto */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    
                    {/* Contenido sobre la imagen */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <div className="flex flex-col gap-1 mb-2">
                        <span className="text-sm font-medium">{service.providerName}</span>
                        <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-white self-start">
                          {service.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
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
          {services.length > 0 ? (
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleServiceClick(services[0])}
            >
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <div className="text-gray-400">📷</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">{services[0].category}</span>
                      <button className="ml-auto">⋯</button>
                    </div>
                    <h3 className="font-semibold mb-1">{services[0].name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{services[0].providerName}</span>
                    </div>
                    <div className="text-lg font-bold text-primary mt-1">${services[0].price}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4">
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">🔍</div>
                  <p>No hay servicios disponibles cerca tuyo</p>
                  <p className="text-sm mt-1">Prueba buscando en otra categoría</p>
                </div>
              </CardContent>
            </Card>
          )}
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

function ServiceDetail({ service, setFlow }: { service: any; setFlow: (flow: string) => void }) {
  if (!service) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setFlow("home")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Detalle del Servicio</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Service Image */}
        <Card>
          <CardContent className="p-0">
            <img
              src={service.image || "/placeholder.svg"}
              alt={service.name}
              className="w-full h-48 object-cover rounded-t-lg"
            />
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-2xl font-bold">{service.name}</h2>
                <span className="text-2xl font-bold text-primary">{service.price}</span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{service.rating}</span>
                <span className="text-muted-foreground">• {service.category}</span>
              </div>

              <p className="text-muted-foreground">{service.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Información de contacto</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{service.contact.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{service.contact.phone}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <Button onClick={() => setFlow("booking")} className="w-full h-12 text-base">
          Agendar turno
        </Button>
      </div>
    </div>
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
    <div className="min-h-screen bg-gray-50">
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
}: {
  service: any
  selectedDate: string
  selectedTime: string
  setFlow: (flow: string) => void
}) {
  const [selectedPayment, setSelectedPayment] = useState<string>("")
  const [showTransferDetails, setShowTransferDetails] = useState(false)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
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

  const handleConfirmPayment = () => {
    // Simulate payment processing
    alert("¡Turno confirmado! Recibirás un email de confirmación.")
    setFlow("home")
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
        <Button onClick={handleConfirmPayment} disabled={!selectedPayment} className="w-full h-12 text-base">
          Confirmar pago
        </Button>
      </div>
    </div>
  )
}

function ClientProfile({ setFlow, user }: { setFlow: (flow: string) => void; user: any }) {
  const { getBookingsByClient } = useBookings()
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => setFlow("home")}>
            ← Volver
          </Button>
          <h1 className="text-xl font-bold">Mi Perfil</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-primary">
                  {(user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-semibold">
                {user?.displayName || 'Usuario'}
              </h2>
              <p className="text-muted-foreground">
                {user?.email || 'Sin email'}
              </p>
            </div>

            <Button variant="outline" className="w-full bg-transparent">
              Editar perfil
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold">Mis reservas</h3>
            <div className="space-y-2">
              {user ? (
                (() => {
                  const userBookings = getBookingsByClient(user.uid) || []
                  console.log('User bookings:', userBookings) // Debug log
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
                            <span className={`text-xs px-2 py-1 rounded ${
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
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

        <Button variant="destructive" className="w-full" onClick={() => window.location.reload()}>
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}

function ClientAgenda({ setFlow, user }: { setFlow: (flow: string) => void; user: any }) {
  const { getBookingsByClient } = useBookings()
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Obtener reservas del cliente
  const clientBookings = getBookingsByClient(user?.uid) || []

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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => setFlow("home")}>
            ← Volver
          </Button>
          <h1 className="text-xl font-bold">Mis Reservas</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Calendario */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Calendario</h3>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigateMonth('prev')}
                >
                  ←
                </Button>
                <span className="font-medium min-w-[120px] text-center">
                  {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigateMonth('next')}
                >
                  →
                </Button>
              </div>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Días del calendario */}
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
                    p-2 text-sm rounded-lg transition-colors
                    ${day.isCurrentMonth 
                      ? 'text-gray-900 hover:bg-gray-100' 
                      : 'text-gray-400'
                    }
                    ${selectedDate === day.fullDate 
                      ? 'bg-primary text-white hover:bg-primary/90' 
                      : ''
                    }
                    ${day.bookings.length > 0 && day.isCurrentMonth
                      ? 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                      : ''
                    }
                  `}
                >
                  <div className="flex flex-col items-center">
                    <span>{day.date}</span>
                    {day.bookings.length > 0 && day.isCurrentMonth && (
                      <div className="w-1 h-1 bg-blue-600 rounded-full mt-1"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reservas del día seleccionado */}
        {selectedDate && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">
                Reservas del {new Date(selectedDate).toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <div className="space-y-3">
                {selectedDateBookings.length > 0 ? (
                  selectedDateBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{booking.serviceName}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.time} - {booking.providerName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${booking.price}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          booking.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {booking.status === 'confirmed' ? 'Confirmada' :
                           booking.status === 'pending' ? 'Pendiente' :
                           booking.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No tienes reservas para este día</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Todas las reservas */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Todas mis reservas</h3>
            <div className="space-y-3">
              {clientBookings.length > 0 ? (
                clientBookings.slice(0, 10).map((booking) => (
                  <div key={booking.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{booking.serviceName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.date).toLocaleDateString('es-ES')} - {booking.time}
                      </p>
                      <p className="text-sm text-muted-foreground">{booking.providerName}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        booking.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {booking.status === 'confirmed' ? 'Confirmada' :
                         booking.status === 'pending' ? 'Pendiente' :
                         booking.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No tienes reservas programadas</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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
  signIn: (email: string, password: string) => Promise<{success: boolean, error?: string}>
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
  signUp: (email: string, password: string) => Promise<{success: boolean, error?: string}>
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
    
    const result = await signUp(formData.email, formData.password)
    if (result.success) {
      setAuthSuccess("¡Registro exitoso! Bienvenido a Punto Encuentro")
      setTimeout(() => {
        setFlow("dashboard")
      }, 2000)
    } else {
      setAuthError(result.error || "Error al registrarse")
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

function ProviderDashboard({ setFlow, user, services }: { setFlow: (flow: string) => void; user: any; services: any[] }) {
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
      const bookingDate = new Date(booking.date)
      const today = new Date()
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      return bookingDate >= today && bookingDate <= nextWeek && booking.status !== 'cancelled'
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3)

  const [isSubscribed, setIsSubscribed] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-primary">Panel de Control</h1>
          <Button variant="ghost" size="sm" onClick={() => setFlow("profile")}>
            Perfil
          </Button>
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
                Ver agenda
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
                      <span className={`text-xs px-2 py-1 rounded ${
                        appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
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

function ProviderProfile({ setFlow, user }: { setFlow: (flow: string) => void; user: any }) {
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
    coverImage: "/placeholder.svg"
  })
  
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")

  const handleSave = async () => {
    setLoading(true)
    try {
      // Aquí se guardaría en Firebase
      console.log("Guardando perfil:", profileData)
      setSuccess("¡Perfil actualizado exitosamente!")
      setIsEditing(false)
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Error al guardar perfil:", error)
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

  const handleImageUpload = (type: 'profile' | 'cover', event: React.ChangeEvent<HTMLInputElement>) => {
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
    
    // Crear URL temporal para mostrar la imagen inmediatamente
    const imageUrl = URL.createObjectURL(file)
    
    if (type === 'profile') {
      setProfileData(prev => ({ ...prev, profileImage: imageUrl }))
    } else {
      setProfileData(prev => ({ ...prev, coverImage: imageUrl }))
    }
    
    // Simular subida a Firebase Storage
    setTimeout(() => {
      console.log(`Imagen ${type} subida exitosamente:`, file.name)
      setUploadingImage(null)
      setSuccess(`¡Imagen ${type === 'profile' ? 'de perfil' : 'de portada'} actualizada!`)
      setTimeout(() => setSuccess(""), 3000)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                  onClick={() => document.getElementById('cover-upload')?.click()}
                  disabled={uploadingImage === 'cover'}
                >
                  {uploadingImage === 'cover' ? 'Subiendo...' : 'Cambiar portada'}
                </Button>
              </div>
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
                      onClick={() => document.getElementById('profile-upload')?.click()}
                      disabled={uploadingImage === 'profile'}
                    >
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
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={profileData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Av. Corrientes 1234, CABA"
                />
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ProviderAgenda({ setFlow, user }: { setFlow: (flow: string) => void; user: any }) {
  const { getBookingsByProvider } = useBookings()
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Obtener reservas del proveedor
  const providerBookings = getBookingsByProvider(user?.uid) || []

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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="sm" onClick={() => setFlow("dashboard")}>
            ← Volver
          </Button>
          <h1 className="text-xl font-bold">Mi Agenda</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Calendario */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Calendario</h3>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigateMonth('prev')}
                >
                  ←
                </Button>
                <span className="font-medium min-w-[120px] text-center">
                  {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigateMonth('next')}
                >
                  →
                </Button>
              </div>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Días del calendario */}
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
                    p-2 text-sm rounded-lg transition-colors
                    ${day.isCurrentMonth 
                      ? 'text-gray-900 hover:bg-gray-100' 
                      : 'text-gray-400'
                    }
                    ${selectedDate === day.fullDate 
                      ? 'bg-primary text-white hover:bg-primary/90' 
                      : ''
                    }
                    ${day.bookings.length > 0 && day.isCurrentMonth
                      ? 'bg-green-50 text-green-800 hover:bg-green-100'
                      : ''
                    }
                  `}
                >
                  <div className="flex flex-col items-center">
                    <span>{day.date}</span>
                    {day.bookings.length > 0 && day.isCurrentMonth && (
                      <div className="w-1 h-1 bg-green-600 rounded-full mt-1"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Citas del día seleccionado */}
        {selectedDate && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">
                Citas del {new Date(selectedDate).toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <div className="space-y-3">
                {selectedDateBookings.length > 0 ? (
                  selectedDateBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{booking.clientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.time} - {booking.serviceName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${booking.price}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          booking.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {booking.status === 'confirmed' ? 'Confirmada' :
                           booking.status === 'pending' ? 'Pendiente' :
                           booking.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No hay citas programadas para este día</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Todas las citas */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Todas las citas</h3>
            <div className="space-y-3">
              {providerBookings.length > 0 ? (
                providerBookings.slice(0, 10).map((booking) => (
                  <div key={booking.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{booking.clientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.date).toLocaleDateString('es-ES')} - {booking.time}
                      </p>
                      <p className="text-sm text-muted-foreground">{booking.serviceName}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        booking.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {booking.status === 'confirmed' ? 'Confirmada' :
                         booking.status === 'pending' ? 'Pendiente' :
                         booking.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No tienes citas programadas</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ProviderServices({ setFlow, services, user }: { setFlow: (flow: string) => void; services: any[]; user: any }) {
  const { getBookingsByProvider } = useBookings()
  
  // Filtrar servicios del proveedor actual
  const providerServices = services.filter(service => service.providerId === user?.uid)
  
  // Obtener reservas para cada servicio
  const servicesWithBookings = providerServices.map(service => {
    const serviceBookings = getBookingsByProvider(user?.uid).filter(booking => booking.serviceId === service.id)
    return {
      ...service,
      bookings: serviceBookings.length,
      active: true // Por ahora todos activos
    }
  })

  const handleDeleteService = (serviceId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este servicio?")) {
      // Aquí se implementaría la eliminación en Firebase
      console.log("Eliminar servicio:", serviceId)
    }
  }

  const toggleServiceStatus = (serviceId: string) => {
    // Aquí se implementaría el cambio de estado en Firebase
    console.log("Cambiar estado del servicio:", serviceId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                          className={`text-xs px-2 py-1 rounded-full ${
                            service.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
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
                    <Button size="sm" variant="outline" onClick={() => setFlow("edit-service")}>
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
  user 
}: { 
  setFlow: (flow: string) => void
  createService: (serviceData: any) => Promise<{success: boolean, error?: string}>
  user: any
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    category: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const categories = ["Belleza", "Salud", "Deporte", "Hogar", "Educación", "Tecnología", "Oficios", "Profesionales", "Aprendizaje"]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
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
        image: "/placeholder.svg"
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
    <div className="min-h-screen bg-gray-50">
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

function EditService({ setFlow }: { setFlow: (flow: string) => void }) {
  const [formData, setFormData] = useState({
    name: "Masaje descontracturante",
    description: "Masaje terapéutico para aliviar tensiones musculares y contracturas.",
    price: "$7000",
    duration: "60 min",
    category: "Salud",
  })

  const categories = ["Belleza", "Salud", "Deporte", "Hogar", "Educación", "Tecnología"]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate service update
    alert("Servicio actualizado exitosamente!")
    setFlow("services")
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  Guardar cambios
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
    <div className="min-h-screen bg-gray-50">
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
            className={`cursor-pointer transition-all ${
              selectedPlan === "monthly" ? "ring-2 ring-primary border-primary" : ""
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
            className={`cursor-pointer transition-all relative ${
              selectedPlan === "annual" ? "ring-2 ring-primary border-primary" : ""
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
    <div className="min-h-screen bg-gray-50">
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
              className={`flex-1 py-3 px-1 md:py-4 md:px-2 border-b-2 font-medium text-xs md:text-sm ${
                activeTab === tab.id
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
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          category.active 
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
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'provider' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {user.role === 'admin' ? 'Admin' : 
                               user.role === 'provider' ? 'Proveedor' : 'Cliente'}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'provider' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {user.role === 'admin' ? 'Admin' : 
                               user.role === 'provider' ? 'Proveedor' : 'Cliente'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
                      <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                        (service as any).active !== false 
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
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          settings.emailNotifications 
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
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          settings.pushNotifications 
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
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          settings.appointmentReminders 
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
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          settings.emailVerificationRequired 
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
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          settings.openRegistration 
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
