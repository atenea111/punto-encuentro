"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
      />
    )
  }

  if (userType === "provider") {
    return <ProviderFlow flow={providerFlow} setFlow={setProviderFlow} />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">Punto Encuentro</h1>
          <p className="text-muted-foreground">Conecta con los mejores servicios</p>
        </div>

        {/* User Type Selection */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold text-center mb-4">¿Cómo quieres usar la app?</h2>

            <Button onClick={() => setUserType("client")} className="w-full h-12 text-base" variant="default">
              Soy Cliente
            </Button>

            <Button onClick={() => setUserType("provider")} variant="outline" className="w-full h-12 text-base">
              Soy Proveedor de Servicios
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ProviderFlow({ flow, setFlow }: { flow: string; setFlow: (flow: any) => void }) {
  if (flow === "login") {
    return <ProviderLogin setFlow={setFlow} />
  }

  if (flow === "register") {
    return <ProviderRegister setFlow={setFlow} />
  }

  if (flow === "dashboard") {
    return <ProviderDashboard setFlow={setFlow} />
  }

  if (flow === "profile") {
    return <ProviderProfile setFlow={setFlow} />
  }

  if (flow === "agenda") {
    return <ProviderAgenda setFlow={setFlow} />
  }

  if (flow === "services") {
    return <ProviderServices setFlow={setFlow} />
  }

  if (flow === "create-service") {
    return <CreateService setFlow={setFlow} />
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
}: {
  flow: string
  setFlow: (flow: any) => void
  selectedService: any
  setSelectedService: (service: any) => void
  selectedDate: string
  setSelectedDate: (date: string) => void
  selectedTime: string
  setSelectedTime: (time: string) => void
}) {
  if (flow === "login") {
    return <ClientLogin setFlow={setFlow} />
  }

  if (flow === "register") {
    return <ClientRegister setFlow={setFlow} />
  }

  if (flow === "home") {
    return <ClientHome setFlow={setFlow} setSelectedService={setSelectedService} />
  }

  if (flow === "profile") {
    return <ClientProfile setFlow={setFlow} />
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

function ClientLogin({ setFlow }: { setFlow: (flow: string) => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">Punto Encuentro</h1>
          <p className="text-muted-foreground">Inicia sesión en tu cuenta</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@email.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>

            <Button onClick={() => setFlow("home")} className="w-full h-12 text-base">
              Iniciar sesión
            </Button>

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

function ClientRegister({ setFlow }: { setFlow: (flow: string) => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">Punto Encuentro</h1>
          <p className="text-muted-foreground">Crea tu cuenta</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" placeholder="Juan Pérez" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@email.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>

            <Button onClick={() => setFlow("home")} className="w-full h-12 text-base">
              Registrarse
            </Button>

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
}: { setFlow: (flow: string) => void; setSelectedService: (service: any) => void }) {
  const [activeTab, setActiveTab] = useState("inicio")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"home" | "recommendations" | "nearby" | "category">("home")
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("")

  const services = [
    {
      id: 1,
      name: "Peluquería Elegance",
      price: "$5000",
      rating: 4.8,
      category: "Belleza",
      description:
        "Cortes modernos y tratamientos capilares de alta calidad. Especialistas en coloración y peinados para eventos especiales.",
      contact: {
        email: "elegance@ejemplo.com",
        phone: "11 1234-5678",
      },
      image: "/elegant-hair-salon.png",
      provider: "Fulanito",
      reviews: 600,
      badge: "Prometo",
    },
    {
      id: 2,
      name: "Clases de Yoga con Ana",
      price: "$4000",
      rating: 4.6,
      category: "Deporte",
      description:
        "Clases personalizadas de yoga para todos los niveles. Enfoque en relajación, flexibilidad y bienestar mental.",
      contact: {
        email: "ana.yoga@ejemplo.com",
        phone: "11 2345-6789",
      },
      image: "/peaceful-yoga-studio.png",
      provider: "Fulanito",
      reviews: 600,
      badge: "Prometo",
    },
    {
      id: 3,
      name: "Masajes Relax Center",
      price: "$6000",
      rating: 4.9,
      category: "Salud",
      description:
        "Centro especializado en masajes terapéuticos y relajantes. Ambiente tranquilo y profesionales certificados.",
      contact: {
        email: "info@relaxcenter.com",
        phone: "11 3456-7890",
      },
      image: "/relaxing-massage-room.png",
      provider: "Fulanito",
      reviews: 600,
      badge: "Prometo",
    },
    {
      id: 4,
      name: "Plomero",
      price: "$6000",
      rating: 4.8,
      category: "Oficios",
      description: "Servicio de plomería profesional para el hogar",
      contact: {
        email: "plomero@ejemplo.com",
        phone: "11 4567-8901",
      },
      image: "/plumber-tools.png",
      provider: "Fulanito Perez",
      reviews: 600,
      badge: "Prometo",
    },
  ]

  const categories = [
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

  const [searchTerm, setSearchTerm] = useState("")

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || service.category === selectedCategory
    return matchesSearch && matchesCategory
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
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleServiceClick(service)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <div className="text-gray-400">📷</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{service.provider}</span>
                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">{service.badge}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{service.name}</p>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>
                          {service.rating} ({service.reviews} vecinos)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
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
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleServiceClick(service)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <div className="text-gray-400">📷</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{service.provider}</span>
                          <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">{service.badge}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{service.name}</p>
                        <p className="text-xs text-primary mb-2">{service.distance}</p>
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>
                            {service.rating} ({service.reviews} vecinos)
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
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
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleServiceClick(service)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <div className="text-gray-400">📷</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{service.provider}</span>
                          <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">{service.badge}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{service.name}</p>
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>
                            {service.rating} ({service.reviews} vecinos)
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
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
          <div
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {categories.map((category) => (
              <div
                key={category.name}
                className="flex flex-col items-center cursor-pointer flex-shrink-0"
                onClick={() => handleCategoryClick(category.name)}
              >
                <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mb-2">
                  <span className="text-2xl">{category.icon}</span>
                </div>
                <span className="text-sm font-medium whitespace-nowrap">{category.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Recomendados</h2>
            <button onClick={handleVerMas} className="text-sm text-primary">
              Ver más
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {services.slice(0, 2).map((service) => (
              <Card
                key={service.id}
                className="cursor-pointer hover:shadow-md transition-shadow flex-shrink-0 w-40"
                onClick={() => handleServiceClick(service)}
              >
                <CardContent className="p-3">
                  <div className="w-full h-24 bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                    <div className="text-gray-400">📷</div>
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-sm font-medium">{service.provider}</span>
                    <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">{service.badge}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>
                      {service.rating} ({service.reviews} vecinos)
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <button onClick={handleCercaTuyo} className="text-lg font-semibold mb-3 text-left">
            Cerca tuyo
          </button>
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleServiceClick(services[3])}
          >
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="text-gray-400">📷</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">Oficio</span>
                    <button className="ml-auto">⋯</button>
                  </div>
                  <h3 className="font-semibold mb-1">{services[3].name}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{services[3].provider}</span>
                  </div>
                  <div className="text-lg font-bold text-primary mt-1">{services[3].price}</div>
                </div>
              </div>
            </CardContent>
          </Card>
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

function ClientProfile({ setFlow }: { setFlow: (flow: string) => void }) {
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
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">Masajes Relax Center</p>
                  <p className="text-sm text-muted-foreground">25/08 - 15:00</p>
                </div>
              </div>
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

function ProviderLogin({ setFlow }: { setFlow: (flow: string) => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">Punto Encuentro</h1>
          <p className="text-muted-foreground">Inicia sesión como proveedor</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider-email">Email</Label>
              <Input id="provider-email" type="email" placeholder="tu@negocio.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider-password">Contraseña</Label>
              <Input id="provider-password" type="password" placeholder="••••••••" />
            </div>

            <Button onClick={() => setFlow("dashboard")} className="w-full h-12 text-base">
              Iniciar sesión
            </Button>

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

function ProviderRegister({ setFlow }: { setFlow: (flow: string) => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">Punto Encuentro</h1>
          <p className="text-muted-foreground">Registra tu negocio</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business-name">Nombre del negocio</Label>
              <Input id="business-name" placeholder="Spa Relax" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-email">Email</Label>
              <Input id="business-email" type="email" placeholder="contacto@sparelax.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-phone">Teléfono</Label>
              <Input id="business-phone" placeholder="11 1234-5678" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-password">Contraseña</Label>
              <Input id="business-password" type="password" placeholder="••••••••" />
            </div>

            <Button onClick={() => setFlow("dashboard")} className="w-full h-12 text-base">
              Registrarse
            </Button>

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

function ProviderDashboard({ setFlow }: { setFlow: (flow: string) => void }) {
  const providerServices = [
    {
      id: 1,
      name: "Masaje descontracturante",
      price: "$7000",
      bookings: 12,
    },
    {
      id: 2,
      name: "Masaje relajante",
      price: "$6000",
      bookings: 8,
    },
  ]

  const upcomingAppointments = [
    {
      id: 1,
      client: "Juan Pérez",
      date: "25/08",
      time: "15:00",
      service: "Masaje relajante",
    },
    {
      id: 2,
      client: "María López",
      date: "26/08",
      time: "11:00",
      service: "Masaje descontracturante",
    },
  ]

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
              <p className="text-2xl font-bold">20</p>
              <p className="text-sm text-muted-foreground">Clientes este mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">$140k</p>
              <p className="text-sm text-muted-foreground">Ingresos este mes</p>
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
              {providerServices.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-muted-foreground">{service.bookings} reservas</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{service.price}</p>
                  </div>
                </div>
              ))}
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
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{appointment.client}</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.date} - {appointment.time} • {appointment.service}
                    </p>
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

function ProviderProfile({ setFlow }: { setFlow: (flow: string) => void }) {
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

      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl font-bold text-primary">SR</span>
              </div>
              <h2 className="text-xl font-semibold">Spa Relax</h2>
              <p className="text-muted-foreground">sparelax@test.com</p>
            </div>

            <Button variant="outline" className="w-full bg-transparent">
              Editar perfil
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold">Información del negocio</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Teléfono:</span> 11 3456-7890
              </p>
              <p>
                <span className="font-medium">Categoría:</span> Salud y Bienestar
              </p>
              <p>
                <span className="font-medium">Servicios activos:</span> 2
              </p>
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

function ProviderServices({ setFlow }: { setFlow: (flow: string) => void }) {
  const [services, setServices] = useState([
    {
      id: 1,
      name: "Masaje descontracturante",
      price: "$7000",
      description: "Masaje terapéutico para aliviar tensiones musculares y contracturas.",
      duration: "60 min",
      category: "Salud",
      bookings: 12,
      active: true,
    },
    {
      id: 2,
      name: "Masaje relajante",
      price: "$6000",
      description: "Masaje suave para relajación y bienestar general.",
      duration: "45 min",
      category: "Salud",
      bookings: 8,
      active: true,
    },
  ])

  const handleDeleteService = (serviceId: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este servicio?")) {
      setServices(services.filter((service) => service.id !== serviceId))
    }
  }

  const toggleServiceStatus = (serviceId: number) => {
    setServices(
      services.map((service) => (service.id === serviceId ? { ...service, active: !service.active } : service)),
    )
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
          {services.map((service) => (
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
                    <p className="text-xl font-bold text-primary mb-2">{service.price}</p>
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
          ))}
        </div>
      </div>
    </div>
  )
}

function CreateService({ setFlow }: { setFlow: (flow: string) => void }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    category: "",
  })

  const categories = ["Belleza", "Salud", "Deporte", "Hogar", "Educación", "Tecnología"]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate service creation
    alert("Servicio creado exitosamente!")
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
          <h1 className="text-xl font-bold">Crear Servicio</h1>
        </div>
      </div>

      <div className="p-4">
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
                <Button type="submit" className="flex-1">
                  Crear servicio
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
