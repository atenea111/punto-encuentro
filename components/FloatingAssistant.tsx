"use client"

import { useState, useEffect, useRef, useMemo } from 'react'
import { 
  Bot, 
  X, 
  User, 
  Calendar, 
  Briefcase, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  MapPin,
  Shield,
  Lightbulb,
  MessageSquare
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface FloatingAssistantProps {
  user: any
  bookings: any[]
  services: any[]
  setFlow: (flow: string) => void
}

export function FloatingAssistant({ user, bookings, services, setFlow }: FloatingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: 'bot' | 'user', content: string | React.ReactNode }>>([])
  const [isTyping, setIsTyping] = useState(false)
  const [dailyTip, setDailyTip] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Autoscroll al final del chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  // Lógica de Saludo Dinámico
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "¡Buenos días!"
    if (hour < 20) return "¡Buenas tardes!"
    return "¡Buenas noches!"
  }

  // Tips Aleatorios según el rol
  const tips = useMemo(() => [
    "Usa fotos luminosas en tus anuncios para atraer más clics.",
    "Responde los chats en menos de 10 minutos para subir en el ranking.",
    "Completa tu perfil al 100% para generar más confianza.",
    "Recuerda que puedes ver la distancia exacta a cada servicio activando tu GPS.",
    "¡Punto Encuentro es mejor si recomiendas a tus proveedores favoritos!"
  ], [])

  useEffect(() => {
    setDailyTip(tips[Math.floor(Math.random() * tips.length)])
  }, [isOpen, tips])

  // Mensaje de bienvenida inicial
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = getGreeting()
      const welcomeMsg = user ? 
        `${greeting} Hola ${user.displayName?.split(' ')[0] || 'amigo'}. Soy PuntoBot y estoy analizando tu actividad en la plataforma...` :
        "¡Hola! Soy PuntoBot. Por favor, inicia sesión para que pueda ayudarte a gestionar tus encuentros y servicios."
      
      setMessages([{ role: 'bot', content: welcomeMsg }])
      
      if (user) {
        setIsTyping(true)
        setTimeout(() => {
          const count = getAppointmentsThisWeek()
          let followUp = `Hoy tenemos ${services.length} servicios activos en tu zona. `
          if (count > 0) {
            followUp += `Veo que tienes ${count} citas esta semana. ¿Quieres que las revisemos?`
          } else {
            followUp += "¿En qué puedo ayudarte hoy?"
          }
          setMessages(prev => [...prev, { role: 'bot', content: followUp }])
          setIsTyping(false)
        }, 1500)
      }
    }
  }, [isOpen, user])

  const getAppointmentsThisWeek = () => {
    const now = new Date()
    const weekFromNow = new Date()
    weekFromNow.setDate(now.getDate() + 7)
    
    return bookings.filter(b => {
      const bDate = b.date instanceof Date ? b.date : new Date(b.date)
      return bDate >= now && bDate <= weekFromNow && (b.status === 'confirmed' || b.status === 'pending')
    }).length
  }

  const handleQuestion = (question: string) => {
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setIsTyping(true)

    // Simular retraso de "procesamiento"
    setTimeout(() => {
      let answer: string | React.ReactNode = ""
      const q = question.toLowerCase()
      
      if (q.includes("nombre") || q.includes("quien soy")) {
        answer = `Según mis registros, eres ${user?.displayName || 'un usuario premium'}. Tu correo vinculado es ${user?.email}.`
      } else if (q.includes("negocio") || q.includes("comercio") || q.includes("mi anuncio")) {
        const myService = services.find(s => s.providerId === user?.uid)
        answer = myService ? 
          `Tu negocio registrado es "${myService.name}". Actualmente tiene una categoría asignada y está visible para los clientes.` : 
          "Aún no tienes un anuncio activo. Como IA, te recomiendo crear uno para empezar a recibir clientes hoy mismo."
      } else if (q.includes("citas") || q.includes("agenda") || q.includes("semana")) {
        const count = getAppointmentsThisWeek()
        if (count > 0) {
          answer = (
            <div className="space-y-2">
              <p>Tienes {count} citas confirmadas para los próximos 7 días.</p>
              <Button size="sm" variant="outline" className="text-[10px] h-7 w-full" onClick={() => setFlow('agenda')}>
                Ver agenda completa
              </Button>
            </div>
          )
        } else {
          answer = "Tu agenda está libre por ahora. Podrías aprovechar para actualizar las fotos de tus servicios o revisar tus precios."
        }
      } else if (q.includes("perfil") || q.includes("cuenta")) {
        answer = "Entendido. Procesando navegación al perfil de usuario..."
        setTimeout(() => {
          setFlow("profile")
          setIsOpen(false)
        }, 1000)
      } else if (q.includes("soporte") || q.includes("ayuda") || q.includes("problema")) {
        answer = "Si tienes un problema técnico, mi equipo humano puede ayudarte en soporte@puntopencuentro.com. Mi prioridad es que tu experiencia sea perfecta."
      } else if (q.includes("que es") || q.includes("punto encuentro")) {
        answer = "Punto Encuentro es una comunidad donde conectamos soluciones con necesidades. Soy la IA encargada de que todo fluya correctamente entre clientes y proveedores."
      } else {
        answer = "No estoy seguro de entender eso, pero puedo informarte sobre tu cuenta, tus citas, o llevarte a cualquier sección de la app si me lo pides."
      }

      setMessages(prev => [...prev, { role: 'bot', content: answer }])
      setIsTyping(false)
    }, 1200)
  }

  const suggestedQuestions = [
    { text: "¿Quién soy?", icon: User, q: "Cual es mi nombre de usuario?" },
    { text: "Citas Semanales", icon: Calendar, q: "Cuantas citas tengo esta semana?" },
    { text: "Mi Negocio", icon: Briefcase, q: "Nombre de mi negocio" },
    { text: "¿Qué es esto?", icon: Shield, q: "Que es Punto Encuentro?" },
  ]

  return (
    <div className="fixed bottom-24 right-5 z-[500] flex flex-col items-end">
      {/* Ventana de Chat */}
      {isOpen && (
        <Card className="mb-4 w-[320px] sm:w-[380px] h-[550px] shadow-2xl border-none bg-white/95 backdrop-blur-md flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-500 rounded-[2.5rem]">
          {/* Header con gradiente */}
          <div className="bg-gradient-to-br from-primary to-indigo-600 p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-inner">
                  <Sparkles className="h-7 w-7 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-xl leading-none flex items-center gap-2">
                    PuntoBot
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
                  </h3>
                  <p className="text-[10px] opacity-80 mt-1 uppercase tracking-[0.2em] font-black">Core Intelligence v1.2</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-white/10 text-white rounded-2xl">
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto space-y-5 bg-gray-50/30">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                {msg.role === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-1 shrink-0">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                )}
                <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20 font-medium' 
                    : 'bg-white shadow-sm border border-gray-100 text-gray-700 rounded-tl-none font-medium'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {/* Tips e IA Sugerencias */}
          <div className="px-5 py-4 bg-white border-t border-gray-100 space-y-4">
            {/* Tip del día */}
            <div className="bg-primary/5 rounded-2xl p-3 flex gap-3 items-center border border-primary/10">
              <div className="p-1.5 bg-white rounded-lg shadow-sm text-primary">
                <Lightbulb className="h-3 w-3" />
              </div>
              <p className="text-[10px] text-primary/80 font-bold italic leading-tight uppercase tracking-tight">
                TIP: {dailyTip}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Comandos IA Sugeridos</p>
              <div className="grid grid-cols-2 gap-2">
                {suggestedQuestions.map((sq, i) => (
                  <button
                    key={i}
                    disabled={isTyping || !user}
                    onClick={() => handleQuestion(sq.q)}
                    className="flex items-center gap-2 p-3 text-[11px] font-bold text-gray-600 bg-gray-50/50 hover:bg-primary/5 hover:text-primary rounded-2xl transition-all border border-gray-100 hover:border-primary/20 text-left disabled:opacity-50 group shadow-sm hover:shadow-md"
                  >
                    <sq.icon className="h-3 w-3 shrink-0 text-gray-400 group-hover:text-primary transition-colors" />
                    <span className="truncate">{sq.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Botón Flotante Estilo IA */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-[2rem] shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 group relative ${
          isOpen ? 'bg-gray-900 rotate-90 scale-90' : 'bg-primary'
        }`}
      >
        <div className="absolute inset-0 bg-white/20 rounded-[2rem] animate-pulse group-hover:animate-ping opacity-0 group-hover:opacity-100 transition-all" />
        {isOpen ? (
          <X className="h-8 w-8 text-white" />
        ) : (
          <div className="relative">
             <Bot className="h-9 w-9 text-white group-hover:rotate-12 transition-transform" />
             <div className="absolute -top-1 -right-1 flex gap-0.5">
               <span className="w-2 h-2 bg-green-400 rounded-full border border-primary shadow-sm" />
               <span className="w-2 h-2 bg-green-400 rounded-full border border-primary animate-ping absolute" />
             </div>
          </div>
        )}
      </button>
    </div>
  )
}
