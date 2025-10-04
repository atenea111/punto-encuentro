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
  const { user, signIn, signUp, logout } = useAuth()
  const { services, loading: servicesLoading, searchServices, createService } = useServices()
  const { createBooking, getBookingsByClient } = useBookings()
  
  const [userType, setUserType] = useState<"client" | "provider" | null>(null)
  const [clientFlow, setClientFlow] = useState<
    "onboarding" | "login" | "register" | "home" | "profile" | "service-detail" | "booking" | "payment"
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
          <LogoText size="lg" className="mb-6" />
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
    return <ProviderDashboard setFlow={setFlow} user={user} />
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
      />
    )
  }

  if (flow === "profile") {
    return <ClientProfile setFlow={setFlow} user={user} />
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
  searchServices
}: { 
  setFlow: (flow: string) => void
  setSelectedService: (service: any) => void
  services: any[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  searchServices: (term: string) => any[]
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
    const calendarDays = generateCalendar()
    const today = new Date()
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

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm p-4">
          <h1 className="text-xl font-bold text-primary text-center">Agenda</h1>
        </div>
        <div className="p-4">
          <div className="bg-white rounded-lg p-4 mb-4">
            <h2 className="text-lg font-semibold mb-4 text-center">
              {monthNames[today.getMonth()]} {today.getFullYear()}
            </h2>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                const isCurrentMonth = date.getMonth() === today.getMonth()
                const isToday = date.toDateString() === today.toDateString()
                return (
                  <div
                    key={index}
                    className={`
                      text-center py-2 text-sm cursor-pointer rounded
                      ${isCurrentMonth ? "text-gray-900" : "text-gray-300"}
                      ${isToday ? "bg-primary text-white" : "hover:bg-gray-100"}
                    `}
                  >
                    {date.getDate()}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">📅</div>
            <p>No hay citas programadas</p>
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="flex justify-around py-2">
            <button onClick={() => setActiveTab("inicio")} className="flex flex-col items-center py-2 px-4">
              <div className="text-gray-400 mb-1">🏠</div>
              <span className="text-xs text-gray-400">Inicio</span>
            </button>
            <button onClick={() => setActiveTab("agenda")} className="flex flex-col items-center py-2 px-4">
              <div className="text-primary mb-1">📅</div>
              <span className="text-xs text-primary">Agenda</span>
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
                <span className="text-2xl font-bold text-primary">JP</span>
              </div>
              <h2 className="text-xl font-semibold">Juan Pérez</h2>
              <p className="text-muted-foreground">juanperez@test.com</p>
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
                  const userBookings = getBookingsByClient(user.uid)
                  return userBookings.length > 0 ? (
                    userBookings.slice(0, 3).map((booking) => (
                      <div key={booking.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">{booking.serviceName}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.date} - {booking.time}
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
                               'Completada'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ${booking.price}
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
  const providerServices = services.filter(service => service.providerId === user?.uid)
  
  // Obtener reservas del proveedor
  const providerBookings = getBookingsByProvider(user?.uid)
  
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

function ProviderAgenda({ setFlow }: { setFlow: (flow: string) => void }) {
  const appointments = [
    {
      id: 1,
      client: "Juan Pérez",
      date: "25/08",
      time: "15:00",
      service: "Masaje relajante",
      status: "confirmado",
    },
    {
      id: 2,
      client: "María López",
      date: "26/08",
      time: "11:00",
      service: "Masaje descontracturante",
      status: "pendiente",
    },
    {
      id: 3,
      client: "Carlos Ruiz",
      date: "27/08",
      time: "16:30",
      service: "Masaje relajante",
      status: "confirmado",
    },
  ]

  const availableSlots = ["09:00", "10:30", "14:00", "17:00"]

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

      <div className="p-4 space-y-4">
        {/* Appointments */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Turnos programados</h3>
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{appointment.client}</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.date} - {appointment.time}
                    </p>
                    <p className="text-sm text-muted-foreground">{appointment.service}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        appointment.status === "confirmado"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))}
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
