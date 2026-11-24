"use client"

import type React from "react"
import { useState, useEffect, useMemo, useRef } from "react"
import dynamic from "next/dynamic"
import { Capacitor } from "@capacitor/core"
import { App } from "@capacitor/app"
import { Geolocation } from "@capacitor/geolocation"
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
import { FloatingAssistant } from "@/components/FloatingAssistant"
import { DraggableFloat } from "@/components/DraggableFloat"
import { BOT_HOME_EVENT, consumeBotHomeAction } from "@/lib/botHomeAction"
import { GoogleSignInButton } from "@/components/GoogleSignInButton"
import { calcularDistanciaKm, formatearDistancia } from "@/lib/locationUtils"
import { serviceMatchesSearch, serviceMatchesLocationSearch, getServiceCoordinates, normalizeSearchText, serviceMatchesCategory, findOfficialCategoryName, isUncategorizedService, rankServicesForSearch } from "@/lib/searchUtils"
import { db, auth, storage, uploadFile } from "@/lib/firebase"
import { useReviews } from "@/hooks/useReviews"
import { useFavorites } from "@/hooks/useFavorites"
import { StoriesShelf, ProviderStoriesManager, StoriesLimitPromoBanner } from "@/components/stories"
import { ForceUpdateScreen, useForceUpdateRequired } from "@/components/ForceUpdateGate"
import { AdminDashboard } from "@/components/AdminDashboard"
import { HelpLink } from "@/components/SupportCenter"
import { AdminMovedToWeb } from "@/components/AdminMovedToWeb"
import { isNativeApp } from "@/lib/adminWeb"
import { AppIcon } from "@/components/AppIcon"
import { WhatsAppIcon } from "@/components/WhatsAppIcon"
import { CategoryIcon } from "@/components/CategoryIcon"
import { AdminPushNotifications } from "@/components/AdminPushNotifications"
import { sendChatMessage, ensureChatDocument } from "@/lib/chat"
import { usePresence, usePartnerPresence, useChatInbox, markChatRead } from "@/hooks/useChat"
import { useVisibleViewport } from "@/hooks/useKeyboardInset"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { clearPendingPush, readPendingPush, supportPushUrl, type PushPayload } from "@/lib/pushNotifications"
import { useAdminAudit } from "@/hooks/useAdminAudit"
import { useAppSettings, DEFAULT_APP_SETTINGS, type AppSettings } from "@/hooks/useAppSettings"
import { isServiceActive, serviceMatchesAdminFilter, isServiceReported } from "@/lib/serviceUtils"
import { downloadCsv } from "@/lib/adminExport"
import { syncPublicAndroidMinVersion } from "@/lib/forceUpdateConfig"
import { hasValidProfilePhoto, validateProfilePhotoFile } from "@/lib/profilePhoto"
import { categorySelectLabel } from "@/lib/categoryIcons"
import { parseMoney, formatMoney } from "@/lib/formatMoney"
import { getAvailableSlots } from "@/lib/bookingAvailability"
import { MercadoPagoConnect } from "@/components/MercadoPagoConnect"
import { ClientPendingPayments, ProviderPaymentsPanel } from "@/components/BookingPayments"
import { isUnpaidBooking, paymentMethodLabel, paymentStatusLabel } from "@/lib/bookingPayments"
import { getCanonicalService, syncCanonicalServiceFromProfile } from "@/lib/myService"
import { callableErrorMessage, createMercadoPagoCheckout, openExternalUrl as openMercadoPagoUrl } from "@/lib/mercadopagoConnect"
import { doc, setDoc, updateDoc, collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from "firebase/firestore"
import {
  Search,
  Star,
  Clock,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
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
  Settings,
  Trophy,
  LayoutDashboard,
  FolderTree,
  Wrench,
  BarChart3,
  FileText,
  Mail,
  Phone,
  Instagram,
  Facebook,
  LogOut,
  Menu,
  X,
  PieChart,
  Shield,
  Briefcase,
  ShieldAlert,
  Bell,
  Wallet,
  Flame,
  Activity,
  CalendarCheck,
  AlertCircle,
  Send,
  MessageSquare,
  Info,
  CheckCheck,
  Globe,
  ExternalLink,
  Eye,
  EyeOff,
  Download,
} from "lucide-react"


const NearByMap = dynamic(() => import("@/components/NearByMap"), {
  ssr: false,
})

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
  const { user, signIn, signUp, signInWithGoogle, logout, loading: authLoading } = useAuth()
  usePresence(user?.uid)
  const { services, loading: servicesLoading, searchServices, createService } = useServices()
  const { settings: appSettings, loading: appSettingsLoading } = useAppSettings()
  const forceUpdate = useForceUpdateRequired(appSettings, appSettingsLoading)
  const publicServices = useMemo(
    () => services.filter((s) => isServiceActive(s as Record<string, unknown>)),
    [services]
  )
  const { bookings, createBooking, getBookingsByClient } = useBookings()
  const { isAdmin, isClient, isProvider, hasRole, updateUserRole, loading: rolesLoading } = useRoles()
  const { logInteraction } = useAnalytics()
  
  // Inicializar userType y flujo desde localStorage para que al recargar vaya directo al home del usuario
  const [userType, setUserType] = useState<"client" | "provider" | null>(() => {
    if (typeof window === "undefined") return null
    const saved = localStorage.getItem("userType")
    return saved === "client" || saved === "provider" ? saved : null
  })
  const [clientFlow, setClientFlow] = useState<
    "onboarding" | "login" | "register" | "home" | "mi-servicio" | "profile" | "agenda" | "service-detail" | "booking" | "payment" | "chats" | "chat"
  >(() => {
    if (typeof window === "undefined") return "onboarding"
    return localStorage.getItem("userType") === "client" ? "home" : "onboarding"
  })
  const [providerFlow, setProviderFlow] = useState<
    | "onboarding"
    | "login"
    | "register"
    | "home"
    | "dashboard"
    | "mi-servicio"
    | "profile"
    | "agenda"
    | "services"
    | "create-service"
    | "edit-service"
    | "subscription"
    | "statistics"
    | "stories"
    | "chats"
    | "chat"
    | "service-detail"
    | "booking"
    | "payment"
  >(() => {
    if (typeof window === "undefined") return "onboarding"
    return localStorage.getItem("userType") === "provider" ? "home" : "onboarding"
  })
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedProviderService, setSelectedProviderService] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [authError, setAuthError] = useState("")
  const [authSuccess, setAuthSuccess] = useState("")
  const [bookingSource, setBookingSource] = useState<'anuncio' | 'recomendados' | 'cerca_tuyo' | 'rubro' | 'buscador' | 'stories'>("anuncio")
  const [activeChat, setActiveChat] = useState<any>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [needsProfilePhoto, setNeedsProfilePhoto] = useState(false)

  // Ref para la función "atrás" actual (usada por el botón físico de Android)
  const handleBackRef = useRef<() => void>(() => {})
  // Subpantallas del home (recomendados / cerca / categorías / filtros / mapa)
  const clientHomeBackRef = useRef<(() => boolean) | null>(null)
  // Panel abierto de PuntoBot
  const botBackRef = useRef<(() => boolean) | null>(null)
  const fixingProviderRoleRef = useRef(false)

  const applyPushPayload = (payload: PushPayload) => {
    if (!payload) return
    clearPendingPush()
    if (payload.type === "support_reply") {
      const href = supportPushUrl(payload, user?.uid)
      if (href) window.location.assign(href)
      return
    }
    if (isAdmin) return

    if (payload.type === "chat" && payload.partnerId) {
      setActiveChat({
        partnerId: payload.partnerId,
        partnerName: payload.partnerName || "Chat",
        from: "push",
      })
      if (isProvider || userType === "provider") {
        setUserType("provider")
        setProviderFlow("chat")
      } else {
        setUserType("client")
        setClientFlow("chat")
      }
      return
    }

    if (payload.type === "booking") {
      if (isProvider || userType === "provider") {
        setUserType("provider")
        setProviderFlow("agenda")
      } else {
        setUserType("client")
        setClientFlow("agenda")
      }
      return
    }

    if (payload.type === "payment_request") {
      setUserType("client")
      setClientFlow("profile")
    }
  }

  const applyPushPayloadRef = useRef(applyPushPayload)
  applyPushPayloadRef.current = applyPushPayload

  usePushNotifications(user?.uid, (payload) => {
    applyPushPayloadRef.current(payload)
  })

  useEffect(() => {
    if (!user || authLoading || rolesLoading) return
    const pending = readPendingPush()
    if (!pending) return
    applyPushPayloadRef.current(pending)
  }, [user, authLoading, rolesLoading, isAdmin, isProvider, userType])

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
        else if (clientFlow === "profile") {
          if (needsProfilePhoto) App.minimizeApp()
          else setClientFlow("home")
        }
        else if (clientFlow === "agenda" || clientFlow === "chats" || clientFlow === "mi-servicio") setClientFlow("home")
        else if (clientFlow === "chat") setClientFlow(activeChat?.from === 'inbox' ? "chats" : "home")
        else if (clientFlow === "home") {
          if (clientHomeBackRef.current?.()) return
          if (botBackRef.current?.()) return
          App.minimizeApp()
        }
        else if (clientFlow === "login" || clientFlow === "register") setClientFlow("onboarding")
        else if (clientFlow === "onboarding") App.minimizeApp()
        return
      }
      if (userType === "provider") {
        if (providerFlow === "edit-service") {
          setProviderFlow("mi-servicio")
          setSelectedProviderService(null)
        }
        else if (providerFlow === "create-service") setProviderFlow("mi-servicio")
        else if (providerFlow === "services" || providerFlow === "statistics" || providerFlow === "stories" || providerFlow === "subscription") setProviderFlow("mi-servicio")
        else if (providerFlow === "payment") setProviderFlow("booking")
        else if (providerFlow === "booking") setProviderFlow("service-detail")
        else if (providerFlow === "service-detail") {
          setProviderFlow("home")
          setSelectedService(null)
        }
        else if (providerFlow === "profile") {
          if (needsProfilePhoto) App.minimizeApp()
          else setProviderFlow("home")
        }
        else if (providerFlow === "agenda" || providerFlow === "chats" || providerFlow === "mi-servicio" || providerFlow === "dashboard") setProviderFlow("home")
        else if (providerFlow === "chat") setProviderFlow(activeChat?.from === 'inbox' ? "chats" : selectedService ? "service-detail" : "home")
        else if (providerFlow === "home") {
          if (clientHomeBackRef.current?.()) return
          if (botBackRef.current?.()) return
          App.minimizeApp()
        }
        else if (providerFlow === "login" || providerFlow === "register") setProviderFlow("onboarding")
        else if (providerFlow === "onboarding") App.minimizeApp()
        return
      }
      App.minimizeApp()
    }
    handleBackRef.current = goBack
  }, [user, userType, isAdmin, clientFlow, providerFlow, activeChat, needsProfilePhoto, selectedService])

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

  // Mercado Pago vuelve a la app mediante com.encuentro12://mp-oauth o mp-pay.
  // Al recibir el enlace cerramos el navegador nativo; Firestore actualiza el
  // estado de conexión/pago en la pantalla correspondiente.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let listenerHandle: { remove: () => Promise<void> } | null = null
    App.addListener("appUrlOpen", ({ url }) => {
      if (!url.startsWith("com.encuentro12://mp-")) return
      import("@capacitor/browser")
        .then(({ Browser }) => Browser.close())
        .catch(() => undefined)
    }).then((handle) => {
      listenerHandle = handle
    })
    return () => {
      listenerHandle?.remove?.()
    }
  }, [])

  // El rol en Firestore es la fuente de verdad (client ↔ provider).
  // No sincronizar hasta que el doc exista con un rol real (evita pisar registro proveedor).
  // Si el usuario eligió “Ofrezco mi servicio”, no degradar a client por una carrera/doc viejo.
  useEffect(() => {
    if (typeof window === "undefined" || rolesLoading || !user || !hasRole) return

    const providerIntent =
      localStorage.getItem("providerIntent") === "1" ||
      localStorage.getItem("providerOnboarding") === "1"

    if (isProvider) {
      localStorage.removeItem("providerIntent")
      setUserType("provider")
      localStorage.setItem("userType", "provider")
      if (providerFlow === "onboarding" || providerFlow === "dashboard") setProviderFlow("home")
      return
    }

    if (isClient) {
      if (providerIntent) {
        // Mantener UI proveedor mientras se corrige el rol en Firestore.
        setUserType("provider")
        localStorage.setItem("userType", "provider")
        if (!fixingProviderRoleRef.current) {
          fixingProviderRoleRef.current = true
          void updateUserRole("provider", []).finally(() => {
            fixingProviderRoleRef.current = false
          })
        }
        return
      }
      setUserType("client")
      localStorage.setItem("userType", "client")
      if (clientFlow === "onboarding") setClientFlow("home")
    }
  }, [user, rolesLoading, hasRole, isClient, isProvider, providerFlow, clientFlow])

  // Cambiar de rol: actualizar Firestore, estado local y llevar al home del nuevo rol. Devuelve si tuvo éxito.
  const switchToProvider = async (): Promise<{ success: boolean }> => {
    const result = await updateUserRole("provider", [])
    if (result.success) {
      localStorage.setItem("providerIntent", "1")
      setUserType("provider")
      setProviderFlow("mi-servicio")
      localStorage.setItem("userType", "provider")
    }
    return result
  }
  const switchToClient = async (): Promise<{ success: boolean }> => {
    const result = await updateUserRole("client", [])
    if (result.success) {
      localStorage.removeItem("providerIntent")
      localStorage.removeItem("providerOnboarding")
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
      localStorage.removeItem('providerIntent')
      setUserType(null)
    }
  }, [user, authLoading])

  useEffect(() => {
    if (!user?.uid) {
      setNeedsProfilePhoto(false)
      return
    }

    const userRef = doc(db, "users", user.uid)
    const unsubscribe = onSnapshot(userRef, (snap) => {
      const stored = snap.data()?.profileImage
      if (hasValidProfilePhoto(stored)) {
        setNeedsProfilePhoto(false)
        return
      }
      if (hasValidProfilePhoto(user.photoURL)) {
        void setDoc(userRef, {
          profileImage: user.photoURL,
          updatedAt: new Date(),
        }, { merge: true })
        setNeedsProfilePhoto(false)
        return
      }
      setNeedsProfilePhoto(true)
    }, () => {
      setNeedsProfilePhoto(!hasValidProfilePhoto(user.photoURL))
    })

    return () => unsubscribe()
  }, [user?.uid, user?.photoURL])

  useEffect(() => {
    if (!user || !needsProfilePhoto) return
    const authScreens = ["onboarding", "login", "register"]
    if (userType === "client" && !authScreens.includes(clientFlow) && clientFlow !== "profile") {
      setClientFlow("profile")
    }
    if (userType === "provider" && !authScreens.includes(providerFlow) && providerFlow !== "profile") {
      setProviderFlow("profile")
    }
  }, [needsProfilePhoto, user, userType, clientFlow, providerFlow])

  const setClientFlowGuarded = (flow: typeof clientFlow | string) => {
    if (needsProfilePhoto && user && !["onboarding", "login", "register", "profile"].includes(flow)) {
      setClientFlow("profile")
      return
    }
    setClientFlow(flow as typeof clientFlow)
  }

  const setProviderFlowGuarded = (flow: typeof providerFlow | string) => {
    if (needsProfilePhoto && user && !["onboarding", "login", "register", "profile"].includes(flow)) {
      setProviderFlow("profile")
      return
    }
    setProviderFlow(flow as typeof providerFlow)
  }

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

  useEffect(() => {
    if (!user || !isAdmin || isNativeApp()) return
    const path = window.location.pathname
    if (path === "/admin" || path === "/admin/") return
    window.location.replace("/admin/")
  }, [user, isAdmin])

  // No bloquear home si ya hay userType cacheado: roles pueden resolver en background.
  const waitForRoles = Boolean(user && rolesLoading && !userType)
  if (authLoading || waitForRoles || appSettingsLoading || forceUpdate.checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (forceUpdate.required) {
    return (
      <ForceUpdateScreen
        settings={appSettings}
        installedBuild={forceUpdate.installedBuild}
        installedVersion={forceUpdate.installedVersion}
        effectiveMin={forceUpdate.effectiveMin}
      />
    )
  }

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
  // El panel de admin solo vive en la web; en la app nativa se bloquea.
  if (user && isAdmin) {
    if (isNativeApp()) {
      return <AdminMovedToWeb logout={logout} />
    }
    return <AdminDashboard user={user} logout={logout} />
  }

  // Si el usuario está logueado pero no se ha seleccionado tipo de usuario, mostrar selección
  if (user && !userType && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 50% -10%, oklch(0.94 0.04 200), oklch(0.98 0.01 200) 55%, #f3f4f6)",
        }}
      >
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <img
              src="/logonuevo.jpeg"
              alt="Punto Encuentro"
              className="w-24 h-24 mx-auto mb-5 rounded-2xl object-cover shadow-md"
            />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">¡Bienvenido de vuelta!</h1>
            <p className="text-muted-foreground mt-2">Elegí cómo querés entrar</p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setUserType("client")}
              className="w-full flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <AppIcon name="usuarios" className="h-9 w-9" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-gray-900">Soy cliente</span>
                <span className="block text-sm text-muted-foreground mt-0.5">
                  Buscá y contratá servicios cerca tuyo
                </span>
              </span>
              <ChevronRight className="h-5 w-5 text-gray-300 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => setUserType("provider")}
              className="w-full flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <AppIcon name="trabajo" className="h-9 w-9" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-gray-900">Soy proveedor</span>
                <span className="block text-sm text-muted-foreground mt-0.5">
                  Ofrecé tu trabajo y gestioná reservas
                </span>
              </span>
              <ChevronRight className="h-5 w-5 text-gray-300 shrink-0" />
            </button>
          </div>

          <div className="text-center">
            <Button variant="ghost" onClick={logout} className="text-sm text-gray-500">
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
        
        {/* PuntoBot - Asistente para Clientes */}
        <FloatingAssistant 
          user={user}
          role="client"
          bookings={bookings} 
          services={services}
          setFlow={setClientFlowGuarded}
          setActiveChat={setActiveChat}
          setSelectedService={setSelectedService}
          currentFlow={clientFlow}
          registerBotBackHandler={(handler) => {
            botBackRef.current = handler
          }}
        />

        <ClientFlow
          flow={clientFlow}
          setFlow={setClientFlowGuarded}
          selectedService={selectedService}
          setSelectedService={setSelectedService}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
          signIn={signIn}
          signUp={signUp}
          signInWithGoogle={signInWithGoogle}
          setAuthError={setAuthError}
          authError={authError}
          setAuthSuccess={setAuthSuccess}
          authSuccess={authSuccess}
          services={publicServices}
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
          openRegistration={appSettings.openRegistration}
          appName={appSettings.appName}
          registerHomeBackHandler={(handler) => {
            clientHomeBackRef.current = handler
          }}
        />
      </>
    )
  }

  if (userType === "provider") {
    return (
      <>
        {locationError === "permission_denied" && <LocationBanner />}

        {/* PuntoBot - Asistente para Proveedores */}
        <FloatingAssistant 
          user={user}
          role="provider"
          bookings={bookings} 
          services={services}
          setFlow={setProviderFlowGuarded}
          setActiveChat={setActiveChat}
          setSelectedProviderService={setSelectedProviderService}
          currentFlow={providerFlow}
          registerBotBackHandler={(handler) => {
            botBackRef.current = handler
          }}
        />

        <ProviderFlow 
          flow={providerFlow} 
          setFlow={setProviderFlowGuarded}
          signIn={signIn}
          signUp={signUp}
          signInWithGoogle={signInWithGoogle}
          setAuthError={setAuthError}
          authError={authError}
          setAuthSuccess={setAuthSuccess}
          authSuccess={authSuccess}
          services={services}
          createService={createService}
          createBooking={createBooking}
          user={user}
          logout={logout}
          userLocation={userLocation}
          selectedProviderService={selectedProviderService}
          setSelectedProviderService={setSelectedProviderService}
          selectedService={selectedService}
          setSelectedService={setSelectedService}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
          onSwitchToClient={switchToClient}
          activeChat={activeChat}
          setActiveChat={setActiveChat}
          openRegistration={appSettings.openRegistration}
          appName={appSettings.appName}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          searchServices={searchServices}
          setBookingSource={setBookingSource}
          bookingSource={bookingSource}
          registerHomeBackHandler={(handler) => {
            clientHomeBackRef.current = handler
          }}
        />
      </>
    )
  }

  return (
    <>
      {locationError === "permission_denied" && <LocationBanner />}

      <div
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 50% -20%, oklch(0.93 0.05 200), oklch(0.98 0.01 200) 50%, #eef2f4)",
        }}
      >
        <div className="w-full max-w-md space-y-7">
          <div className="text-center">
            <img
              src="/logonuevo.jpeg"
              alt="Punto Encuentro"
              className="w-36 h-36 mx-auto mb-5 rounded-3xl object-cover shadow-lg"
            />
            <h1 className="text-3xl font-bold text-primary tracking-tight">Punto Encuentro</h1>
            <p className="text-lg text-gray-700 mt-3 font-medium leading-snug">
              Lo que necesitás, más cerca
            </p>
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

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("providerIntent")
                localStorage.setItem("userType", "client")
                setUserType("client")
                setClientFlow("onboarding")
              }}
              className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm transition hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
            >
              <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <AppIcon name="usuarios" className="h-9 w-9" />
              </span>
              <span className="block text-sm font-bold text-gray-900">Cliente</span>
              <span className="block text-xs text-muted-foreground mt-1 leading-snug">
                Busco un servicio
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                localStorage.setItem("providerIntent", "1")
                localStorage.setItem("userType", "provider")
                setUserType("provider")
                setProviderFlow("onboarding")
              }}
              className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm transition hover:border-primary/40 hover:shadow-md active:scale-[0.99]"
            >
              <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <AppIcon name="trabajo" className="h-9 w-9" />
              </span>
              <span className="block text-sm font-bold text-gray-900">Proveedor</span>
              <span className="block text-xs text-muted-foreground mt-1 leading-snug">
                Ofrezco mi servicio
              </span>
            </button>
          </div>

          <Button
            variant="outline"
            className="w-full h-12 rounded-xl font-semibold"
            onClick={() => {
              const last = localStorage.getItem("userType")
              if (last === "provider") {
                localStorage.setItem("providerIntent", "1")
                setUserType("provider")
                setProviderFlow("login")
              } else {
                localStorage.removeItem("providerIntent")
                setUserType("client")
                setClientFlow("login")
              }
            }}
          >
            Iniciar sesión
          </Button>
          <div className="flex justify-center"><HelpLink /></div>
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
  signInWithGoogle,
  setAuthError,
  authError,
  setAuthSuccess,
  authSuccess,
  services,
  createService,
  createBooking,
  user,
  logout,
  userLocation,
  selectedProviderService,
  setSelectedProviderService,
  selectedService,
  setSelectedService,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  onSwitchToClient,
  activeChat,
  setActiveChat,
  openRegistration = true,
  appName = "Punto Encuentro",
  searchTerm,
  setSearchTerm,
  searchServices,
  setBookingSource,
  bookingSource,
  registerHomeBackHandler,
}: {
  flow: string
  setFlow: (flow: any) => void
  signIn: (email: string, password: string) => Promise<{ success: boolean, error?: string }>
  signUp: (email: string, password: string) => Promise<{ success: boolean, error?: string }>
  signInWithGoogle: (defaultRole?: 'client' | 'provider' | 'admin') => Promise<{ success: boolean, error?: string, redirect?: boolean, user?: any }>
  setAuthError: (error: string) => void
  authError: string
  setAuthSuccess: (message: string) => void
  authSuccess: string
  services: any[]
  createService: (serviceData: any) => Promise<{ success: boolean, error?: string }>
  createBooking: (bookingData: any) => Promise<{ success: boolean, error?: string }>
  user: any
  logout: () => Promise<{ success: boolean }>
  userLocation: { lat: number, lng: number } | null
  selectedProviderService: any
  setSelectedProviderService: (service: any) => void
  selectedService: any
  setSelectedService: (service: any) => void
  selectedDate: string
  setSelectedDate: (date: string) => void
  selectedTime: string
  setSelectedTime: (time: string) => void
  onSwitchToClient: () => Promise<{ success: boolean }>
  activeChat: any
  setActiveChat: (chat: any) => void
  openRegistration?: boolean
  appName?: string
  searchTerm: string
  setSearchTerm: (term: string) => void
  searchServices: (term: string) => any[]
  setBookingSource: (source: any) => void
  bookingSource: string
  registerHomeBackHandler?: (handler: (() => boolean) | null) => void
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
    return <ProviderLogin setFlow={setFlow} signIn={signIn} signInWithGoogle={signInWithGoogle} setAuthError={setAuthError} authError={authError} setAuthSuccess={setAuthSuccess} authSuccess={authSuccess} openRegistration={openRegistration} />
  }

  if (flow === "register") {
    if (!openRegistration) {
      return <RegistrationClosed setFlow={setFlow} backFlow="login" appName={appName} />
    }
    return <ProviderRegister setFlow={setFlow} signUp={signUp} signInWithGoogle={signInWithGoogle} setAuthError={setAuthError} authError={authError} setAuthSuccess={setAuthSuccess} authSuccess={authSuccess} />
  }

  // Inicio unificado: mismo home que el cliente
  if (flow === "home" || flow === "dashboard") {
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
        registerHomeBackHandler={registerHomeBackHandler}
      />
    )
  }

  if (flow === "mi-servicio") {
    return (
      <MyServiceHub
        role="provider"
        setFlow={setFlow}
        user={user}
        services={services}
        setSelectedProviderService={setSelectedProviderService}
      />
    )
  }

  if (flow === "profile") {
    return <ProviderProfile setFlow={setFlow} user={user} logout={logout} onSwitchToClient={onSwitchToClient} services={services} />
  }

  if (flow === "agenda") {
    return <ProviderAgenda setFlow={setFlow} user={user} setActiveChat={setActiveChat} />
  }

  if (flow === "services") {
    return <ProviderServices setFlow={setFlow} services={services} user={user} setSelectedProviderService={setSelectedProviderService} />
  }

  if (flow === "create-service") {
    return <CreateService setFlow={setFlow} createService={createService} user={user} userLocation={userLocation} services={services} />
  }

  if (flow === "edit-service") {
    return <EditService setFlow={setFlow} user={user} service={selectedProviderService} userLocation={userLocation} />
  }

  if (flow === "subscription") {
    return <ProviderSubscription setFlow={setFlow} />
  }

  if (flow === "stories") {
    return <ProviderStoriesManager user={user} services={services} setFlow={setFlow} />
  }

  if (flow === "statistics") {
    return <ProviderStatistics setFlow={setFlow} user={user} services={services} profileData={profileData} />
  }

  if (flow === "service-detail") {
    return (
      <ServiceDetail
        service={selectedService}
        services={services}
        setSelectedService={setSelectedService}
        setFlow={setFlow}
        bookingSource={bookingSource}
        user={user}
        userLocation={userLocation}
        setActiveChat={setActiveChat}
      />
    )
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

  if (flow === "chats") {
    return <ChatInbox user={user} setFlow={setFlow} setActiveChat={setActiveChat} homeFlow="home" />
  }

  if (flow === "chat") {
    return (
      <ChatWindow
        user={user}
        partnerId={activeChat?.partnerId}
        partnerName={activeChat?.partnerName}
        onBack={() => setFlow(activeChat?.from === 'inbox' ? "chats" : selectedService ? "service-detail" : "home")}
      />
    )
  }

  return <ProviderOnboarding setFlow={setFlow} openRegistration={openRegistration} appName={appName} />
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
  signInWithGoogle,
  setAuthError,
  authError,
  setAuthSuccess,
  authSuccess,
  onSwitchToProvider,
  setBookingSource,
  bookingSource,
  openRegistration = true,
  appName = "Punto Encuentro",
  registerHomeBackHandler,
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
  signInWithGoogle: (defaultRole?: 'client' | 'provider' | 'admin') => Promise<{ success: boolean, error?: string, redirect?: boolean, user?: any }>
  setAuthError: (error: string) => void
  authError: string
  setAuthSuccess: (message: string) => void
  authSuccess: string
  onSwitchToProvider: () => Promise<{ success: boolean }>
  setBookingSource: (source: any) => void
  bookingSource: string
  openRegistration?: boolean
  appName?: string
  registerHomeBackHandler?: (handler: (() => boolean) | null) => void
}) {
  if (flow === "login") {
    return <ClientLogin setFlow={setFlow} signIn={signIn} signInWithGoogle={signInWithGoogle} setAuthError={setAuthError} authError={authError} setAuthSuccess={setAuthSuccess} authSuccess={authSuccess} openRegistration={openRegistration} />
  }

  if (flow === "register") {
    if (!openRegistration) {
      return <RegistrationClosed setFlow={setFlow} backFlow="login" appName={appName} />
    }
    return <ClientRegister setFlow={setFlow} signUp={signUp} signInWithGoogle={signInWithGoogle} setAuthError={setAuthError} authError={authError} setAuthSuccess={setAuthSuccess} authSuccess={authSuccess} openRegistration={openRegistration} />
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
        registerHomeBackHandler={registerHomeBackHandler}
      />
    )
  }

  if (flow === "mi-servicio") {
    return (
      <MyServiceHub
        role="client"
        setFlow={setFlow}
        user={user}
        services={services}
        onBecomeProvider={onSwitchToProvider}
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
    return <ServiceDetail service={selectedService} services={services} setSelectedService={setSelectedService} setFlow={setFlow} bookingSource={bookingSource} user={user} userLocation={userLocation} setActiveChat={setActiveChat} />
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

  if (flow === "chats") {
    return <ChatInbox user={user} setFlow={setFlow} setActiveChat={setActiveChat} homeFlow="home" />
  }

  if (flow === "chat") {
    return (
      <ChatWindow
        user={user}
        partnerId={activeChat?.partnerId}
        partnerName={activeChat?.partnerName}
        onBack={() => setFlow(activeChat?.from === 'inbox' ? "chats" : selectedService ? "service-detail" : "home")}
      />
    )
  }

  return <ClientOnboarding setFlow={setFlow} openRegistration={openRegistration} appName={appName} />
}

function RegistrationClosed({
  setFlow,
  backFlow,
  appName = "Punto Encuentro",
}: {
  setFlow: (flow: string) => void
  backFlow: string
  appName?: string
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-2">{appName}</h1>
          <p className="text-muted-foreground text-sm">El registro de nuevas cuentas está temporalmente cerrado.</p>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-gray-600 text-center">Si ya tienes cuenta, puedes iniciar sesión.</p>
            <Button onClick={() => setFlow(backFlow)} className="w-full h-12">
              Ir a iniciar sesión
            </Button>
            <Button variant="ghost" onClick={() => setFlow("onboarding")} className="w-full">
              ← Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ClientOnboarding({ setFlow, openRegistration = true, appName = "Punto Encuentro" }: { setFlow: (flow: string) => void; openRegistration?: boolean; appName?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">{appName}</h1>
          <p className="text-muted-foreground">Encuentra el servicio perfecto</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            {openRegistration ? (
              <Button onClick={() => setFlow("register")} className="w-full h-12 text-base">
                Registrarse
              </Button>
            ) : (
              <p className="text-sm text-center text-muted-foreground py-2">Registro cerrado. Usa iniciar sesión si ya tienes cuenta.</p>
            )}

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

function ClientLogin({ setFlow, signIn, signInWithGoogle, setAuthError, authError, setAuthSuccess, authSuccess, openRegistration = true }: {
  setFlow: (flow: string) => void
  signIn: (email: string, password: string) => Promise<{ success: boolean, error?: string }>
  signInWithGoogle: (defaultRole?: 'client' | 'provider' | 'admin') => Promise<{ success: boolean, error?: string, redirect?: boolean }>
  setAuthError: (error: string) => void
  authError: string
  setAuthSuccess: (message: string) => void
  authSuccess: string
  openRegistration?: boolean
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAuthError("")
    setAuthSuccess("")

    const result = await signIn(email, password)

    if (result.success) {
      setFlow("home")
    } else {
      setAuthError(result.error || "Error al iniciar sesión")
    }

    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setAuthError("")
    setAuthSuccess("")

    const result = await signInWithGoogle("client")

    if (result.redirect) {
      setAuthSuccess("Redirigiendo a Google...")
      return
    }

    if (result.success) {
      setFlow("home")
    } else {
      setAuthError(result.error || "Error al iniciar sesión con Google")
    }

    setGoogleLoading(false)
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
                <Label htmlFor="email" className="flex items-center gap-2">
                  <AppIcon name="correo" className="h-4 w-4" />
                  Email
                </Label>
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
                <Label htmlFor="password" className="flex items-center gap-2">
                  <AppIcon name="seguridad" className="h-4 w-4" />
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-11"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}>
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={loading || googleLoading} className="w-full h-12 text-base">
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>
            </form>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">o</span>
              </div>
            </div>

            <GoogleSignInButton onClick={handleGoogleLogin} loading={googleLoading} disabled={loading} />

            {openRegistration && (
              <div className="text-center">
                <Button variant="link" onClick={() => setFlow("register")} className="text-sm text-muted-foreground">
                  ¿No tienes cuenta? Regístrate
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Button variant="ghost" onClick={() => setFlow("onboarding")} className="w-full">
          ← Volver
        </Button>
      </div>
    </div>
  )
}

function ClientRegister({ setFlow, signUp, signInWithGoogle, setAuthError, authError, setAuthSuccess, authSuccess, openRegistration = true }: {
  setFlow: (flow: string) => void
  signUp: (email: string, password: string) => Promise<{ success: boolean, error?: string }>
  signInWithGoogle: (defaultRole?: 'client' | 'provider' | 'admin') => Promise<{ success: boolean, error?: string, redirect?: boolean, user?: any }>
  setAuthError: (error: string) => void
  authError: string
  setAuthSuccess: (message: string) => void
  authSuccess: string
  openRegistration?: boolean
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [profileFile, setProfileFile] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState("")

  const handleProfileFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    const error = validateProfilePhotoFile(file)
    if (error) {
      setAuthError(error)
      return
    }
    setAuthError("")
    setProfileFile(file)
    setProfilePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileFile) {
      setAuthError("La foto de perfil es obligatoria")
      return
    }
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

          const { uploadImage } = await import("@/lib/uploadImage")
          const profileImage = await uploadImage(profileFile, `profiles/${currentUser.uid}/profile`)

          // Guardar usuario en Firestore con rol de cliente
          const { doc, setDoc } = await import("firebase/firestore")
          const { db } = await import("@/lib/firebase")

          await setDoc(doc(db, 'users', currentUser.uid), {
            email: email,
            displayName: name,
            role: 'client',
            permissions: [],
            isActive: true,
            profileImage,
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

  const handleGoogleRegister = async () => {
    setGoogleLoading(true)
    setAuthError("")
    setAuthSuccess("")

    const result = await signInWithGoogle("client")

    if (result.redirect) {
      setAuthSuccess("Redirigiendo a Google...")
      return
    }

    if (result.success) {
      if (profileFile && result.user?.uid) {
        try {
          const { uploadImage } = await import("@/lib/uploadImage")
          const profileImage = await uploadImage(profileFile, `profiles/${result.user.uid}/profile`)
          const { doc, setDoc } = await import("firebase/firestore")
          const { db } = await import("@/lib/firebase")
          await setDoc(doc(db, "users", result.user.uid), {
            profileImage,
            updatedAt: new Date(),
          }, { merge: true })
        } catch (error: any) {
          console.error("Error subiendo foto de perfil:", error)
        }
      }
      setAuthSuccess("¡Cuenta creada exitosamente! Bienvenido a Punto Encuentro.")
      setTimeout(() => setFlow("home"), 2000)
    } else {
      setAuthError(result.error || "Error al registrarse con Google")
    }

    setGoogleLoading(false)
  }

  if (!openRegistration) {
    return <RegistrationClosed setFlow={setFlow} backFlow="login" />
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
              <div className="flex flex-col items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="client-register-photo"
                  onChange={handleProfileFileChange}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("client-register-photo")?.click()}
                  className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-primary/40 bg-primary/5 flex items-center justify-center"
                >
                  {profilePreview ? (
                    <img src={profilePreview} alt="Foto de perfil" className="w-full h-full object-cover" />
                  ) : (
                    <AppIcon name="camara" className="h-8 w-8" />
                  )}
                </button>
                <Label htmlFor="client-register-photo" className="text-sm">
                  Foto de perfil <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-muted-foreground text-center">Obligatoria para crear la cuenta</p>
              </div>

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
                <Label htmlFor="email" className="flex items-center gap-2">
                  <AppIcon name="correo" className="h-4 w-4" />
                  Email
                </Label>
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
                <Label htmlFor="password" className="flex items-center gap-2">
                  <AppIcon name="seguridad" className="h-4 w-4" />
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={loading || googleLoading} className="w-full h-12 text-base">
                {loading ? "Registrando..." : "Registrarse"}
              </Button>
            </form>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">o</span>
              </div>
            </div>

            <GoogleSignInButton onClick={handleGoogleRegister} loading={googleLoading} disabled={loading} label="Registrarse con Google" />

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
  setActiveChat,
  registerHomeBackHandler,
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
  registerHomeBackHandler?: (handler: (() => boolean) | null) => void
}) {
  const { categories } = useCategories()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"home" | "recommendations" | "nearby" | "category" | "all-categories" | "search">("home")
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("")
  const [categoryBackTarget, setCategoryBackTarget] = useState<"home" | "all-categories">("home")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [maxPrice, setMaxPrice] = useState<number | "all">("all")
  const [onlyNearby, setOnlyNearby] = useState(false)
  const [searchRadiusKm, setSearchRadiusKm] = useState(10)
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [categoryOffset, setCategoryOffset] = useState(0)
  const [nearbyOffset, setNearbyOffset] = useState(0)
  const { position: userPosition, loading, setPosition } = useGeolocation()
  const { logInteraction } = useAnalytics()
  const [profileCity, setProfileCity] = useState('')
  const viewerCityCandidates = [userPosition?.city, profileCity, userPosition?.address].filter(Boolean)

  useEffect(() => {
    const loadProfileCity = async () => {
      if (!user?.uid) return
      try {
        const { getDoc, doc } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase')
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          if (data.city) setProfileCity(String(data.city))
        }
      } catch (error) {
        console.error('Error loading client city:', error)
      }
    }

    loadProfileCity()
  }, [user])

  const handleManualCityPrompt = async () => {
    const city = prompt("Introduce tu ciudad manualmente:")
    if (city) {
      const normalizedCity = city.trim()
      let cityCoordinates: { latitude: number; longitude: number } | null = null
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${normalizedCity}, Argentina`)}&format=json&limit=1&countrycodes=ar`, {
          headers: { 'Accept-Language': 'es' }
        })
        const results = await response.json()
        if (results?.[0]) {
          cityCoordinates = {
            latitude: Number(results[0].lat),
            longitude: Number(results[0].lon)
          }
        }
      } catch (error) {
        console.error('Error resolving manual city:', error)
      }

      setPosition({
        latitude: cityCoordinates?.latitude ?? Number.NaN,
        longitude: cityCoordinates?.longitude ?? Number.NaN,
        city: normalizedCity,
        address: normalizedCity
      })
      setProfileCity(normalizedCity)

      if (user?.uid) {
        void setDoc(doc(db, 'users', user.uid), {
          city: normalizedCity,
          updatedAt: new Date()
        }, { merge: true })
      }
    }
  }

  const handleStoryAction = (story: any) => {
    if (story.ctaType === 'contact' && story.ctaTarget) {
      openExternalUrl(story.ctaTarget)
      return
    }

    const targetService = services.find((service) => service.id === story.ctaTarget) || services.find((service) => service.providerId === story.providerId)
    if (!targetService) return

    setSelectedService(targetService)
    setBookingSource('stories')
    setFlow(story.ctaType === 'booking' ? 'booking' : 'service-detail')
  }

  const handleStoryReply = async (story: any, message: string) => {
    if (!user?.uid) return { success: false, error: 'Inicia sesión para responder historias.' }
    if (!story.providerId || story.providerId === user.uid) return { success: false, error: 'No puedes responder tu propia historia.' }

    const result = await sendChatMessage({
      sender: user,
      partnerId: story.providerId,
      partnerName: story.providerName || 'Proveedor',
      text: message,
      story: {
        id: story.id,
        providerId: story.providerId,
        providerName: story.providerName,
        mediaUrl: story.mediaUrl,
        mediaType: story.mediaType,
        caption: story.caption,
        serviceId: story.serviceId,
        serviceName: story.serviceName,
      },
    })

    if (result.success) {
      setActiveChat?.({ partnerId: story.providerId, partnerName: story.providerName || 'Proveedor' })
      setFlow('chat')
    }
    return result
  }

  // Calcular distancia de cada servicio al usuario
  const calcularDistanciaServicio = (service: any): string | null => {
    const serviceCoordinates = getServiceCoordinates(service)
    if (!userPosition || !Number.isFinite(userPosition.latitude) || !Number.isFinite(userPosition.longitude) || !serviceCoordinates) return null
    const dist = calcularDistanciaKm(
      userPosition.latitude, userPosition.longitude,
      serviceCoordinates.lat, serviceCoordinates.lng
    )
    return formatearDistancia(dist)
  }

  // Las categorías dinámicas de la base de datos
  const allCategories = categories.map(cat => ({
    name: cat.name,
    icon: cat.icon,
    active: cat.active
  })).filter(c => c.active !== false)

  // Mostrar 3 categorías en el home y rotarlas
  const visibleHomeCategories = useMemo(() => {
    if (allCategories.length <= 3) return allCategories
    return [0, 1, 2].map((i) => allCategories[(categoryOffset + i) % allCategories.length])
  }, [allCategories, categoryOffset])

  useEffect(() => {
    if (allCategories.length <= 3) return
    const timer = window.setInterval(() => {
      setCategoryOffset((prev) => (prev + 1) % allCategories.length)
    }, 4500)
    return () => window.clearInterval(timer)
  }, [allCategories.length])

  // Servicios con distancia calculada
  const discoveryLocation = useMemo(() => {
    if (userPosition && Number.isFinite(userPosition.latitude) && Number.isFinite(userPosition.longitude)) {
      return { lat: userPosition.latitude, lng: userPosition.longitude }
    }
    return userLocation
  }, [userPosition, userLocation])

  const servicesWithDistance = useMemo(() => {
    return services.map((service) => {
      const coordinates = getServiceCoordinates(service)
      if (!discoveryLocation || !coordinates) return { ...service, distance: undefined }
      return {
        ...service,
        distance: calcularDistanciaKm(discoveryLocation.lat, discoveryLocation.lng, coordinates.lat, coordinates.lng)
      }
    })
  }, [services, discoveryLocation])

  const currentCityKeys = useMemo(() => {
    return [profileCity, userPosition?.city, userPosition?.address]
      .filter(Boolean)
      .map((city) => normalizeSearchText(String(city)).split(',')[0])
      .filter(Boolean)
  }, [profileCity, userPosition?.city, userPosition?.address])

  const matchesCurrentCity = (service: any) => {
    if (currentCityKeys.length === 0) return false
    const serviceLocation = normalizeSearchText(`${service.city || ''} ${service.address || ''}`)
    return currentCityKeys.some((city) => serviceLocation.includes(city))
  }

  const nearbyServices = useMemo(() => {
    if (!discoveryLocation && currentCityKeys.length === 0) return []
    return servicesWithDistance
      .filter((service) => service.distance !== undefined ? service.distance <= 15 : matchesCurrentCity(service))
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
  }, [servicesWithDistance, discoveryLocation, currentCityKeys])

  const recommendedServices = useMemo(() => {
    return servicesWithDistance
      .filter((service) => service.distance !== undefined ? service.distance <= 30 : matchesCurrentCity(service))
      .sort((a, b) => {
        const ratingDifference = (b.rating || 0) - (a.rating || 0)
        if (ratingDifference !== 0) return ratingDifference
        return (a.distance ?? Infinity) - (b.distance ?? Infinity)
      })
  }, [servicesWithDistance, currentCityKeys])

  const knownSearchCities = useMemo(
    () =>
      Array.from(
        new Set(
          services
            .map((service: any) => normalizeSearchText(String(service.city || "")))
            .filter((city: string) => city.length >= 3)
        )
      ),
    [services]
  )

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      if (searchTerm.trim() && !serviceMatchesSearch(service, searchTerm, knownSearchCities)) {
        return false
      }

      const matchesCategory = !selectedCategory || serviceMatchesCategory(service, selectedCategory)
      const matchesPrice = maxPrice === "all" || Number(service.price) <= maxPrice
      if (!matchesCategory || !matchesPrice) return false

      const isLocationSearch = Boolean(
        searchTerm.trim() && serviceMatchesLocationSearch(service, searchTerm, knownSearchCities)
      )
      if (isLocationSearch) return true

      if (onlyNearby && userPosition) {
        const coords = getServiceCoordinates(service)
        if (!coords) return false
        const dist = calcularDistanciaKm(
          userPosition.latitude,
          userPosition.longitude,
          coords.lat,
          coords.lng
        )
        return dist <= searchRadiusKm
      }

      if (onlyNearby) return false

      return true
    })
  }, [services, searchTerm, selectedCategory, maxPrice, onlyNearby, searchRadiusKm, userPosition, knownSearchCities])

  const filteredServiceIds = useMemo(() => new Set(filteredServices.map((service) => service.id)), [filteredServices])
  const homeRecommendedServices = useMemo(
    () => recommendedServices.filter((service) => filteredServiceIds.has(service.id)),
    [recommendedServices, filteredServiceIds]
  )
  const homeNearbyServices = useMemo(
    () => nearbyServices.filter((service) => filteredServiceIds.has(service.id)),
    [nearbyServices, filteredServiceIds]
  )
  const nearbyProviders = useMemo(() => {
    // Pool amplio para rotar variedad: cerca + recomendados + resto con ubicación.
    const byProvider = new Map<string, any>()
    const consider = (list: any[]) => {
      for (const service of list) {
        const key = String(service.providerId || service.id)
        if (!key || byProvider.has(key)) continue
        if (!getServiceCoordinates(service) && !String(service.city || "").trim()) continue
        byProvider.set(key, service)
      }
    }
    consider(homeNearbyServices)
    consider(homeRecommendedServices)
    consider(filteredServices)

    const list = Array.from(byProvider.values())
    // Orden estable pero diverso: rating desc, luego distancia.
    list.sort((a, b) => {
      const ratingDiff = Number(b.rating || 0) - Number(a.rating || 0)
      if (ratingDiff !== 0) return ratingDiff
      return (a.distance ?? Infinity) - (b.distance ?? Infinity)
    })
    return list
  }, [homeNearbyServices, homeRecommendedServices, filteredServices])

  const visibleNearbyProviders = useMemo(() => {
    if (nearbyProviders.length === 0) return []
    if (nearbyProviders.length <= 3) {
      // Con pocos, rotar el orden para no mostrar siempre el mismo primero.
      const start = nearbyOffset % nearbyProviders.length
      return Array.from({ length: nearbyProviders.length }, (_, i) =>
        nearbyProviders[(start + i) % nearbyProviders.length]
      )
    }
    return [0, 1, 2].map((i) => nearbyProviders[(nearbyOffset + i) % nearbyProviders.length])
  }, [nearbyProviders, nearbyOffset])

  useEffect(() => {
    if (viewMode !== "home" || nearbyProviders.length <= 1) return
    const timer = window.setInterval(() => {
      setNearbyOffset((prev) => (prev + 1) % nearbyProviders.length)
    }, 4500)
    return () => window.clearInterval(timer)
  }, [nearbyProviders.length, viewMode])

  const searchResults = useMemo(() => {
    const term = searchTerm.trim()
    if (!term) return []
    return rankServicesForSearch(services as any[], term)
  }, [services, searchTerm])

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

  const handleServiceClick = (service: any, source?: 'anuncio' | 'recomendados' | 'cerca_tuyo' | 'rubro' | 'buscador' | 'stories') => {
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

  const handleCategoryClick = (categoryName: string, from: "home" | "all-categories" = "home") => {
    setSelectedCategoryName(categoryName)
    setCategoryBackTarget(from)
    setViewMode("category")
    logInteraction('categorias')
  }

  const handleBackToHome = () => {
    setViewMode("home")
    setSelectedCategory(null)
  }

  const handleBackFromCategory = () => {
    setViewMode(categoryBackTarget)
    setSelectedCategory(null)
  }

  const handleVerMasCategorias = () => {
    setViewMode("all-categories")
  }

  const handleOpenSearch = (term = searchTerm) => {
    const nextTerm = term.trim()
    if (nextTerm) {
      setSearchTerm(nextTerm)
      logInteraction('buscador')
    }
    setViewMode("search")
  }

  useEffect(() => {
    const applyBotHomeAction = () => {
      const action = consumeBotHomeAction()
      if (!action) return
      if (action.type === "search") {
        const parts = [action.term, action.city].map((value) => String(value || "").trim()).filter(Boolean)
        handleOpenSearch(parts.join(" "))
        return
      }
      if (action.type === "nearby") {
        setIsMapOpen(false)
        setViewMode("nearby")
        return
      }
      if (action.type === "map") {
        setViewMode("home")
        setIsMapOpen(true)
      }
    }

    applyBotHomeAction()
    window.addEventListener(BOT_HOME_EVENT, applyBotHomeAction)
    return () => window.removeEventListener(BOT_HOME_EVENT, applyBotHomeAction)
  }, [])

  // Botón atrás del celular: cerrar mapa/filtros o volver desde subpantallas
  useEffect(() => {
    if (!registerHomeBackHandler) return

    registerHomeBackHandler(() => {
      if (isMapOpen) {
        setIsMapOpen(false)
        return true
      }
      if (isFilterOpen) {
        setIsFilterOpen(false)
        return true
      }
      if (viewMode === "category") {
        setViewMode(categoryBackTarget)
        setSelectedCategory(null)
        return true
      }
      if (viewMode === "recommendations" || viewMode === "nearby" || viewMode === "all-categories" || viewMode === "search") {
        setViewMode("home")
        setSelectedCategory(null)
        return true
      }
      return false
    })

    return () => registerHomeBackHandler(null)
  }, [registerHomeBackHandler, viewMode, categoryBackTarget, isMapOpen, isFilterOpen])




  if (viewMode === "search") {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white shadow-sm p-4 space-y-3">
          <div className="flex items-center">
            <button onClick={handleBackToHome} className="mr-3" type="button">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold text-primary">Búsqueda</h1>
          </div>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              handleOpenSearch(searchTerm)
            }}
          >
            <div className="relative flex-1">
              <Input
                autoFocus
                placeholder="Nombre, rubro, servicio o palabra..."
                className="pl-4 pr-4 h-12 bg-gray-50 border-none rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit" className="h-12 w-12 rounded-xl" aria-label="Buscar">
              <Search className="h-5 w-5" />
            </Button>
          </form>
          {searchTerm.trim() && (
            <p className="text-xs text-muted-foreground">
              {searchResults.length} resultado{searchResults.length === 1 ? "" : "s"} para “{searchTerm.trim()}”
            </p>
          )}
        </div>
        <div className="p-4">
          {!searchTerm.trim() ? (
            <div className="text-center text-gray-500 py-16">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">¿Qué estás buscando?</p>
              <p className="text-sm mt-1">Probá con un nombre, rubro, servicio o ciudad.</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {searchResults.map((service) => (
                <Card
                  key={service.id}
                  className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                  onClick={() => handleServiceClick(service, "buscador")}
                >
                  <div className="relative w-full h-44">
                    <img src={service.image || "/placeholder.svg"} alt={service.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <div className="flex flex-col gap-1 mb-1">
                        <span className="text-base font-medium">{service.providerName || service.businessName || "Proveedor"}</span>
                        <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded self-start">{service.category}</span>
                      </div>
                      <p className="text-sm opacity-90">{service.name}</p>
                      {calcularDistanciaServicio(service) && (
                        <p className="text-xs text-green-300 mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {calcularDistanciaServicio(service)}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-16">
              <p className="font-medium">No encontramos resultados</p>
              <p className="text-sm mt-1">Probá con otra palabra, el rubro o el nombre del comercio.</p>
            </div>
          )}
        </div>
        <MainBottomNav
          active="inicio"
          onHome={() => setFlow("home")}
          onMyService={() => setFlow("mi-servicio")}
          onAgenda={() => setFlow("agenda")}
          onProfile={() => setFlow("profile")}
          user={user}
          setFlow={setFlow}
          zClass="z-40"
        />
      </div>
    )
  }

  if (viewMode === "recommendations") {
    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        <div className="bg-white shadow-sm p-4 flex items-center">
          <button onClick={handleBackToHome} className="mr-3">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold text-primary">Recomendados</h1>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4">
            {recommendedServices.map((service) => (
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
        <MainBottomNav
          active="inicio"
          onHome={() => setFlow("home")}
          onMyService={() => setFlow("mi-servicio")}
          onAgenda={() => setFlow("agenda")}
          onProfile={() => setFlow("profile")}
          user={user}
          setFlow={setFlow}
          zClass="z-40"
        />
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
      .filter((service) => service._distanciaKm <= 15)
      .sort((a, b) => a._distanciaKm - b._distanciaKm)

    return (
      <div className="min-h-screen bg-gray-50 pb-32">
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
        <MainBottomNav
          active="inicio"
          onHome={() => setFlow("home")}
          onMyService={() => setFlow("mi-servicio")}
          onAgenda={() => setFlow("agenda")}
          onProfile={() => setFlow("profile")}
          user={user}
          setFlow={setFlow}
          zClass="z-40"
        />
      </div>
    )
  }

  if (viewMode === "all-categories") {
    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        <div className="bg-white shadow-sm p-4 flex items-center">
          <button onClick={handleBackToHome} className="mr-3">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold text-primary">Todas las Categorías</h1>
        </div>
        <div className="p-4 pb-8">
          <div className="grid grid-cols-3 gap-4">
            {allCategories.map((category) => (
              <div
                key={category.name}
                className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleCategoryClick(category.name, "all-categories")}
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-3 overflow-hidden p-1.5 shadow-sm">
                  <CategoryIcon name={category.name} icon={category.icon} className="w-full h-full" />
                </div>
                <span className="text-sm font-medium text-center">{category.name}</span>
              </div>
            ))}
          </div>
        </div>
        <MainBottomNav
          active="inicio"
          onHome={() => setFlow("home")}
          onMyService={() => setFlow("mi-servicio")}
          onAgenda={() => setFlow("agenda")}
          onProfile={() => setFlow("profile")}
          user={user}
          setFlow={setFlow}
          zClass="z-40"
        />
      </div>
    )
  }

  if (viewMode === "category") {
    const categoryServices = services.filter(
      (service) => serviceMatchesCategory(service, selectedCategoryName),
    )

    return (
      <div className="min-h-screen bg-gray-50 pb-32">
        <div className="bg-white shadow-sm p-4 flex items-center">
          <button
            onClick={handleBackFromCategory}
            className="mr-3"
          >
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
        <MainBottomNav
          active="inicio"
          onHome={() => setFlow("home")}
          onMyService={() => setFlow("mi-servicio")}
          onAgenda={() => setFlow("agenda")}
          onProfile={() => setFlow("profile")}
          user={user}
          setFlow={setFlow}
          zClass="z-40"
        />
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-32">
        <div className="bg-primary pt-8 pb-6 px-4 rounded-b-[2rem] shadow-lg">
          <div className="text-center mb-4">
          <h1 className="text-white text-xl font-bold italic tracking-tight">
            Punto Encuentro
          </h1>
          {userPosition?.address ? (
            <div className="flex flex-col items-center gap-1">
              <div 
                className="flex items-center justify-center gap-1 text-white/90 text-[10px] font-medium mt-1 bg-white/10 backdrop-blur-sm self-center mx-auto w-fit px-3 py-1 rounded-full border border-white/20 cursor-pointer active:scale-95 transition-all"
                onClick={handleManualCityPrompt}
              >
                <MapPin className="h-2.5 w-2.5" />
                <span>{userPosition.address}</span>
                <span className="text-[8px] bg-white/20 px-1 rounded ml-1">Cambiar</span>
              </div>
            </div>
          ) : (
            <div 
              className="flex items-center justify-center gap-1 text-white/60 text-[10px] mt-1 italic cursor-pointer"
              onClick={handleManualCityPrompt}
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
          <form
            className="relative flex-1 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              handleOpenSearch(searchTerm)
            }}
          >
            <Input
              placeholder="Nombre, rubro, servicio o ciudad..."
              className="flex-1 h-12 bg-white border-none rounded-xl shadow-sm italic text-gray-500 pl-4"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => {
                if (viewMode === "home") setViewMode("search")
              }}
            />
            <Button type="submit" className="h-12 w-12 rounded-xl shadow-sm shrink-0" aria-label="Buscar">
              <Search className="h-5 w-5" />
            </Button>
          </form>
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
        <StoriesShelf
          cityCandidates={viewerCityCandidates}
          onStoryAction={handleStoryAction}
          onStoryReply={handleStoryReply}
          onConfigureLocation={handleManualCityPrompt}
        />

        <div>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-bold">Categorías</h2>
            <button
              type="button"
              onClick={handleVerMasCategorias}
              className="text-sm text-gray-400 font-bold tracking-wide uppercase"
            >
              Ver más
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {visibleHomeCategories.map((category, index) => (
              <div
                key={`${category.name}-${index}`}
                className="flex flex-col items-center gap-2 cursor-pointer"
                onClick={() => handleCategoryClick(category.name, "home")}
              >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 overflow-hidden p-2 bg-white transition-all ${index === 0 ? "border-primary" : "border-gray-100"}`}>
                  <CategoryIcon name={category.name} icon={category.icon} className="w-full h-full" />
                </div>
                <span className="text-sm font-medium text-gray-700 text-center leading-tight">{category.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-xl font-bold">Recomendados</h2>
            {homeRecommendedServices.length > 0 && (
              <button onClick={handleVerMas} className="text-sm text-gray-400 font-medium">
                Ver más
              </button>
            )}
          </div>
          {homeRecommendedServices.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {homeRecommendedServices.slice(0, 4).map((service) => (
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
          {visibleNearbyProviders.length > 0 ? (
            <div className="space-y-4">
              {visibleNearbyProviders.map((service) => (
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
                  setSearchRadiusKm(10);
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
              <div className="p-4 bg-gray-50 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${onlyNearby ? "bg-primary text-white" : "bg-white text-gray-400"}`}>
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Cerca de mí</p>
                      <p className="text-[10px] text-gray-400">
                        {onlyNearby ? `Radio de ${searchRadiusKm} km` : "Sin límite de distancia"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setOnlyNearby(!onlyNearby)}
                    className={`w-12 h-6 rounded-full transition-all relative ${onlyNearby ? "bg-primary" : "bg-gray-200"}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${onlyNearby ? "right-1" : "left-1"}`} />
                  </button>
                </div>

                {onlyNearby && (
                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 block">
                      Radio de búsqueda
                    </Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[5, 10, 20, 50].map((km) => (
                        <button
                          key={km}
                          type="button"
                          onClick={() => setSearchRadiusKm(km)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all ${searchRadiusKm === km ? "bg-primary text-white" : "bg-white text-gray-400 border border-gray-100"}`}
                        >
                          {km} km
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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

      {/* Botón flotante "Servicios cerca de mí" — arrastrable y con X para ocultar */}
      <DraggableFloat
        id="cerca-de-mi"
        defaultLeft={() => 24}
        defaultBottom={120}
        zIndex={400}
        onPress={() => setIsMapOpen(true)}
        restoreLabel="Cerca de mí"
        restoreIcon={<AppIcon name="ubicacion" className="h-4 w-4" />}
      >
        <div
          className="flex items-center justify-center gap-2 bg-primary text-white rounded-full px-4 py-3 shadow-xl border border-white/20"
          style={{ boxShadow: '0 8px 30px rgb(var(--primary) / 0.3)' }}
        >
          <span className="bg-white rounded-full p-0.5 flex items-center justify-center">
            <AppIcon name="ubicacion" className="h-5 w-5" />
          </span>
          <span className="text-xs font-black tracking-wide uppercase">Cerca de mí</span>
        </div>
      </DraggableFloat>

      {/* Vista de Mapa en Pantalla Completa */}
      {isMapOpen && (
        <NearByMap
          onClose={() => setIsMapOpen(false)}
          userLocation={userPosition}
          services={services}
          categories={categories}
          radiusKm={onlyNearby ? searchRadiusKm : 15}
          onServiceSelect={(service) => handleServiceClick(service, 'cerca_tuyo')}
        />
      )}

      {/* Footer Navigation */}
      <MainBottomNav
          active="inicio"
          onHome={() => setFlow("home")}
          onMyService={() => setFlow("mi-servicio")}
          onAgenda={() => setFlow("agenda")}
          onProfile={() => setFlow("profile")}
          user={user}
          setFlow={setFlow}
          zClass="z-40"
        />
      </>
  )
}

const CONTACT_REFERRAL_MESSAGE = "Hola, vengo de Punto Encuentro"

function buildWhatsAppUrl(value: string, message = CONTACT_REFERRAL_MESSAGE) {
  const digits = value.replace(/\D/g, "")
  if (!digits) return null
  const text = encodeURIComponent(message)
  return `https://wa.me/${digits}?text=${text}`
}

function buildInstagramUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const handle = trimmed.replace(/^@/, "")
  return `https://instagram.com/${handle}`
}

function buildFacebookUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const handle = trimmed.replace(/^@/, "")
  return `https://facebook.com/${handle}`
}

function buildWebsiteUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function openExternalUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer")
}

function openEmailClient(email: string, message = CONTACT_REFERRAL_MESSAGE) {
  const subject = encodeURIComponent("Consulta desde Punto Encuentro")
  const body = encodeURIComponent(message)
  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
}

function openPhoneDialer(phone: string) {
  window.location.href = `tel:${phone.replace(/\s/g, "")}`
}

function ServiceDetail({ service, services = [], setSelectedService, setFlow, bookingSource, user, setActiveChat }: { service: any; services?: any[]; setSelectedService?: (service: any) => void; setFlow: (flow: string) => void; bookingSource: string; user?: any; userLocation?: { lat: number, lng: number } | null; setActiveChat?: (chat: any) => void }) {
  const { position: userPosition } = useGeolocation()
  const { isFavorite, toggleFavorite } = useFavorites(user?.uid)
  const [providerProfile, setProviderProfile] = useState<any>(null)
  const serviceImages = useMemo(() => {
    const images = Array.isArray(service?.images) ? service.images.filter(Boolean) : []
    if (service?.image && !images.includes(service.image)) images.unshift(service.image)
    return images.length > 0 ? images : ['/placeholder.svg']
  }, [service])
  const [selectedImage, setSelectedImage] = useState(serviceImages[0])
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    setSelectedImage(serviceImages[0])
  }, [serviceImages])

  const canPreviewImage = (url?: string) => !!url && !url.toLowerCase().includes("placeholder")

  const openLightbox = (url: string) => {
    if (!canPreviewImage(url)) return
    const index = serviceImages.findIndex((imageUrl: string) => imageUrl === url)
    setLightboxIndex(index >= 0 ? index : 0)
    setLightboxOpen(true)
  }

  const showLightboxPrev = () => {
    setLightboxIndex((current) => {
      const nextIndex = (current - 1 + serviceImages.length) % serviceImages.length
      setSelectedImage(serviceImages[nextIndex])
      return nextIndex
    })
  }

  const showLightboxNext = () => {
    setLightboxIndex((current) => {
      const nextIndex = (current + 1) % serviceImages.length
      setSelectedImage(serviceImages[nextIndex])
      return nextIndex
    })
  }

  useEffect(() => {
    if (!lightboxOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false)
      if (event.key === "ArrowLeft" && serviceImages.length > 1) showLightboxPrev()
      if (event.key === "ArrowRight" && serviceImages.length > 1) showLightboxNext()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [lightboxOpen, serviceImages.length])

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
  const providerCity = service.city || providerProfile?.city || ''
  const providerPhone = (service.phone || providerProfile?.phone || '').trim()
  const providerEmail = providerProfile?.email || service.providerEmail || ''
  const dedicatedWhatsapp = (service.whatsapp || providerProfile?.whatsapp || '').trim()
  const providerInstagram = service.instagram || providerProfile?.instagram || ''
  const providerFacebook = service.facebook || providerProfile?.facebook || ''
  const providerWebsite = service.website || providerProfile?.website || ''
  const providerAddress = service.address || providerProfile?.address || ''
  const whatsappSource = dedicatedWhatsapp || providerPhone
  const contactMessage = service?.name
    ? `${CONTACT_REFERRAL_MESSAGE}. Me interesa: ${service.name}`
    : CONTACT_REFERRAL_MESSAGE
  const whatsappUrl = buildWhatsAppUrl(whatsappSource, contactMessage)
  const instagramUrl = providerInstagram ? buildInstagramUrl(providerInstagram) : null
  const facebookUrl = providerFacebook ? buildFacebookUrl(providerFacebook) : null
  const websiteUrl = providerWebsite ? buildWebsiteUrl(providerWebsite) : null
  const mapsUrl = (service.latitude && service.longitude)
    ? `https://www.google.com/maps?q=${service.latitude},${service.longitude}`
    : providerAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(providerAddress)}`
      : null
  const canOpenInAppChat = Boolean(service.providerId && user?.uid !== service.providerId)
  const hasContactInfo = !!(
    providerPhone ||
    providerEmail ||
    whatsappUrl ||
    instagramUrl ||
    facebookUrl ||
    websiteUrl ||
    mapsUrl ||
    canOpenInAppChat
  )
  const websiteLabel = providerWebsite
    ? providerWebsite.replace(/^https?:\/\//i, "").replace(/\/$/, "")
    : ""
  const instagramLabel = providerInstagram
    ? (providerInstagram.startsWith("http") ? `@${providerInstagram.split("/").filter(Boolean).pop()}` : (providerInstagram.startsWith("@") ? providerInstagram : `@${providerInstagram}`))
    : ""
  const facebookLabel = providerFacebook
    ? (providerFacebook.startsWith("http") ? providerFacebook.replace(/^https?:\/\/(www\.)?facebook\.com\//i, "").replace(/\/$/, "") : providerFacebook.replace(/^@/, ""))
    : ""
  const providerAvatar = providerProfile?.profileImage || `/placeholder.svg`
  const coverImg = selectedImage || serviceImages[0]
  const businessHours = providerProfile?.businessHours || null
  const viewerCityCandidates = [userPosition?.city, userPosition?.address].filter(Boolean)

  const openInAppChat = async () => {
    if (!service.providerId) return
    if (!user?.uid) {
      alert("Iniciá sesión para chatear con el proveedor desde la app.")
      setFlow("login")
      return
    }
    if (user.uid === service.providerId) {
      alert("No podés abrirte un chat con tu propio servicio.")
      return
    }

    const ensured = await ensureChatDocument({
      sender: user,
      partnerId: service.providerId,
      partnerName: providerName,
    })
    if (!ensured.success) {
      alert(ensured.error || "No se pudo abrir el chat.")
      return
    }

    setActiveChat?.({
      partnerId: service.providerId,
      partnerName: providerName,
      from: "service-detail",
    })
    setFlow("chat")
  }

  const openSocialWithReferral = async (url: string) => {
    try {
      await navigator.clipboard.writeText(contactMessage)
    } catch {
      // Si el portapapeles falla, igual abrimos el enlace
    }
    openExternalUrl(url)
  }

  const handleStoryAction = (story: any) => {
    if (story.ctaType === 'contact' && story.ctaTarget) {
      openExternalUrl(story.ctaTarget)
      return
    }

    const targetService = services.find((item: any) => item.id === story.ctaTarget) || service
    if (!targetService) return

    setSelectedService?.(targetService)
    if (story.ctaType === 'booking') {
      setFlow('booking')
      return
    }

    setFlow('service-detail')
  }

  const handleStoryReply = async (story: any, message: string) => {
    if (!user?.uid) return { success: false, error: 'Inicia sesión para responder historias.' }
    const result = await sendChatMessage({
      sender: user,
      partnerId: story.providerId,
      partnerName: story.providerName || providerName,
      text: message,
      story: {
        id: story.id,
        providerId: story.providerId,
        providerName: story.providerName,
        mediaUrl: story.mediaUrl,
        mediaType: story.mediaType,
        caption: story.caption,
        serviceId: story.serviceId,
        serviceName: story.serviceName,
      },
    })
    if (result.success) {
      setActiveChat?.({ partnerId: story.providerId, partnerName: story.providerName || providerName })
      setFlow('chat')
    }
    return result
  }

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
        <button
          type="button"
          onClick={() => openLightbox(coverImg)}
          disabled={!canPreviewImage(coverImg)}
          className="block w-full p-0 border-0 bg-transparent disabled:cursor-default"
          aria-label="Ver imagen en tamaño grande"
        >
          <img 
            src={coverImg} 
            alt={service.name} 
            className="w-full h-56 object-cover"
          />
        </button>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />
        
        {/* Back button */}
        <button 
          onClick={() => setFlow("home")} 
          className="absolute top-10 left-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>

        <button
          type="button"
          onClick={() => toggleFavorite(service.id)}
          className="absolute top-10 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md"
          aria-label={isFavorite(service.id) ? "Quitar de favoritos" : "Guardar en favoritos"}
        >
          <AppIcon name="favoritos" active={isFavorite(service.id)} className="h-5 w-5" />
        </button>

        {/* Category badge */}
        {canPreviewImage(coverImg) && (
          <div className="absolute bottom-3 left-4 bg-black/55 text-white text-[11px] font-medium rounded-full px-3 py-1 pointer-events-none">
            Tocá para ampliar
          </div>
        )}

        <div className="absolute bottom-3 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-md">
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

      {serviceImages.length > 1 && (
        <div className="px-4 mt-16 flex gap-2 overflow-x-auto pb-1">
          {serviceImages.map((imageUrl: string, index: number) => (
            <button
              key={`${imageUrl}-${index}`}
              type="button"
              onClick={() => {
                setSelectedImage(imageUrl)
                openLightbox(imageUrl)
              }}
              className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 ${selectedImage === imageUrl ? 'border-primary' : 'border-transparent'}`}
            >
              <img src={imageUrl} alt={`Vista ${index + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Nombre, ciudad, rating */}
      <div className={`text-center px-4 ${serviceImages.length > 1 ? 'mt-4' : 'mt-14'}`}>
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

      <div className="px-4 mt-6">
        <StoriesShelf
          cityCandidates={viewerCityCandidates}
          onStoryAction={handleStoryAction}
          onStoryReply={handleStoryReply}
        />
      </div>

      {/* Contacto */}
      <div className="px-4 mt-6 space-y-3">
        {whatsappUrl && (
          <div className="flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] border border-slate-100">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#25D366]">
              <WhatsAppIcon className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-slate-900">WhatsApp</p>
              <p className="text-xs text-slate-500">Chateá directo con nosotros</p>
              <p className="mt-0.5 text-sm font-semibold text-[#1faa59] truncate">{whatsappSource}</p>
            </div>
            <button
              type="button"
              onClick={() => openExternalUrl(whatsappUrl)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white shadow-sm active:scale-[0.98]"
            >
              <WhatsAppIcon className="h-3.5 w-3.5 text-white" />
              Chatear
            </button>
          </div>
        )}

        {hasContactInfo ? (
          <div className="grid grid-cols-3 gap-2.5">
            {providerPhone && (
              <button
                type="button"
                onClick={() => openPhoneDialer(providerPhone)}
                className="flex min-h-[132px] flex-col items-center rounded-2xl bg-white px-2 py-3 text-center shadow-[0_8px_24px_rgba(15,23,42,0.05)] border border-slate-100 active:scale-[0.98]"
              >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                  <Phone className="h-5 w-5" />
                </div>
                <p className="text-[13px] font-bold text-slate-900">Llamar</p>
                <p className="mt-1 line-clamp-2 break-all px-0.5 text-[11px] font-medium leading-tight text-teal-700">
                  {providerPhone}
                </p>
                <span className="mt-auto flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-teal-700 shadow-sm">
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </button>
            )}
            {providerEmail && (
              <button
                type="button"
                onClick={() => openEmailClient(providerEmail, contactMessage)}
                className="flex min-h-[132px] flex-col items-center rounded-2xl bg-white px-2 py-3 text-center shadow-[0_8px_24px_rgba(15,23,42,0.05)] border border-slate-100 active:scale-[0.98]"
              >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                  <Mail className="h-5 w-5" />
                </div>
                <p className="text-[13px] font-bold text-slate-900">Email</p>
                <p className="mt-1 line-clamp-2 break-all px-0.5 text-[11px] font-medium leading-tight text-teal-700">
                  {providerEmail}
                </p>
                <span className="mt-auto flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-teal-700 shadow-sm">
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </button>
            )}
            {instagramUrl && (
              <button
                type="button"
                onClick={() => openSocialWithReferral(instagramUrl)}
                className="flex min-h-[132px] flex-col items-center rounded-2xl bg-white px-2 py-3 text-center shadow-[0_8px_24px_rgba(15,23,42,0.05)] border border-slate-100 active:scale-[0.98]"
              >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                  <Instagram className="h-5 w-5" />
                </div>
                <p className="text-[13px] font-bold text-slate-900">Instagram</p>
                <p className="mt-1 line-clamp-2 break-all px-0.5 text-[11px] font-medium leading-tight text-teal-700">
                  {instagramLabel}
                </p>
                <span className="mt-auto flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-teal-700 shadow-sm">
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </button>
            )}
            {facebookUrl && (
              <button
                type="button"
                onClick={() => openSocialWithReferral(facebookUrl)}
                className="flex min-h-[132px] flex-col items-center rounded-2xl bg-white px-2 py-3 text-center shadow-[0_8px_24px_rgba(15,23,42,0.05)] border border-slate-100 active:scale-[0.98]"
              >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                  <Facebook className="h-5 w-5" />
                </div>
                <p className="text-[13px] font-bold text-slate-900">Facebook</p>
                <p className="mt-1 line-clamp-2 break-all px-0.5 text-[11px] font-medium leading-tight text-teal-700">
                  {facebookLabel}
                </p>
                <span className="mt-auto flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-teal-700 shadow-sm">
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </button>
            )}
            {websiteUrl && (
              <button
                type="button"
                onClick={() => openExternalUrl(websiteUrl)}
                className="flex min-h-[132px] flex-col items-center rounded-2xl bg-white px-2 py-3 text-center shadow-[0_8px_24px_rgba(15,23,42,0.05)] border border-slate-100 active:scale-[0.98]"
              >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                  <Globe className="h-5 w-5" />
                </div>
                <p className="text-[13px] font-bold text-slate-900">Sitio web</p>
                <p className="mt-1 line-clamp-2 break-all px-0.5 text-[11px] font-medium leading-tight text-teal-700">
                  {websiteLabel}
                </p>
                <span className="mt-auto flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-teal-700 shadow-sm">
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </button>
            )}
            {mapsUrl && (
              <button
                type="button"
                onClick={() => openExternalUrl(mapsUrl)}
                className="flex min-h-[132px] flex-col items-center rounded-2xl bg-white px-2 py-3 text-center shadow-[0_8px_24px_rgba(15,23,42,0.05)] border border-slate-100 active:scale-[0.98]"
              >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                  <MapPin className="h-5 w-5" />
                </div>
                <p className="text-[13px] font-bold text-slate-900">Ubicación</p>
                <p className="mt-1 line-clamp-2 px-0.5 text-[11px] font-medium leading-tight text-teal-700">
                  Ver en mapa
                </p>
                <span className="mt-auto flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-teal-700 shadow-sm">
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </button>
            )}
            {canOpenInAppChat && (
              <button
                type="button"
                onClick={() => void openInAppChat()}
                className="flex min-h-[132px] flex-col items-center rounded-2xl bg-white px-2 py-3 text-center shadow-[0_8px_24px_rgba(15,23,42,0.05)] border border-slate-100 active:scale-[0.98]"
              >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-700 overflow-hidden">
                  <AppIcon name="chat" className="h-6 w-6" />
                </div>
                <p className="text-[13px] font-bold text-slate-900">Mensaje</p>
                <p className="mt-1 line-clamp-2 px-0.5 text-[11px] font-medium leading-tight text-teal-700">
                  Chat en la app
                </p>
                <span className="mt-auto flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-teal-700 shadow-sm">
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 px-1">El proveedor aún no cargó datos de contacto.</p>
        )}

        {/* Sobre el servicio */}
        <div className="flex items-start gap-3 rounded-2xl bg-white px-3.5 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] border border-slate-100">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
            <Info className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">Sobre el servicio</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              {service.description || "Este proveedor aún no ha agregado una descripción de su servicio."}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6">
        <ServiceReviews serviceId={service.id} user={user} setFlow={setFlow} />
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
            <span className="text-xs text-gray-400">{Number(service.price) > 0 ? 'Desde' : 'Precio'}</span>
            <p className="text-xl font-black text-gray-800">{Number(service.price) > 0 ? `$${Number(service.price).toLocaleString('es-AR')}` : 'Consultar'}</p>
          </div>
          <Button 
            onClick={() => setFlow("booking")} 
            className="h-11 px-8 rounded-xl text-white font-semibold"
            style={{ backgroundColor: '#FF7F50' }}
          >
            Agendar Turno
          </Button>
        </div>
      </div>

      {lightboxOpen && canPreviewImage(serviceImages[lightboxIndex]) && (
        <div
          className="fixed inset-0 z-[80] bg-black/92 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Imagen ampliada"
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center"
            aria-label="Cerrar imagen"
          >
            <X className="h-5 w-5" />
          </button>

          {serviceImages.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                showLightboxPrev()
              }}
              className="absolute left-3 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          <img
            src={serviceImages[lightboxIndex]}
            alt={`${service.name} ${lightboxIndex + 1}`}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={(event) => event.stopPropagation()}
          />

          {serviceImages.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                showLightboxNext()
              }}
              className="absolute right-3 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center"
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {serviceImages.length > 1 && (
            <p className="absolute bottom-5 text-white/80 text-sm">
              {lightboxIndex + 1} / {serviceImages.length}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function ServiceReviews({
  serviceId,
  user,
  setFlow,
}: {
  serviceId: string
  user?: any
  setFlow?: (flow: string) => void
}) {
  const { reviews, loading, addReview, hasUserReviewed } = useReviews(serviceId)
  const [score, setScore] = useState(5)
  const [comment, setComment] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const alreadyReviewed = hasUserReviewed(user?.uid)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.uid) {
      setError("Inicia sesión para dejar una reseña.")
      return
    }
    if (!comment.trim()) {
      setError("Escribe un comentario sobre tu experiencia.")
      return
    }

    setSubmitting(true)
    setError("")
    setSuccess("")
    const result = await addReview({
      serviceId,
      clientId: user.uid,
      clientName: user.displayName || user.email || "Cliente",
      rating: score,
      comment: comment.trim(),
    })
    setSubmitting(false)

    if (result.success) {
      setComment("")
      setScore(5)
      setSuccess("¡Gracias! Tu reseña ya está publicada.")
    } else {
      setError(result.error || "No pudimos guardar la reseña.")
    }
  }

  return (
    <Card className="bg-white">
      <CardContent className="p-4 space-y-5">
        <h3 className="font-semibold">Reseñas de vecinos</h3>

        {!user?.uid ? (
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-sm text-muted-foreground">
            <p>Inicia sesión para dejar tu reseña.</p>
            {setFlow && (
              <Button variant="link" className="px-0 h-auto mt-1" onClick={() => setFlow("login")}>
                Ir a iniciar sesión
              </Button>
            )}
          </div>
        ) : alreadyReviewed ? (
          <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
            Ya dejaste tu reseña en este servicio. ¡Gracias!
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3">
            <p className="text-sm font-medium text-gray-800">¿Qué te pareció este servicio?</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setScore(value)}
                  className="p-1"
                  aria-label={`${value} estrellas`}
                >
                  <Star className={`h-7 w-7 ${value <= score ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Contá tu experiencia..."
              maxLength={500}
              className="w-full p-3 border border-input rounded-xl resize-none bg-white text-sm"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">{comment.length}/500</span>
              <Button type="submit" size="sm" disabled={submitting} className="rounded-xl">
                {submitting ? "Publicando..." : "Publicar reseña"}
              </Button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-700">{success}</p>}
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">Aún no hay reseñas para este servicio.</p>
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
  const { bookings } = useBookings()
  const availableTimes = getAvailableSlots(selectedDate, bookings, service?.id, service?.providerId)

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
              {availableTimes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay horarios libres ese día. Probá otra fecha o consultá al proveedor.</p>
              ) : (
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
              )}
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
  setActiveChat,
}: {
  service: any
  selectedDate: string
  selectedTime: string
  setFlow: (flow: string) => void
  user: any
  createBooking: (bookingData: any) => Promise<{success: boolean, error?: string, id?: string}>
  bookingSource: string
  setActiveChat: (chat: any) => void
}) {
  const [selectedPayment, setSelectedPayment] = useState<string>("")
  const [showTransferDetails, setShowTransferDetails] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [providerBankDetails, setProviderBankDetails] = useState<{cbu?: string, alias?: string, accountHolder?: string} | null>(null)
  const [mpConnected, setMpConnected] = useState(false)
  const [waitingMp, setWaitingMp] = useState(false)
  const [mpError, setMpError] = useState("")
  const [bookedPayLater, setBookedPayLater] = useState(false)
  const { settings: appSettings } = useAppSettings()
  const bookingPrice = parseMoney(service?.price) ?? 0
  const canPayMp = mpConnected && bookingPrice > 0
  
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
            setMpConnected(Boolean(data.mpConnected))
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

  const handleConfirmPayment = async (payNow = true) => {
    if (payNow && !selectedPayment) {
      alert("Elegí un método de pago o reservá para pagar después")
      return
    }
    if (!user || !service) {
      alert("Por favor completa todos los campos")
      return
    }

    setLoading(true)

    try {
      const method = payNow
        ? (selectedPayment as 'cash' | 'mercadopago' | 'transfer')
        : 'later'

      if (!payNow) setBookedPayLater(true)

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
        price: parseMoney(service.price) ?? 0,
        status: (appSettings.autoAcceptBookings ? 'confirmed' : 'pending') as 'pending' | 'confirmed',
        paymentMethod: method,
        paymentStatus: 'pending' as const,
        source: bookingSource,
      }

      const result = await createBooking(bookingData)

      if (!result.success || !result.id) {
        alert("Error al confirmar el turno. Por favor intenta nuevamente.")
        return
      }

      if (payNow && selectedPayment === "mercadopago") {
        setWaitingMp(true)
        const checkout = await createMercadoPagoCheckout(result.id)
        if (checkout.alreadyPaid) {
          setIsSuccess(true)
          setWaitingMp(false)
          return
        }
        if (checkout.initPoint) openMercadoPagoUrl(checkout.initPoint)
        const { doc, onSnapshot } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase")
        const stop = onSnapshot(doc(db, "bookings", result.id), (snap) => {
          if (snap.data()?.paymentStatus === "paid") {
            stop()
            setWaitingMp(false)
            setIsSuccess(true)
          }
        })
        return
      }

      setIsSuccess(true)
    } catch (error: any) {
      console.error('Error creating booking:', error)
      setWaitingMp(false)
      setMpError(callableErrorMessage(error))
      alert(callableErrorMessage(error) || "Error al confirmar el turno. Por favor intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  if (waitingMp) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: 'oklch(0.98 0.01 200)' }}>
        <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center mb-5">
          <AppIcon name="datosPago" className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagá en Mercado Pago</h2>
        <p className="text-gray-600 mb-6 max-w-sm">
          Te abrimos Mercado Pago para que el dinero vaya directo al comercio. Cuando el pago se acredite, esta reserva se confirma sola.
        </p>
        {mpError && <p className="text-sm text-red-600 mb-4">{mpError}</p>}
        <Button variant="ghost" className="text-gray-500" onClick={() => setFlow("home")}>
          Volver al inicio
        </Button>
      </div>
    )
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
          {bookedPayLater ? (
            <span className="block mt-2 text-sm">Podés pagarlo después desde tu perfil cuando quieras.</span>
          ) : null}
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
          <h1 className="text-xl font-bold">Confirmar reserva</h1>
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
                <span className="text-primary font-bold">{formatMoney(service.price)}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-1">¿Cómo querés pagar?</h3>
            <p className="text-sm text-muted-foreground mb-3">Podés pagar ahora o reservar y pagar después.</p>
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
                variant="outline"
                className={`h-16 w-full justify-start rounded-2xl border-2 px-3 transition-all ${
                  selectedPayment === "mercadopago"
                    ? "border-[#009EE3] bg-sky-50 text-[#007EB5] shadow-[0_6px_18px_rgba(0,158,227,0.14)] hover:bg-sky-50"
                    : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50/50"
                }`}
                onClick={() => handlePaymentSelect("mercadopago")}
                disabled={!canPayMp}
              >
                <span className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-sm ring-1 ring-sky-100">
                  <AppIcon name="datosPago" className="h-full w-full rounded-lg" />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block font-black">Mercado Pago</span>
                  {canPayMp && <span className="block text-[11px] font-normal opacity-75">Pago seguro directo al comercio</span>}
                  {!mpConnected && <span className="block text-[11px] font-normal opacity-70">El comercio todavía no conectó su cuenta</span>}
                  {mpConnected && bookingPrice <= 0 && <span className="block text-[11px] font-normal opacity-70">Este servicio no tiene precio para cobrar</span>}
                </span>
                {selectedPayment === "mercadopago" && (
                  <span className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#009EE3] text-sm font-black text-white">✓</span>
                )}
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
                  <span className="font-medium">Monto:</span> {formatMoney(service.price)}
                </p>
              </div>
              <Button variant="outline" className="w-full mt-3 bg-transparent">
                Enviar comprobante
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Confirm Payment */}
        <div className="space-y-2">
          <Button
            onClick={() => void handleConfirmPayment(true)}
            disabled={!selectedPayment || loading}
            className="w-full h-12 text-base"
            variant="orange"
          >
            {loading
              ? "Confirmando..."
              : selectedPayment === "mercadopago"
                ? "Reservar y pagar ahora"
                : "Confirmar reserva"}
          </Button>
          {bookingPrice > 0 && (
            <Button
              onClick={() => void handleConfirmPayment(false)}
              disabled={loading}
              variant="outline"
              className="w-full h-12 text-base bg-white"
            >
              Reservar y pagar después
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function canEditClientBooking(booking: any) {
  if (!booking || booking.status === "cancelled" || booking.status === "completed") return false
  const when = new Date(`${booking.date}T${booking.time || "23:59"}`)
  return Number.isNaN(when.getTime()) || when.getTime() > Date.now()
}

function ClientBookingDetail({
  booking,
  onClose,
}: {
  booking: any
  onClose: () => void
}) {
  const { cancelBooking, updateBooking } = useBookings()
  const [editing, setEditing] = useState(false)
  const [date, setDate] = useState(booking.date || "")
  const [time, setTime] = useState(booking.time || "")
  const [saving, setSaving] = useState(false)
  const [paying, setPaying] = useState(false)
  const editable = canEditClientBooking(booking)
  const canPay = isUnpaidBooking(booking)

  const statusLabel =
    booking.status === "confirmed" ? "Confirmada" :
    booking.status === "pending" ? "Pendiente" :
    booking.status === "cancelled" ? "Cancelada" :
    booking.status === "completed" ? "Completada" : booking.status

  const handlePay = async () => {
    setPaying(true)
    try {
      const checkout = await createMercadoPagoCheckout(booking.id)
      if (checkout.alreadyPaid) {
        onClose()
        return
      }
      if (checkout.initPoint) openMercadoPagoUrl(checkout.initPoint)
    } catch (error) {
      alert(callableErrorMessage(error) || "No se pudo abrir el pago")
    } finally {
      setPaying(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm("¿Cancelar esta reserva?")) return
    setSaving(true)
    const result = await cancelBooking(booking.id)
    setSaving(false)
    if (result.success) onClose()
    else alert("No se pudo cancelar la reserva")
  }

  const handleSave = async () => {
    if (!date || !time) {
      alert("Elegí fecha y hora")
      return
    }
    setSaving(true)
    const result = await updateBooking(booking.id, { date, time })
    setSaving(false)
    if (result.success) {
      setEditing(false)
      onClose()
    } else {
      alert("No se pudo actualizar la reserva")
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-md rounded-3xl" onClick={(event) => event.stopPropagation()}>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{booking.serviceName || "Reserva"}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{booking.providerName || "Proveedor"}</p>
            </div>
            <button type="button" onClick={onClose} className="p-1 text-gray-400"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex text-xs px-2 py-1 rounded ${
              booking.status === "confirmed" ? "bg-green-100 text-green-800" :
              booking.status === "pending" ? "bg-yellow-100 text-yellow-800" :
              booking.status === "cancelled" ? "bg-red-100 text-red-800" :
              "bg-blue-100 text-blue-800"
            }`}>{statusLabel}</span>
            <span className={`inline-flex text-xs px-2 py-1 rounded ${
              booking.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-orange-800"
            }`}>
              {paymentStatusLabel(booking.paymentStatus)} · {paymentMethodLabel(booking.paymentMethod)}
            </span>
          </div>

          {editing ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="edit-booking-date">Fecha</Label>
                <Input id="edit-booking-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-booking-time">Hora</Label>
                <Input id="edit-booking-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>Cancelar</Button>
                <Button className="flex-1" disabled={saving} onClick={handleSave}>{saving ? "Guardando..." : "Guardar"}</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-2xl bg-gray-50 p-4 space-y-1 text-sm">
                <p><span className="text-muted-foreground">Fecha:</span> {booking.date || "Sin fecha"}</p>
                <p><span className="text-muted-foreground">Hora:</span> {booking.time || "Sin hora"}</p>
                <p><span className="text-muted-foreground">Precio:</span> {formatMoney(booking.price)}</p>
                {booking.paymentRequested && canPay && (
                  <p className="text-orange-600 font-medium pt-1">El proveedor te pidió el pago</p>
                )}
              </div>
              {canPay && (
                <Button className="w-full" disabled={paying} onClick={() => void handlePay()}>
                  {paying ? "Abriendo Mercado Pago..." : "Pagar ahora"}
                </Button>
              )}
              {editable ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => setEditing(true)}>Editar</Button>
                  <Button variant="destructive" disabled={saving} onClick={handleCancel}>{saving ? "..." : "Cancelar turno"}</Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center">Esta reserva ya no se puede modificar.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ClientProfile({ setFlow, user, logout }: { setFlow: (flow: string) => void; user: any; logout: () => Promise<{ success: boolean }>; onSwitchToProvider?: () => Promise<{ success: boolean }>; services?: any[]; setSelectedService?: (service: any) => void }) {
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    city: "",
    address: "",
    profileImage: "/placeholder.svg"
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [success, setSuccess] = useState("")
  const photoMissing = !hasValidProfilePhoto(profileData.profileImage)

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
              city: data.city || "",
              address: data.address || "",
              profileImage: hasValidProfilePhoto(data.profileImage)
                ? data.profileImage
                : (hasValidProfilePhoto(user?.photoURL) ? user.photoURL : "/placeholder.svg")
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
    if (!hasValidProfilePhoto(profileData.profileImage)) {
      setSuccess("")
      alert("La foto de perfil es obligatoria. Subí una imagen para continuar.")
      return
    }
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
          <Button variant="ghost" size="sm" onClick={() => { if (!photoMissing) setFlow("home") }} disabled={photoMissing}>
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
                      {uploadingImage ? '⏳' : <AppIcon name="camara" className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>
              <h2 className="text-xl font-semibold">
                {profileData.name || user?.displayName || 'Usuario'}
              </h2>
              <p className="text-muted-foreground">
                {profileData.email || user?.email || 'Sin email'}
              </p>
              {profileData.phone && !isEditing && (
                <p className="text-sm text-muted-foreground mt-1">
                  📞 {profileData.phone}
                </p>
              )}
              {photoMissing && (
                <p className="text-sm text-red-600 font-medium mt-2">La foto de perfil es obligatoria. Tocá Editar perfil para subirla.</p>
              )}

              {!isEditing && (
                <div className="mt-4 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => setIsEditing(true)}
                  >
                    Editar perfil
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleLogout}
                    disabled={loading}
                  >
                    <AppIcon name="cerrarSesion" className="h-4 w-4 mr-2" />
                    {loading ? "Cerrando sesión..." : "Cerrar sesión"}
                  </Button>
                </div>
              )}

              {isEditing && (
                <div className="space-y-3 mt-4 text-left">
                  <div className="space-y-2">
                    <Label htmlFor="client-name">Nombre</Label>
                    <Input
                      id="client-name"
                      value={profileData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-email" className="flex items-center gap-2">
                      <AppIcon name="correo" className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="client-email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-phone" className="flex items-center gap-2">
                      <AppIcon name="telefono" className="h-4 w-4" />
                      Teléfono
                    </Label>
                    <Input
                      id="client-phone"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="11 1234-5678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-city">Ciudad</Label>
                    <Input
                      id="client-city"
                      value={profileData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="Ej: Rosario"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-address" className="flex items-center gap-2">
                      <AppIcon name="ubicacion" className="h-4 w-4" />
                      Dirección
                    </Label>
                    <Input
                      id="client-address"
                      value={profileData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      placeholder="Calle, número, ciudad"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1" disabled={photoMissing && loading}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={loading || photoMissing} className="flex-1">
                      {loading ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleLogout}
                    disabled={loading}
                  >
                    <AppIcon name="cerrarSesion" className="h-4 w-4 mr-2" />
                    {loading ? "Cerrando sesión..." : "Cerrar sesión"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center"><HelpLink /></div>
        <p className="text-xs text-muted-foreground text-center px-2">
          Para ofrecer un servicio usá la pestaña <button type="button" className="underline font-medium text-primary" onClick={() => setFlow("mi-servicio")}>Mi servicio</button>. Tus reservas están en Agenda.
        </p>
      </div>

      <div className="h-24"></div>

      {/* Footer Navigation */}
      <MainBottomNav
          active="perfil"
          onHome={() => setFlow("home")}
          onMyService={() => setFlow("mi-servicio")}
          onAgenda={() => setFlow("agenda")}
          onProfile={() => setFlow("profile")}
          user={user}
          setFlow={setFlow}
          zClass="z-40"
        />
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
  const [ratingError, setRatingError] = useState("")
  const [submittingRating, setSubmittingRating] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<any>(null)

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

  const canReviewBooking = (booking: any) => {
    if (booking.reviewed || booking.status === 'cancelled') return false
    if (booking.status === 'completed') return true
    const appointmentDate = new Date(`${booking.date}T${booking.time || '23:59'}`)
    return !Number.isNaN(appointmentDate.getTime()) && appointmentDate.getTime() <= Date.now()
  }

  const openRatingModal = (booking: any) => {
    setRatingBooking(booking)
    setRatingScore(5)
    setRatingComment("")
    setRatingError("")
    setShowRateModal(true)
  }

  const handleSubmitRating = async () => {
    if (!ratingBooking || !user?.uid) return
    if (!ratingComment.trim()) {
      setRatingError("Escribe un comentario sobre tu experiencia.")
      return
    }

    setSubmittingRating(true)
    setRatingError("")
    const result = await addReview({
      serviceId: ratingBooking.serviceId,
      clientId: user.uid,
      clientName: user.displayName || user.email || 'Cliente',
      rating: ratingScore,
      comment: ratingComment.trim()
    }, ratingBooking.id)
    setSubmittingRating(false)

    if (result.success) {
      setShowRateModal(false)
      setRatingBooking(null)
      await fetchBookings()
    } else {
      setRatingError(result.error || "No pudimos guardar la reseña.")
    }
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
              <Card key={booking.id} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden cursor-pointer" onClick={() => setSelectedBooking(booking)}>
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
                  {canReviewBooking(booking) && (
                    <Button type="button" variant="outline" className="w-full mt-4 text-amber-600 border-amber-200" onClick={(event) => { event.stopPropagation(); openRatingModal(booking) }}>
                      <Star className="h-4 w-4 mr-2" /> Calificar y escribir reseña
                    </Button>
                  )}
                  {booking.reviewed && (
                    <p className="text-xs text-green-600 font-medium mt-3 text-center">✓ Ya calificaste este servicio</p>
                  )}
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

      {selectedBooking && (
        <ClientBookingDetail booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      )}

      {showRateModal && ratingBooking && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center p-4">
          <Card className="w-full max-w-md rounded-3xl">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold">Calificar servicio</h3>
                  <p className="text-sm text-muted-foreground mt-1">{ratingBooking.serviceName}</p>
                </div>
                <button type="button" onClick={() => setShowRateModal(false)} className="p-1 text-gray-400"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button key={score} type="button" onClick={() => setRatingScore(score)} className="p-1" aria-label={`${score} estrellas`}>
                    <Star className={`h-9 w-9 ${score <= ratingScore ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating-comment">Tu reseña</Label>
                <textarea id="rating-comment" rows={4} value={ratingComment} onChange={(event) => setRatingComment(event.target.value)} placeholder="¿Cómo fue tu experiencia?" maxLength={500} className="w-full p-3 border border-input rounded-xl resize-none" />
                <p className="text-xs text-muted-foreground text-right">{ratingComment.length}/500</p>
              </div>
              {ratingError && <p className="text-sm text-red-600">{ratingError}</p>}
              <Button type="button" className="w-full" disabled={submittingRating} onClick={handleSubmitRating}>
                {submittingRating ? 'Publicando...' : 'Publicar reseña'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer Navigation */}
      <MainBottomNav
          active="agenda"
          onHome={() => setFlow("home")}
          onMyService={() => setFlow("mi-servicio")}
          onAgenda={() => setFlow("agenda")}
          onProfile={() => setFlow("profile")}
          user={user}
          setFlow={setFlow}
          zClass="z-20"
        />
    </div>
  )
}

function ProviderOnboarding({ setFlow, openRegistration = true, appName = "Punto Encuentro" }: { setFlow: (flow: string) => void; openRegistration?: boolean; appName?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">{appName}</h1>
          <p className="text-muted-foreground">Ofrece tus servicios</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            {openRegistration ? (
              <Button onClick={() => setFlow("register")} className="w-full h-12 text-base">
                Registrarse como proveedor
              </Button>
            ) : (
              <p className="text-sm text-center text-muted-foreground py-2">Registro cerrado. Usa iniciar sesión si ya tienes cuenta.</p>
            )}

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
  signInWithGoogle,
  setAuthError,
  authError,
  setAuthSuccess,
  authSuccess,
  openRegistration = true,
}: {
  setFlow: (flow: string) => void
  signIn: (email: string, password: string) => Promise<{ success: boolean, error?: string }>
  signInWithGoogle: (defaultRole?: 'client' | 'provider' | 'admin') => Promise<{ success: boolean, error?: string, redirect?: boolean }>
  setAuthError: (error: string) => void
  authError: string
  setAuthSuccess: (message: string) => void
  authSuccess: string
  openRegistration?: boolean
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError("")

    const result = await signIn(email, password)
    if (result.success) {
      // Preferir rol real de Firestore (signIn ya escribió localStorage); fallback proveedor.
      const saved = localStorage.getItem("userType")
      if (saved !== "client" && saved !== "provider") {
        localStorage.setItem("userType", "provider")
      }
      localStorage.setItem("providerIntent", "1")
      localStorage.setItem("userType", "provider")
      setFlow("home")
    } else {
      setAuthError(result.error || "Error al iniciar sesión")
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setAuthError("")
    setAuthSuccess("")

    const result = await signInWithGoogle("provider")

    if (result.redirect) {
      setAuthSuccess("Redirigiendo a Google...")
      return
    }

    if (result.success) {
      localStorage.setItem("providerIntent", "1")
      localStorage.setItem("userType", "provider")
      setFlow("home")
    } else {
      setAuthError(result.error || "Error al iniciar sesión con Google")
    }

    setGoogleLoading(false)
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
                <Label htmlFor="provider-email" className="flex items-center gap-2">
                  <AppIcon name="correo" className="h-4 w-4" />
                  Email
                </Label>
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
                <Label htmlFor="provider-password" className="flex items-center gap-2">
                  <AppIcon name="seguridad" className="h-4 w-4" />
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="provider-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-11"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}>
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={googleLoading} className="w-full h-12 text-base">
                Iniciar sesión
              </Button>
            </form>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">o</span>
              </div>
            </div>

            <GoogleSignInButton onClick={handleGoogleLogin} loading={googleLoading} />

            {openRegistration && (
              <div className="text-center">
                <Button variant="link" onClick={() => setFlow("register")} className="text-sm text-muted-foreground">
                  ¿No tienes cuenta? Regístrate
                </Button>
              </div>
            )}
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
  signInWithGoogle,
  setAuthError,
  authError,
  setAuthSuccess,
  authSuccess
}: {
  setFlow: (flow: string) => void
  signUp: (email: string, password: string) => Promise<{ success: boolean, error?: string }>
  signInWithGoogle: (defaultRole?: 'client' | 'provider' | 'admin') => Promise<{ success: boolean, error?: string, redirect?: boolean, user?: any }>
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
  const [googleLoading, setGoogleLoading] = useState(false)
  const [profileFile, setProfileFile] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState("")

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleProfileFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    const error = validateProfilePhotoFile(file)
    if (error) {
      setAuthError(error)
      return
    }
    setAuthError("")
    setProfileFile(file)
    setProfilePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError("")
    setAuthSuccess("")

    if (!profileFile) {
      setAuthError("La foto de perfil es obligatoria")
      return
    }

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

          const { uploadImage } = await import("@/lib/uploadImage")
          const profileImage = await uploadImage(profileFile, `profiles/${currentUser.uid}/profile`)

          // Guardar perfil proveedor. No escribir isVerified/permissions/isActive en update:
          // las reglas de Firestore bloquean esos campos (solo admin / create inicial).
          const { doc, getDoc, setDoc } = await import("firebase/firestore")
          const { db } = await import("@/lib/firebase")
          const userRef = doc(db, 'users', currentUser.uid)
          const existing = await getDoc(userRef)

          if (!existing.exists()) {
            await setDoc(userRef, {
              email: formData.email,
              displayName: formData.businessName,
              phone: formData.phone,
              role: 'provider',
              permissions: [],
              isActive: true,
              isVerified: false,
              profileImage,
              createdAt: new Date(),
              updatedAt: new Date()
            })
          } else {
            await setDoc(userRef, {
              email: formData.email,
              displayName: formData.businessName,
              phone: formData.phone,
              role: 'provider',
              profileImage,
              updatedAt: new Date()
            }, { merge: true })
          }

          // Guardar en localStorage INMEDIATAMENTE para que la sincronización
          // de page.tsx sepa que es proveedor y no dependa de la re-lectura de Firestore
          localStorage.setItem("userType", "provider")
          localStorage.setItem("providerIntent", "1")
        }

        setAuthSuccess("¡Registro exitoso! Bienvenido a Punto Encuentro")
        localStorage.setItem("providerOnboarding", "1")
        localStorage.setItem("providerIntent", "1")
        setTimeout(() => {
          setFlow("profile")
        }, 2000)
      } else {
        setAuthError(result.error || "Error al registrarse")
      }
    } catch (error: any) {
      console.error('Error en registro:', error)
      const msg = error?.message || "Error al registrarse"
      if (String(msg).toLowerCase().includes('permission') || error?.code === 'storage/unauthorized') {
        setAuthError("No hay permisos para subir la foto o guardar el perfil. Pedile al admin que despliegue las reglas de Storage/Firestore.")
      } else {
        setAuthError(msg)
      }
    }
  }

  const handleGoogleRegister = async () => {
    setGoogleLoading(true)
    setAuthError("")
    setAuthSuccess("")

    const result = await signInWithGoogle("provider")

    if (result.redirect) {
      setAuthSuccess("Redirigiendo a Google...")
      return
    }

    if (result.success) {
      // Forzar rol proveedor sin tocar campos reservados (isVerified, permissions, etc.).
      if (result.user?.uid) {
        try {
          const { doc, setDoc } = await import("firebase/firestore")
          const { db } = await import("@/lib/firebase")
          await setDoc(doc(db, "users", result.user.uid), {
            role: "provider",
            updatedAt: new Date(),
          }, { merge: true })
        } catch (error) {
          console.error("Error fijando rol proveedor:", error)
        }
      }
      localStorage.setItem("userType", "provider")
      localStorage.setItem("providerOnboarding", "1")
      localStorage.setItem("providerIntent", "1")
      if (profileFile && result.user?.uid) {
        try {
          const { uploadImage } = await import("@/lib/uploadImage")
          const profileImage = await uploadImage(profileFile, `profiles/${result.user.uid}/profile`)
          const { doc, setDoc } = await import("firebase/firestore")
          const { db } = await import("@/lib/firebase")
          await setDoc(doc(db, "users", result.user.uid), {
            profileImage,
            role: "provider",
            updatedAt: new Date(),
          }, { merge: true })
        } catch (error: any) {
          console.error("Error subiendo foto de perfil:", error)
        }
      }
      setAuthSuccess("¡Registro exitoso! Bienvenido a Punto Encuentro")
      setTimeout(() => setFlow("profile"), 2000)
    } else {
      setAuthError(result.error || "Error al registrarse con Google")
    }

    setGoogleLoading(false)
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
              <div className="flex flex-col items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="provider-register-photo"
                  onChange={handleProfileFileChange}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("provider-register-photo")?.click()}
                  className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-primary/40 bg-primary/5 flex items-center justify-center"
                >
                  {profilePreview ? (
                    <img src={profilePreview} alt="Foto de perfil" className="w-full h-full object-cover" />
                  ) : (
                    <AppIcon name="camara" className="h-8 w-8" />
                  )}
                </button>
                <Label htmlFor="provider-register-photo" className="text-sm">
                  Foto de perfil <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-muted-foreground text-center">Obligatoria para crear la cuenta</p>
              </div>

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
                <Label htmlFor="business-email" className="flex items-center gap-2">
                  <AppIcon name="correo" className="h-4 w-4" />
                  Email
                </Label>
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
                <Label htmlFor="business-phone" className="flex items-center gap-2">
                  <AppIcon name="telefono" className="h-4 w-4" />
                  Teléfono
                </Label>
                <Input
                  id="business-phone"
                  placeholder="11 1234-5678"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-password" className="flex items-center gap-2">
                  <AppIcon name="seguridad" className="h-4 w-4" />
                  Contraseña
                </Label>
                <Input
                  id="business-password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={googleLoading} className="w-full h-12 text-base">
                Registrarse
              </Button>
            </form>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">o</span>
              </div>
            </div>

            <GoogleSignInButton onClick={handleGoogleRegister} loading={googleLoading} label="Registrarse con Google" />

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

function MyServiceHub({
  role,
  setFlow,
  user,
  services,
  setSelectedProviderService,
  onBecomeProvider,
}: {
  role: "provider" | "client"
  setFlow: (flow: string) => void
  user: any
  services: any[]
  setSelectedProviderService?: (service: any) => void
  onBecomeProvider?: () => Promise<{ success: boolean }>
}) {
  const { getBookingsByProvider, updateBooking } = useBookings()
  const [converting, setConverting] = useState(false)
  const [convertError, setConvertError] = useState("")
  const myService = getCanonicalService(services, user?.uid)
  const providerBookings = role === "provider" ? (getBookingsByProvider(user?.uid) || []) : []
  const pendingRequests = providerBookings.filter((booking: any) => booking.status === "pending")

  const openEdit = () => {
    if (!myService || !setSelectedProviderService) return
    setSelectedProviderService(myService)
    setFlow("edit-service")
  }

  const handleBecomeProvider = async () => {
    if (!onBecomeProvider) return
    setConverting(true)
    setConvertError("")
    const result = await onBecomeProvider()
    setConverting(false)
    if (!result.success) {
      setConvertError("No se pudo activar el modo proveedor. Intentá de nuevo.")
    }
  }

  if (role === "client") {
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: "oklch(0.98 0.01 200)" }}>
        <div className="bg-white shadow-sm p-4">
          <h1 className="text-xl font-bold text-primary">Mi servicio</h1>
          <p className="text-sm text-muted-foreground mt-1">Publicá tu negocio en Punto Encuentro</p>
        </div>
        <div className="p-4 space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <AppIcon name="trabajo" className="h-7 w-7" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Convertite en proveedor</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Activá tu perfil comercial para publicar un servicio, recibir reservas y chatear con clientes.
                Usás el mismo correo: un solo servicio por cuenta.
              </p>
              {convertError && <p className="text-sm text-red-600">{convertError}</p>}
              <Button className="w-full h-12 rounded-xl font-bold" onClick={handleBecomeProvider} disabled={converting}>
                {converting ? "Activando..." : "Quiero ofrecer un servicio"}
              </Button>
            </CardContent>
          </Card>
        </div>
        <MainBottomNav
          active="servicio"
          onHome={() => setFlow("home")}
          onMyService={() => setFlow("mi-servicio")}
          onAgenda={() => setFlow("agenda")}
          onProfile={() => setFlow("profile")}
          user={user}
          setFlow={setFlow}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "oklch(0.98 0.01 200)" }}>
      <div className="bg-white shadow-sm p-4">
        <h1 className="text-xl font-bold text-primary">Mi servicio</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestión de tu publicación (1 por cuenta)</p>
      </div>

      <div className="p-4 space-y-4">
        <StoriesLimitPromoBanner />

        {!myService ? (
          <Card className="border-primary/20">
            <CardContent className="p-5 space-y-3 text-center">
              <p className="font-semibold text-gray-900">Todavía no publicaste tu servicio</p>
              <p className="text-sm text-muted-foreground">
                Completá fotos, descripción, ubicación y datos de contacto del servicio. Todo lo comercial vive acá.
              </p>
              <Button className="w-full h-12 rounded-xl font-bold" onClick={() => setFlow("create-service")}>
                <AppIcon name="agregarServicio" className="h-4 w-4 mr-2" />
                Crear mi servicio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex gap-3">
                <img
                  src={myService.image || myService.images?.[0] || "/placeholder.svg"}
                  alt={myService.name}
                  className="h-20 w-20 rounded-xl object-cover bg-gray-100"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 truncate">{myService.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{myService.category}</p>
                  <p className="text-primary font-bold mt-1">${myService.price}</p>
                </div>
              </div>
              <Button className="w-full" onClick={openEdit}>
                Editar servicio
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                Fotos, contacto, ubicación y precio se editan acá y se muestran en tu ficha pública.
              </p>
            </CardContent>
          </Card>
        )}

        {pendingRequests.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-yellow-900">{pendingRequests.length} solicitudes pendientes</p>
                <p className="text-sm text-yellow-800">Revisalas en la agenda</p>
              </div>
              <Button size="sm" onClick={() => setFlow("agenda")}>Ver</Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => setFlow("stories")}>
            <AppIcon name="estadisticas" className="h-5 w-5" />
            <span className="text-xs font-semibold">Historias</span>
          </Button>
          <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => setFlow("statistics")}>
            <AppIcon name="estadisticas" className="h-5 w-5" />
            <span className="text-xs font-semibold">Estadísticas</span>
          </Button>
          <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => setFlow("agenda")}>
            <AppIcon name="agenda" className="h-5 w-5" />
            <span className="text-xs font-semibold">Reservas</span>
          </Button>
          <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={openEdit} disabled={!myService}>
            <AppIcon name="datosPago" className="h-5 w-5" />
            <span className="text-xs font-semibold">Contacto / editar</span>
          </Button>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-gray-900">Mercado Pago</h3>
            <p className="text-xs text-muted-foreground">Conectá tu cuenta para cobrar reservas desde tu servicio.</p>
            <MercadoPagoConnect userId={user?.uid} />
          </CardContent>
        </Card>

        {myService && (
          <ProviderPaymentsPanel
            bookings={providerBookings}
            updateBooking={updateBooking}
            compact
          />
        )}
      </div>

      <MainBottomNav
          active="servicio"
          onHome={() => setFlow("home")}
          onMyService={() => setFlow("mi-servicio")}
          onAgenda={() => setFlow("agenda")}
          onProfile={() => setFlow("profile")}
          user={user}
          setFlow={setFlow}
          zClass="z-40"
        />
    </div>
  )
}

function ProviderDashboard({ setFlow, user, services, logout }: { setFlow: (flow: string) => void; user: any; services: any[]; logout: () => Promise<{ success: boolean }> }) {
  // Compat: el panel viejo redirige a Mi servicio / Inicio unificado.
  useEffect(() => {
    setFlow("mi-servicio")
  }, [setFlow])
  return (
    <MyServiceHub
      role="provider"
      setFlow={setFlow}
      user={user}
      services={services}
      setSelectedProviderService={() => {}}
    />
  )
}

function ProviderProfile({ setFlow, user, logout, onSwitchToClient, services }: { setFlow: (flow: string) => void; user: any; logout: () => Promise<{ success: boolean }>; onSwitchToClient: () => Promise<{ success: boolean }>; services: any[] }) {
  const { position: userPosition } = useGeolocation()
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
    whatsapp: "",
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
  const photoMissing = !hasValidProfilePhoto(profileData.profileImage)

  // Solo forzar edición en onboarding inicial; el tab Perfil siempre abre en vista.
  useEffect(() => {
    if (localStorage.getItem("providerOnboarding") === "1") {
      setIsEditing(true)
    }
  }, [])

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
            whatsapp: data.whatsapp || "",
            instagram: data.instagram || "",
            facebook: data.facebook || "",
            profileImage: hasValidProfilePhoto(data.profileImage)
              ? data.profileImage
              : (hasValidProfilePhoto(user?.photoURL) ? user.photoURL : "/placeholder.svg"),
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
    if (!hasValidProfilePhoto(profileData.profileImage)) {
      alert("La foto de perfil es obligatoria. Subí una imagen para continuar.")
      return
    }
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

        // Actualizar en Firestore (datos personales; no pisar contacto comercial del servicio)
        await setDoc(doc(db, 'users', user.uid), {
          businessName: profileData.businessName,
          displayName: profileData.businessName,
          email: profileData.email,
          phone: profileData.phone,
          address: profileData.address,
          city: profileData.city,
          profileImage: profileData.profileImage,
          updatedAt: new Date()
        }, { merge: true })

        // Mantener el nombre en el servicio canónico
        try {
          await syncCanonicalServiceFromProfile(user.uid, profileData, providerServices)
        } catch (syncError) {
          console.error('Error sincronizando servicio:', syncError)
        }

        setSuccess("¡Perfil actualizado exitosamente!")
        setIsEditing(false)
        const finishingOnboarding = localStorage.getItem("providerOnboarding") === "1"
        if (finishingOnboarding) {
          localStorage.removeItem("providerOnboarding")
          setSuccess("¡Perfil listo! Ahora creá tu servicio.")
          setTimeout(() => setFlow("create-service"), 500)
        } else {
          setTimeout(() => setSuccess(""), 3000)
        }
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
            <Button variant="ghost" size="sm" onClick={() => { if (!photoMissing) setIsEditing(false) }} disabled={photoMissing}>
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
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img src={profileData.profileImage} alt="Profile" className="w-24 h-24 rounded-full border-4 border-white object-cover shadow" />
                  {uploadingImage === 'profile' && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2">
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload('profile', e)} className="hidden" id="profile-upload" />
                    <Button size="sm" variant="secondary" className="w-8 h-8 rounded-full p-0" onClick={(e) => { e.stopPropagation(); document.getElementById('profile-upload')?.click() }} disabled={uploadingImage === 'profile'}>
                      {uploadingImage === 'profile' ? '⏳' : <AppIcon name="camara" className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{profileData.businessName}</h2>
                  <p className="text-muted-foreground">{profileData.email}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Foto de perfil <span className="text-red-500">*</span>
                  </p>
                  {photoMissing && (
                    <p className="text-sm text-red-600 font-medium">La foto de perfil es obligatoria</p>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-semibold pt-2">Datos personales</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Nombre</Label>
                  <Input id="business-name" value={profileData.businessName} onChange={(e) => handleInputChange("businessName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider-email" className="flex items-center gap-2">
                    <AppIcon name="correo" className="h-4 w-4" />
                    Email
                  </Label>
                  <Input id="provider-email" type="email" value={profileData.email} onChange={(e) => handleInputChange("email", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <AppIcon name="telefono" className="h-4 w-4" />
                    Teléfono personal
                  </Label>
                  <Input id="phone" value={profileData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} placeholder="11 1234-5678" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad / Localidad</Label>
                  <Input id="city" value={profileData.city} onChange={(e) => handleInputChange("city", e.target.value)} placeholder="Ej: Carmen de Areco" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <AppIcon name="ubicacion" className="h-4 w-4" />
                    Dirección personal
                  </Label>
                  <Input id="address" value={profileData.address} onChange={(e) => handleInputChange("address", e.target.value)} placeholder="Calle, número" />
                </div>
                <p className="text-xs text-muted-foreground">
                  WhatsApp, redes, Mercado Pago y datos del negocio se gestionan en <button type="button" className="underline font-medium text-primary" onClick={() => setFlow("mi-servicio")}>Mi servicio</button>.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">Cancelar</Button>
                <Button onClick={handleSave} disabled={loading || photoMissing} className="flex-1">
                  {loading
                    ? "Guardando..."
                    : localStorage.getItem("providerOnboarding") === "1"
                      ? "Guardar y continuar"
                      : "Guardar Cambios"}
                </Button>
              </div>
              <Button
                variant="ghost"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
                disabled={loading}
              >
                <AppIcon name="cerrarSesion" className="h-4 w-4 mr-2" />
                {loading ? "Cerrando sesión..." : "Cerrar sesión"}
              </Button>
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
            <button onClick={() => { if (!photoMissing) setFlow("home") }} className="p-2" disabled={photoMissing}>
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
        {photoMissing && (
          <p className="text-sm text-red-600 font-medium mt-2">
            La foto de perfil es obligatoria. Tocá Editar perfil para subirla.
          </p>
        )}
      </div>

      {/* Acciones principales: visibles al abrir Perfil */}
      <div className="px-6 mt-5 space-y-2">
        <Button
          onClick={() => setIsEditing(true)}
          className="w-full h-11 rounded-xl text-white font-semibold"
          style={{ backgroundColor: '#FF7F50' }}
        >
          Editar perfil
        </Button>
        <Button
          variant="ghost"
          className="w-full h-11 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
          disabled={loading}
        >
          <AppIcon name="cerrarSesion" className="h-4 w-4 mr-2" />
          {loading ? "Cerrando sesión..." : "Cerrar sesión"}
        </Button>
      </div>

      <div className="mx-6 mt-4"><HelpLink /></div>

      {/* Info pills */}
      <div className="px-6 mt-6 space-y-3">
        {profileData.email && (
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
              <AppIcon name="correo" className="h-6 w-6" />
            </div>
            <span className="truncate">{profileData.email}</span>
          </div>
        )}
        {profileData.phone && (
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
              <AppIcon name="telefono" className="h-6 w-6" />
            </div>
            <span>{profileData.phone}</span>
          </div>
        )}
        {profileData.address && (
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
              <AppIcon name="ubicacion" className="h-6 w-6" />
            </div>
            <span>{profileData.address}</span>
          </div>
        )}
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

      <div className="px-6 mt-6">
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <button onClick={() => setShowConfirmSwitch(true)} disabled={switchingRole} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden">
                  <AppIcon name="usuarios" className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium text-gray-700">{switchingRole ? "Cambiando..." : "Quiero ser Cliente"}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </button>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Negocio, contacto público y pagos están en Mi servicio.
        </p>
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
      <MainBottomNav
          active="perfil"
          onHome={() => setFlow("home")}
          onMyService={() => setFlow("mi-servicio")}
          onAgenda={() => setFlow("agenda")}
          onProfile={() => setFlow("profile")}
          user={user}
          setFlow={setFlow}
          zClass="z-40"
        />
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
              onClick={() => setFlow("home")}
              className="rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mis Reservas</h1>
              <p className="text-xs text-muted-foreground">Gestiona tus próximos turnos</p>
            </div>
          </div>
          <div className="bg-white p-1 rounded-full shadow-sm border border-gray-100">
            <AppIcon name="agenda" className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <ProviderPaymentsPanel
          bookings={providerBookings}
          updateBooking={updateBooking}
          onChat={(booking) => {
            setActiveChat({
              partnerId: booking.clientId,
              partnerName: booking.clientName || "Cliente",
            })
            setFlow("chat")
          }}
        />

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
                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform overflow-hidden">
                              <AppIcon name="usuarios" className="h-7 w-7" />
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
                                  {isUnpaidBooking(booking) && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={loading}
                                        className="h-8 text-xs font-bold border-amber-300 text-amber-700 rounded-lg px-3"
                                        onClick={async () => {
                                          setLoading(true)
                                          try {
                                            await updateBooking(booking.id, {
                                              paymentRequested: true,
                                              paymentRequestedAt: new Date(),
                                            })
                                          } finally {
                                            setLoading(false)
                                          }
                                        }}
                                      >
                                        Pedir pago
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        disabled={loading}
                                        className="h-8 text-xs font-bold text-emerald-700 rounded-lg px-3"
                                        onClick={async () => {
                                          setLoading(true)
                                          try {
                                            await updateBooking(booking.id, { paymentStatus: 'paid' })
                                          } finally {
                                            setLoading(false)
                                          }
                                        }}
                                      >
                                        Cobrado
                                      </Button>
                                    </>
                                  )}
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
      <MainBottomNav
        active="agenda"
        onHome={() => setFlow("home")}
        onMyService={() => setFlow("mi-servicio")}
        onAgenda={() => setFlow("agenda")}
        onProfile={() => setFlow("profile")}
        user={user}
        setFlow={setFlow}
        zClass="z-40"
      />
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
          <Button variant="ghost" size="sm" onClick={() => setFlow("mi-servicio")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Mi servicio</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Create Service Button: solo si aún no hay uno */}
        {providerServices.length === 0 ? (
          <Button onClick={() => setFlow("create-service")} className="w-full h-12 text-base">
            <AppIcon name="agregarServicio" className="h-5 w-5 mr-2" />
            Crear mi servicio
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground text-center px-2">
            Solo se permite un servicio por correo. Editá el existente o eliminálo para crear otro.
          </p>
        )}

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
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden shadow-sm">
                  <AppIcon name="agregarServicio" className="h-10 w-10" />
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
  userLocation,
  services = [],
}: {
  setFlow: (flow: string) => void
  createService: (serviceData: any) => Promise<{ success: boolean, error?: string }>
  user: any
  userLocation: { lat: number, lng: number } | null
  services?: any[]
}) {
  const existingService = getCanonicalService(services, user?.uid)
  useEffect(() => {
    if (existingService?.id) {
      setFlow("mi-servicio")
    }
  }, [existingService?.id, setFlow])

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    category: "",
    address: "",
    phone: "",
    whatsapp: "",
    instagram: "",
    facebook: "",
    website: "",
  })
  const [gpsCoords, setGpsCoords] = useState<{ lat: number, lng: number } | null>(null)
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [providerProfile, setProviderProfile] = useState<{
    businessName?: string
    displayName?: string
    city?: string
    phone?: string
    whatsapp?: string
    instagram?: string
    facebook?: string
    website?: string
  }>({})

  const { categories } = useCategories()

  const handleImagesSelected = (files: FileList | null) => {
    const selected = Array.from(files || [])
    if (selected.length === 0) return
    if (imageFiles.length + selected.length > 6) {
      setError("Puedes subir hasta 6 imágenes por servicio.")
      return
    }
    const invalidFile = selected.find((file) => !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024)
    if (invalidFile) {
      setError("Cada archivo debe ser una imagen JPG/PNG de hasta 5 MB.")
      return
    }
    setError("")
    setImageFiles((current) => [...current, ...selected])
    setImagePreviews((current) => [...current, ...selected.map((file) => URL.createObjectURL(file))])
  }

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index])
    setImageFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))
    setImagePreviews((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  // Pre-llenar dirección desde el perfil del proveedor
  useEffect(() => {
    const fetchAddressFromProfile = async () => {
      if (!user?.uid) return
      try {
        const { doc, getDoc } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase")
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          let fullAddress = data.address || ""
          if (data.city) {
            fullAddress = fullAddress ? `${fullAddress}, ${data.city}` : data.city
          }
          setProviderProfile({
            businessName: data.businessName,
            displayName: data.displayName || data.name,
            city: data.city || "",
            phone: data.phone || "",
            whatsapp: data.whatsapp || "",
            instagram: data.instagram || "",
            facebook: data.facebook || "",
            website: data.website || "",
          })
          setFormData(prev => ({
            ...prev,
            address: fullAddress,
            phone: prev.phone || data.phone || "",
            whatsapp: prev.whatsapp || data.whatsapp || "",
            instagram: prev.instagram || data.instagram || "",
            facebook: prev.facebook || data.facebook || "",
            website: prev.website || data.website || "",
          }))
        }
      } catch (err) {
        console.error("Error loading provider address:", err)
      }
    }
    fetchAddressFromProfile()
  }, [user])

  // Obtener GPS nativo
  const handleGetGPS = async () => {
    setGpsStatus('loading')
    try {
      let lat: number, lon: number
      if (Capacitor.isNativePlatform()) {
        const permissions = await Geolocation.checkPermissions()
        if (permissions.location !== 'granted') {
          await Geolocation.requestPermissions()
        }
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 })
        lat = pos.coords.latitude
        lon = pos.coords.longitude
      } else {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000 })
        })
        lat = pos.coords.latitude
        lon = pos.coords.longitude
      }
      setGpsCoords({ lat, lng: lon })
      setGpsStatus('success')
    } catch (err) {
      console.error('Error obteniendo GPS:', err)
      setGpsStatus('error')
    }
  }

  // Geocodificar dirección como fallback
  const geocodeAddress = async (address: string): Promise<{ lat: number, lng: number } | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=ar`,
        {
          headers: {
            'Accept-Language': 'es',
            'User-Agent': 'PuntoEncuentroApp/1.0'
          }
        }
      )
      const data = await response.json()
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      }
    } catch (err) {
      console.error("Error geocodificando:", err)
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.address.trim()) {
      setError("La dirección del servicio es obligatoria.")
      setLoading(false)
      return
    }

    const parsedPrice = formData.price.trim()
      ? Number(formData.price.replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0
      : 0
    if (formData.price.trim() && parsedPrice < 0) {
      setError("El precio no puede ser negativo.")
      setLoading(false)
      return
    }

    try {
      // Prioridad de coordenadas: 1) GPS capturado, 2) Geocodificación, 3) GPS del dispositivo al login
      let finalLat: number | null = null
      let finalLng: number | null = null

      if (gpsCoords) {
        // El proveedor ya presionó el botón GPS y funcionó
        finalLat = gpsCoords.lat
        finalLng = gpsCoords.lng
      } else {
        // Intentar geocodificar la dirección escrita
        const geocoded = await geocodeAddress(formData.address)
        if (geocoded) {
          finalLat = geocoded.lat
          finalLng = geocoded.lng
        } else if (userLocation) {
          // Último recurso: usar GPS del login
          finalLat = userLocation.lat
          finalLng = userLocation.lng
        }
        // Si no hay coordenadas de ningún lado, el servicio se crea igual solo con dirección de texto
      }

      const businessName = providerProfile.businessName || providerProfile.displayName || user?.displayName || ""
      const serviceData: any = {
        name: formData.name,
        description: formData.description,
        price: parsedPrice,
        duration: formData.duration.trim(),
        category: formData.category,
        address: formData.address,
        city: providerProfile.city || "",
        phone: formData.phone.trim(),
        whatsapp: formData.whatsapp.trim(),
        instagram: formData.instagram.trim(),
        facebook: formData.facebook.trim(),
        website: formData.website.trim(),
        providerId: user?.uid,
        providerName: businessName || "Proveedor",
        businessName,
        rating: 0,
        reviews: 0,
        image: "",
        lat: finalLat,
        lng: finalLng,
        latitude: finalLat,
        longitude: finalLng,
        active: true
      }

      // Subir galería si fue seleccionada
      if (imageFiles.length > 0) {
        try {
          const uid = auth.currentUser?.uid
          if (!uid || uid !== user?.uid) {
            throw new Error("No se pudo validar tu sesión para subir fotos. Volvé a iniciar sesión.")
          }
          const { uploadImage } = await import("@/lib/uploadImage")
          const imageUrls = await Promise.all(
            imageFiles.map((file, index) => uploadImage(file, `services/${uid}/${Date.now()}-${index}`))
          )
          serviceData.images = imageUrls
          serviceData.image = imageUrls[0]
        } catch (imgErr: any) {
          setError(imgErr.message || "Error al subir la imagen")
          setLoading(false)
          return
        }
      }
      const result = await createService(serviceData)
      if (result.success) {
        setSuccess("¡Servicio creado exitosamente!")
        setTimeout(() => {
          setFlow("mi-servicio")
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
          <Button variant="ghost" size="sm" onClick={() => setFlow("mi-servicio")}>
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
              {/* Galería del servicio */}
              <div className="space-y-2">
                <Label>Imágenes del servicio <span className="font-normal text-muted-foreground">(hasta 6)</span></Label>
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={preview} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img src={preview} alt={`Imagen ${index + 1}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/65 text-white flex items-center justify-center" aria-label="Quitar imagen">
                          <X className="h-4 w-4" />
                        </button>
                        {index === 0 && <span className="absolute bottom-1 left-1 text-[10px] bg-white/90 px-2 py-0.5 rounded-full">Portada</span>}
                      </div>
                    ))}
                  </div>
                )}
                <input type="file" accept="image/*" multiple onChange={(e) => { handleImagesSelected(e.target.files); e.target.value = '' }} className="hidden" id="create-service-image-upload" />
                <Button type="button" variant="outline" className="w-full" disabled={imageFiles.length >= 6} onClick={() => document.getElementById('create-service-image-upload')?.click()}>
                  <Plus className="h-4 w-4 mr-2" /> Agregar imágenes
                </Button>
                <p className="text-xs text-muted-foreground">JPG o PNG, máximo 5 MB cada una. La primera será la portada.</p>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service-price">Precio <span className="font-normal text-muted-foreground">(opcional)</span></Label>
                  <Input
                    id="service-price"
                    placeholder="$5000"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service-duration">Duración <span className="font-normal text-muted-foreground">(opcional)</span></Label>
                  <Input
                    id="service-duration"
                    placeholder="60 min"
                    value={formData.duration}
                    onChange={(e) => handleInputChange("duration", e.target.value)}
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
                        {categorySelectLabel(category.name, category.icon)}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Categorías Agregadas">
                    {categories.filter(c => !c.isBase).map((category) => (
                      <option key={category.id} value={category.name}>
                        {categorySelectLabel(category.name, category.icon)}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Dirección + GPS del servicio */}
              <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/80 p-3">
                <p className="text-sm font-semibold">Contacto del servicio</p>
                <div className="space-y-2">
                  <Label htmlFor="create-svc-phone">Teléfono</Label>
                  <Input id="create-svc-phone" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} placeholder="Ej: 11 2345-6789" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-svc-whatsapp">WhatsApp</Label>
                  <Input id="create-svc-whatsapp" value={formData.whatsapp} onChange={(e) => handleInputChange("whatsapp", e.target.value)} placeholder="Ej: 5491123456789" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-svc-instagram">Instagram</Label>
                  <Input id="create-svc-instagram" value={formData.instagram} onChange={(e) => handleInputChange("instagram", e.target.value)} placeholder="@tu_cuenta" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-svc-facebook">Facebook</Label>
                  <Input id="create-svc-facebook" value={formData.facebook} onChange={(e) => handleInputChange("facebook", e.target.value)} placeholder="facebook.com/tu-pagina" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-svc-website">Sitio web</Label>
                  <Input id="create-svc-website" value={formData.website} onChange={(e) => handleInputChange("website", e.target.value)} placeholder="https://..." />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="service-address">📍 Dirección del servicio</Label>
                <Input
                  id="service-address"
                  placeholder="Ej: Av. Corrientes 1234, Buenos Aires"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  required
                />

                <Button
                  type="button"
                  variant="outline"
                  className={`w-full ${gpsStatus === 'success' ? 'border-green-500 text-green-700 bg-green-50' : gpsStatus === 'error' ? 'border-orange-400 text-orange-600' : ''}`}
                  disabled={gpsStatus === 'loading'}
                  onClick={handleGetGPS}
                >
                  {gpsStatus === 'loading' ? '⏳ Obteniendo ubicación...' :
                   gpsStatus === 'success' ? `✅ GPS capturado (${gpsCoords?.lat.toFixed(4)}, ${gpsCoords?.lng.toFixed(4)})` :
                   gpsStatus === 'error' ? '⚠️ GPS falló — Reintentar' :
                   '📍 Usar mi GPS actual (recomendado)'}
                </Button>

                <p className="text-xs text-muted-foreground">
                  {gpsStatus === 'success'
                    ? "✅ Se usarán las coordenadas GPS para calcular la distancia con los clientes."
                    : gpsStatus === 'error'
                    ? "No pudimos obtener tu GPS. Igualmente se intentará calcular con la dirección que escribiste arriba."
                    : "Escribe la dirección y/o presiona el botón de GPS para que los clientes vean qué tan cerca estás."}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Creando..." : "Crear servicio"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setFlow("mi-servicio")} className="flex-1">
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
  userLocation?: { lat: number, lng: number } | null
}) {
  const { updateService: updateServiceHook } = useServices()
  const updateServiceFn = updateService || updateServiceHook

  const [formData, setFormData] = useState({
    name: service?.name || "",
    description: service?.description || "",
    price: service?.price?.toString() || "",
    duration: (service as any)?.duration || "",
    category: service?.category || "",
    address: service?.address || "",
    phone: service?.phone || "",
    whatsapp: service?.whatsapp || "",
    instagram: service?.instagram || "",
    facebook: service?.facebook || "",
    website: service?.website || "",
  })
  const [gpsCoords, setGpsCoords] = useState<{ lat: number, lng: number } | null>(
    service?.latitude && service?.longitude
      ? { lat: service.latitude, lng: service.longitude }
      : null
  )
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    service?.latitude && service?.longitude ? 'success' : 'idle'
  )
  const [existingImages, setExistingImages] = useState<string[]>(
    Array.isArray(service?.images) && service.images.length > 0 ? service.images : service?.image ? [service.image] : []
  )
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const { categories } = useCategories()

  // Completar dirección/contacto desde el perfil si el servicio aún no los tiene
  useEffect(() => {
    const fetchAddressFromProfile = async () => {
      if (!user?.uid) return
      if (service?.address && service?.phone && service?.whatsapp) return
      try {
        const { doc, getDoc } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase")
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          let fullAddress = data.address || ""
          if (data.city) {
            fullAddress = fullAddress ? `${fullAddress}, ${data.city}` : data.city
          }
          setFormData(prev => ({
            ...prev,
            address: prev.address || fullAddress,
            phone: prev.phone || data.phone || "",
            whatsapp: prev.whatsapp || data.whatsapp || "",
            instagram: prev.instagram || data.instagram || "",
            facebook: prev.facebook || data.facebook || "",
            website: prev.website || data.website || "",
          }))
        }
      } catch (err) {
        console.error("Error loading provider address:", err)
      }
    }
    fetchAddressFromProfile()
  }, [user, service])

  // Cargar datos del servicio cuando cambie
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || "",
        description: service.description || "",
        price: service.price?.toString() || "",
        duration: (service as any)?.duration || "",
        category: service.category || "",
        address: service.address || "",
        phone: service.phone || "",
        whatsapp: service.whatsapp || "",
        instagram: service.instagram || "",
        facebook: service.facebook || "",
        website: service.website || "",
      })
      if (service.latitude && service.longitude) {
        setGpsCoords({ lat: service.latitude, lng: service.longitude })
        setGpsStatus('success')
      }
      setExistingImages(Array.isArray(service.images) && service.images.length > 0 ? service.images : service.image ? [service.image] : [])
      setNewImageFiles([])
      setNewImagePreviews([])
    }
  }, [service])

  const handleEditImagesSelected = (files: FileList | null) => {
    const selected = Array.from(files || [])
    if (selected.length === 0) return
    if (existingImages.length + newImageFiles.length + selected.length > 6) {
      setError("Puedes conservar hasta 6 imágenes por servicio.")
      return
    }
    const invalidFile = selected.find((file) => !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024)
    if (invalidFile) {
      setError("Cada archivo debe ser una imagen JPG/PNG de hasta 5 MB.")
      return
    }
    setError("")
    setNewImageFiles((current) => [...current, ...selected])
    setNewImagePreviews((current) => [...current, ...selected.map((file) => URL.createObjectURL(file))])
  }

  // Obtener GPS nativo
  const handleGetGPS = async () => {
    setGpsStatus('loading')
    try {
      let lat: number, lon: number
      if (Capacitor.isNativePlatform()) {
        const permissions = await Geolocation.checkPermissions()
        if (permissions.location !== 'granted') {
          await Geolocation.requestPermissions()
        }
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 })
        lat = pos.coords.latitude
        lon = pos.coords.longitude
      } else {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000 })
        })
        lat = pos.coords.latitude
        lon = pos.coords.longitude
      }
      setGpsCoords({ lat, lng: lon })
      setGpsStatus('success')
    } catch (err) {
      console.error('Error obteniendo GPS:', err)
      setGpsStatus('error')
    }
  }

  // Geocodificar dirección como fallback
  const geocodeAddress = async (address: string): Promise<{ lat: number, lng: number } | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=ar`,
        {
          headers: {
            'Accept-Language': 'es',
            'User-Agent': 'PuntoEncuentroApp/1.0'
          }
        }
      )
      const data = await response.json()
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      }
    } catch (err) {
      console.error("Error geocodificando:", err)
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!service?.id) {
      setError("No se encontró el servicio a editar")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    if (!formData.address.trim()) {
      setError("La dirección del servicio es obligatoria.")
      setLoading(false)
      return
    }

    try {
      // Prioridad: 1) GPS capturado, 2) Geocodificación, 3) coordenadas existentes, 4) GPS login
      let finalLat: number | null = null
      let finalLng: number | null = null

      if (gpsCoords) {
        finalLat = gpsCoords.lat
        finalLng = gpsCoords.lng
      } else {
        const geocoded = await geocodeAddress(formData.address)
        if (geocoded) {
          finalLat = geocoded.lat
          finalLng = geocoded.lng
        } else if (userLocation) {
          finalLat = userLocation.lat
          finalLng = userLocation.lng
        }
      }

      let businessName = service.businessName || service.providerName || ""
      let city = service.city || ""
      try {
        const { doc, getDoc } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase")
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          businessName = data.businessName || data.displayName || data.name || businessName
          city = data.city || city
        }
      } catch (profileErr) {
        console.error("Error loading provider profile for service update:", profileErr)
      }

      const serviceData: any = {
        name: formData.name,
        description: formData.description,
        price: formData.price.trim() ? Number(formData.price.replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0 : 0,
        duration: formData.duration.trim(),
        category: formData.category,
        address: formData.address,
        city,
        phone: formData.phone.trim(),
        whatsapp: formData.whatsapp.trim(),
        instagram: formData.instagram.trim(),
        facebook: formData.facebook.trim(),
        website: formData.website.trim(),
        providerName: businessName || service.providerName || "Proveedor",
        businessName,
        latitude: finalLat,
        longitude: finalLng,
        lat: finalLat,
        lng: finalLng
      }

      // Subir nuevas imágenes y conservar la galería elegida
      if (newImageFiles.length > 0) {
        try {
          const uid = auth.currentUser?.uid
          if (!uid || uid !== service.providerId) {
            throw new Error("Iniciá sesión con la cuenta propietaria del servicio para subir fotos.")
          }
          const { uploadImage } = await import("@/lib/uploadImage")
          const uploadedImages = await Promise.all(
            newImageFiles.map((file, index) => uploadImage(file, `services/${uid}/${Date.now()}-${index}`))
          )
          serviceData.images = [...existingImages, ...uploadedImages]
        } catch (imgErr: any) {
          setError(imgErr.message || "Error al subir la imagen")
          setLoading(false)
          return
        }
      } else {
        serviceData.images = existingImages
      }
      serviceData.image = serviceData.images[0] || ""

      const result = await updateServiceFn(service.id, serviceData)

      if (result.success) {
        setSuccess("¡Servicio actualizado exitosamente!")
        setTimeout(() => {
          setFlow("mi-servicio")
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
          <Button variant="ghost" size="sm" onClick={() => setFlow("mi-servicio")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Editar Servicio</h1>
        </div>
      </div>

      <div className="p-4">
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Galería del servicio */}
              <div className="space-y-2">
                <Label>Imágenes del servicio <span className="font-normal text-muted-foreground">(hasta 6)</span></Label>
                {(existingImages.length > 0 || newImagePreviews.length > 0) && (
                  <div className="grid grid-cols-3 gap-2">
                    {[...existingImages, ...newImagePreviews].map((preview, index) => (
                      <div key={`${preview}-${index}`} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img src={preview} alt={`Imagen ${index + 1}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => {
                          if (index < existingImages.length) {
                            setExistingImages((current) => current.filter((_, itemIndex) => itemIndex !== index))
                          } else {
                            const newIndex = index - existingImages.length
                            URL.revokeObjectURL(newImagePreviews[newIndex])
                            setNewImageFiles((current) => current.filter((_, itemIndex) => itemIndex !== newIndex))
                            setNewImagePreviews((current) => current.filter((_, itemIndex) => itemIndex !== newIndex))
                          }
                        }} className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/65 text-white flex items-center justify-center" aria-label="Quitar imagen">
                          <X className="h-4 w-4" />
                        </button>
                        {index === 0 && <span className="absolute bottom-1 left-1 text-[10px] bg-white/90 px-2 py-0.5 rounded-full">Portada</span>}
                      </div>
                    ))}
                  </div>
                )}
                <input type="file" accept="image/*" multiple onChange={(e) => { handleEditImagesSelected(e.target.files); e.target.value = '' }} className="hidden" id="edit-service-image-upload" />
                <Button type="button" variant="outline" className="w-full" disabled={existingImages.length + newImageFiles.length >= 6} onClick={() => document.getElementById('edit-service-image-upload')?.click()}>
                  <Plus className="h-4 w-4 mr-2" /> Agregar imágenes
                </Button>
                <p className="text-xs text-muted-foreground">La primera imagen será la portada del servicio.</p>
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
                  <Label htmlFor="edit-service-price">Precio <span className="font-normal text-muted-foreground">(opcional)</span></Label>
                  <Input
                    id="edit-service-price"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-service-duration">Duración <span className="font-normal text-muted-foreground">(opcional)</span></Label>
                  <Input
                    id="edit-service-duration"
                    value={formData.duration}
                    onChange={(e) => handleInputChange("duration", e.target.value)}
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
                        {categorySelectLabel(category.name, category.icon)}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Categorías Agregadas">
                    {categories.filter(c => !c.isBase).map((category) => (
                      <option key={category.id} value={category.name}>
                        {categorySelectLabel(category.name, category.icon)}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/80 p-3">
                <p className="text-sm font-semibold">Contacto del servicio</p>
                <div className="space-y-2">
                  <Label htmlFor="edit-svc-phone">Teléfono</Label>
                  <Input id="edit-svc-phone" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} placeholder="Ej: 11 2345-6789" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-svc-whatsapp">WhatsApp</Label>
                  <Input id="edit-svc-whatsapp" value={formData.whatsapp} onChange={(e) => handleInputChange("whatsapp", e.target.value)} placeholder="Ej: 5491123456789" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-svc-instagram">Instagram</Label>
                  <Input id="edit-svc-instagram" value={formData.instagram} onChange={(e) => handleInputChange("instagram", e.target.value)} placeholder="@tu_cuenta" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-svc-facebook">Facebook</Label>
                  <Input id="edit-svc-facebook" value={formData.facebook} onChange={(e) => handleInputChange("facebook", e.target.value)} placeholder="facebook.com/tu-pagina" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-svc-website">Sitio web</Label>
                  <Input id="edit-svc-website" value={formData.website} onChange={(e) => handleInputChange("website", e.target.value)} placeholder="https://..." />
                </div>
              </div>

              {/* Dirección + GPS del servicio */}
              <div className="space-y-3">
                <Label htmlFor="edit-service-address">📍 Dirección del servicio</Label>
                <Input
                  id="edit-service-address"
                  placeholder="Ej: Av. Corrientes 1234, Buenos Aires"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  required
                />

                <Button
                  type="button"
                  variant="outline"
                  className={`w-full ${gpsStatus === 'success' ? 'border-green-500 text-green-700 bg-green-50' : gpsStatus === 'error' ? 'border-orange-400 text-orange-600' : ''}`}
                  disabled={gpsStatus === 'loading'}
                  onClick={handleGetGPS}
                >
                  {gpsStatus === 'loading' ? '⏳ Obteniendo ubicación...' :
                   gpsStatus === 'success' ? `✅ GPS capturado (${gpsCoords?.lat.toFixed(4)}, ${gpsCoords?.lng.toFixed(4)})` :
                   gpsStatus === 'error' ? '⚠️ GPS falló — Reintentar' :
                   '📍 Usar mi GPS actual (recomendado)'}
                </Button>

                <p className="text-xs text-muted-foreground">
                  {gpsStatus === 'success'
                    ? "✅ Se usarán las coordenadas GPS para calcular la distancia con los clientes."
                    : gpsStatus === 'error'
                    ? "No pudimos obtener tu GPS. Igualmente se intentará calcular con la dirección que escribiste arriba."
                    : "Escribe la dirección y/o presiona el botón de GPS para que los clientes vean qué tan cerca estás."}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar cambios"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setFlow("mi-servicio")} className="flex-1" disabled={loading}>
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
          <AppIcon name="configuracion" className="h-6 w-6" />
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
      <MainBottomNav
          active="none"
          onHome={() => setFlow("home")}
          onMyService={() => setFlow("mi-servicio")}
          onAgenda={() => setFlow("agenda")}
          onProfile={() => setFlow("profile")}
          user={user}
          setFlow={setFlow}
          zClass="z-40"
        />
    </div>
  )
}

function ProviderSubscription({ setFlow }: { setFlow: (flow: string) => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setFlow("home")}>
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
              <p className="text-xl font-serif text-primary">Mateo Yovovich</p>
            </div>

            <Button onClick={() => setFlow("home")} className="w-full mt-4">
              Volver al Panel
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


function NavGlyph({ name, active }: { name: "inicio" | "agenda" | "perfil" | "chat" | "servicio"; active: boolean }) {
  const isChat = name === "chat"
  return (
    <span className="h-9 w-9 overflow-hidden flex items-center justify-center">
      <AppIcon
        name={name === "servicio" ? "trabajo" : name}
        active={active}
        className={isChat ? "h-6 w-6" : "h-9 w-9 scale-[1.55]"}
      />
    </span>
  )
}

function ChatNavButton({ user, setFlow, active = false }: { user: any; setFlow: (flow: any) => void; active?: boolean }) {
  const { totalUnread } = useChatInbox(user?.uid)
  return (
    <button type="button" onClick={() => setFlow('chats')} className="flex flex-col items-center gap-1 relative">
      <div className="relative">
        <NavGlyph name="chat" active={active} />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </div>
      <span className={`text-[11px] font-medium ${active ? 'text-primary' : 'text-gray-400'}`}>Chat</span>
    </button>
  )
}

function MainBottomNav({
  active,
  onHome,
  onMyService,
  onAgenda,
  onProfile,
  user,
  setFlow,
  zClass = "z-40",
}: {
  active: "inicio" | "servicio" | "agenda" | "perfil" | "chat" | "none"
  onHome: () => void
  onMyService?: () => void
  onAgenda: () => void
  onProfile: () => void
  user: any
  setFlow: (flow: any) => void
  zClass?: string
}) {
  const label = (key: typeof active) =>
    `text-[11px] font-medium ${active === key ? "text-primary" : "text-gray-400"}`
  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-3 pb-safe ${zClass}`}>
      <div className="flex justify-around py-2.5">
        <button type="button" onClick={onHome} className="flex flex-col items-center gap-0.5 min-w-0 px-1">
          <NavGlyph name="inicio" active={active === "inicio"} />
          <span className={label("inicio")}>Inicio</span>
        </button>
        {onMyService && (
          <button type="button" onClick={onMyService} className="flex flex-col items-center gap-0.5 min-w-0 px-1">
            <NavGlyph name="servicio" active={active === "servicio"} />
            <span className={`${label("servicio")} truncate max-w-[4.5rem]`}>Mi servicio</span>
          </button>
        )}
        <button type="button" onClick={onAgenda} className="flex flex-col items-center gap-0.5 min-w-0 px-1">
          <NavGlyph name="agenda" active={active === "agenda"} />
          <span className={label("agenda")}>Agenda</span>
        </button>
        <ChatNavButton user={user} setFlow={setFlow} active={active === "chat"} />
        <button type="button" onClick={onProfile} className="flex flex-col items-center gap-0.5 min-w-0 px-1">
          <NavGlyph name="perfil" active={active === "perfil"} />
          <span className={label("perfil")}>Perfil</span>
        </button>
      </div>
    </div>
  )
}

function ChatInboxRow({ chat, onOpen }: { chat: any; onOpen: () => void }) {
  const { online, lastSeen } = usePartnerPresence(chat.partnerId)
  return (
    <button type="button" onClick={onOpen} className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl text-left shadow-sm border border-gray-50">
      <div className="relative w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="font-bold text-primary">{chat.partnerName?.charAt(0)?.toUpperCase() || 'U'}</span>
        <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${online ? 'bg-green-500' : 'bg-gray-300'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-gray-900 truncate">{chat.partnerName}</p>
          <span className="text-[10px] text-gray-400 flex-shrink-0">
            {chat.lastMessageAt.getTime() > 0 ? chat.lastMessageAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 mt-0.5">
          <div className="min-w-0">
            <p className={`text-sm truncate ${chat.unreadCount > 0 ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>{chat.lastMessage}</p>
            <p className={`text-[10px] ${online ? 'text-green-500' : 'text-gray-400'}`}>
              {online ? 'En línea' : lastSeen ? `Últ. vez ${lastSeen.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}` : 'Desconectado'}
            </p>
          </div>
          {chat.unreadCount > 0 && (
            <span className="min-w-6 h-6 px-1.5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function ChatInbox({ user, setFlow, setActiveChat, homeFlow }: { user: any; setFlow: (flow: any) => void; setActiveChat: (chat: any) => void; homeFlow: 'home' | 'dashboard' }) {
  const { chats, totalUnread, loading } = useChatInbox(user?.uid)
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setFlow(homeFlow)}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-xl font-bold">Mensajes</h1>
          <p className="text-xs text-muted-foreground">{totalUnread > 0 ? `${totalUnread} sin leer` : 'Todo al día'}</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="py-16 flex justify-center"><div className="animate-spin w-7 h-7 border-2 border-primary border-t-transparent rounded-full" /></div>
        ) : chats.length > 0 ? chats.map((chat) => (
          <ChatInboxRow key={chat.id} chat={chat} onOpen={() => {
            setActiveChat({ partnerId: chat.partnerId, partnerName: chat.partnerName, from: 'inbox' })
            setFlow('chat')
          }} />
        )) : (
          <div className="text-center py-20 px-6">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 overflow-hidden shadow-sm">
              <AppIcon name="chat" className="h-12 w-12" />
            </div>
            <h2 className="font-semibold">Todavía no hay conversaciones</h2>
            <p className="text-sm text-muted-foreground mt-1">Los mensajes y respuestas a historias aparecerán aquí.</p>
          </div>
        )}
      </div>

      <MainBottomNav
          active="chat"
          onHome={() => setFlow(homeFlow === "dashboard" ? "home" : homeFlow)}
          onMyService={() => setFlow("mi-servicio")}
          onAgenda={() => setFlow("agenda")}
          onProfile={() => setFlow("profile")}
          user={user}
          setFlow={setFlow}
          zClass="z-40"
        />
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
  const [partnerLastReadAt, setPartnerLastReadAt] = useState<Date | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const composerRef = useRef<HTMLDivElement>(null)
  const viewport = useVisibleViewport()
  const { online: partnerOnline, lastSeen: partnerLastSeen } = usePartnerPresence(partnerId)

  const chatId = partnerId ? [user.uid, partnerId].sort().join('_') : null

  useEffect(() => {
    if (!chatId || !user?.uid || !partnerId) return
    void ensureChatDocument({
      sender: user,
      partnerId,
      partnerName,
    })
  }, [chatId, user, partnerId, partnerName])

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
    }, (error) => {
      console.error('Error loading chat messages:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [chatId])

  useEffect(() => {
    if (!chatId || !user?.uid) return
    const unsubscribe = onSnapshot(doc(db, 'chats', chatId), (snapshot) => {
      const value = snapshot.data()?.lastReadAt?.[partnerId]
      setPartnerLastReadAt(value?.toDate ? value.toDate() : value ? new Date(value) : null)
    }, (error) => {
      console.error('Error loading chat meta:', error)
    })
    return unsubscribe
  }, [chatId, partnerId, user?.uid])

  useEffect(() => {
    if (chatId && user?.uid) void markChatRead(chatId, user.uid)
  }, [chatId, user?.uid, messages.length])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, viewport.height, viewport.keyboardInset])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const previousHtml = document.documentElement.style.overflow
    document.body.style.overflow = "hidden"
    document.documentElement.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
      document.documentElement.style.overflow = previousHtml
    }
  }, [])

  const handleComposerFocus = () => {
    window.setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ block: "end" })
      composerRef.current?.scrollIntoView({ block: "nearest" })
    }, 120)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !chatId) return

    const result = await sendChatMessage({
      sender: user,
      partnerId,
      partnerName,
      text: newMessage,
    })
    if (result.success) {
      setNewMessage("")
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-gray-50 overflow-hidden"
      style={
        viewport.keyboardInset > 0
          ? { paddingBottom: viewport.keyboardInset }
          : undefined
      }
    >
      <div className="bg-white shadow-sm p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-bold text-lg">{partnerName}</h2>
            <p className={`text-xs font-medium ${partnerOnline ? 'text-green-500' : 'text-gray-400'}`}>
              {partnerOnline
                ? 'En línea'
                : partnerLastSeen
                  ? `Última vez ${partnerLastSeen.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
                  : 'Desconectado'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
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
                {msg.type === 'story_reply' && msg.story && (
                  <div className={`mb-2 overflow-hidden rounded-xl border ${msg.senderId === user?.uid ? 'border-white/25 bg-white/10' : 'border-gray-100 bg-gray-50'}`}>
                    <div className="flex items-center gap-2 p-2">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                        {msg.story.mediaType === 'video' ? (
                          <video src={msg.story.mediaUrl} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={msg.story.mediaUrl} alt="Historia respondida" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider opacity-70 font-semibold">Respuesta a una historia</p>
                        <p className="text-xs font-semibold truncate">{msg.story.serviceName || msg.story.providerName}</p>
                        {msg.story.caption && <p className="text-[11px] opacity-75 line-clamp-1">{msg.story.caption}</p>}
                      </div>
                    </div>
                  </div>
                )}
                {Array.isArray(msg.imageUrls) && msg.imageUrls.length > 0 && (
                  <div className="mb-2 grid grid-cols-2 gap-1">
                    {msg.imageUrls.map((url: string) => (
                      <img key={url} src={url} alt="Foto adjunta" className="w-full h-24 object-cover rounded-lg" />
                    ))}
                  </div>
                )}
                <p className="text-sm">{msg.text}</p>
                <p className={`text-[10px] mt-1 opacity-70 text-right`}>
                  {msg.createdAt?.toDate ?
                    new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                    "Enviando..."
                  }
                </p>
                {msg.senderId === user?.uid && partnerLastReadAt && msg.createdAt?.toDate && msg.createdAt.toDate().getTime() <= partnerLastReadAt.getTime() && (
                  <p className="text-[10px] mt-0.5 text-right opacity-80 flex items-center justify-end gap-1">
                    <CheckCheck className="h-3 w-3" /> Visto
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div
        ref={composerRef}
        className={`bg-white px-4 pt-3 border-t shrink-0 ${viewport.keyboardInset > 0 ? "pb-3" : "pb-safe"}`}
      >
        <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
          <Input
            ref={inputRef}
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onFocus={handleComposerFocus}
            enterKeyHint="send"
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
