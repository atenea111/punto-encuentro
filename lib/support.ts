import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"

export const topics = [
  { id: "account", label: "Mi cuenta y acceso", questions: [
    ["¿Cómo recupero el acceso?", "Si te registraste con Google, ingresá con la misma cuenta. Si usabas correo y contraseña, verificá que el correo sea el mismo con el que te registraste."],
  ] },
  { id: "service", label: "Mi servicio", questions: [
    ["¿Cómo publico mi servicio?", "Entrá como proveedor y elegí Crear servicio. Completá el rubro, la descripción y la dirección."],
    ["¿Cómo cambio las fotos?", "Entrá en Mi servicio, elegí Editar y actualizá la galería."],
    ["¿Cómo reviso mi ubicación?", "Revisá la dirección en la edición del servicio y usá el botón de GPS para actualizarla."],
    ["¿Qué hago si aparece un error?", "Creá una consulta e indicá qué estabas haciendo y qué mensaje apareció."],
  ] },
  { id: "messages", label: "Mensajes y turnos", questions: [
    ["¿Dónde veo mis turnos?", "Podés ver el estado de tus reservas en Agenda."],
  ] },
  { id: "report", label: "Reportar un problema", questions: [
    ["¿Qué información incluyo?", "Indicá dónde viste el contenido y por qué querés que el equipo lo revise."],
  ] },
  { id: "privacy", label: "Privacidad y mi cuenta", questions: [
    ["¿Cómo consulto sobre mis datos?", "Enviá una consulta al equipo de soporte desde este tema."],
  ] },
  { id: "location", label: "Ubicación y mapa", questions: [
    ["¿Por qué no veo servicios cerca?", "Revisá el permiso de ubicación en los ajustes del teléfono y verificá la ciudad o el radio de búsqueda."],
    ["¿Mi servicio aparece en otro lugar?", "Editá la dirección del servicio y actualizá la ubicación desde el formulario."],
  ] },
  { id: "payments", label: "Pagos y Mercado Pago", questions: [
    ["¿Qué hago si pagué y la reserva sigue pendiente?", "Revisá el estado del pago en Mercado Pago y el de la reserva en Agenda. Si el pago figura aprobado, enviá una consulta con la fecha y la referencia del comprobante. Evitá pagar otra vez mientras se revisa."],
    ["¿Dónde conecto Mercado Pago como proveedor?", "Buscá la opción de Mercado Pago en tu perfil de proveedor."],
  ] },
  { id: "media", label: "Fotos y videos", questions: [
    ["¿Qué hago si una foto de mi servicio no se sube?", "Probá con un JPG o PNG de menos de 5 MiB. Si vuelve a fallar, indicá en la consulta el mensaje que aparece."],
    ["¿Por qué no puedo elegir un archivo?", "Revisá los permisos de fotos y cámara en los ajustes del teléfono."],
  ] },
  { id: "notifications", label: "Notificaciones y recordatorios", questions: [
    ["¿Por qué no me llegan avisos?", "Revisá que Punto Encuentro tenga permiso para enviarte notificaciones en los ajustes del teléfono. Podés consultar tus turnos desde Agenda."],
  ] },
  { id: "search", label: "Búsqueda y favoritos", questions: [
    ["¿Cómo encuentro un servicio?", "Buscá por rubro o por nombre y revisá los filtros si no aparecen los resultados que esperabas."],
    ["¿Dónde encuentro los servicios que guardé?", "Iniciá sesión con la cuenta con la que los guardaste y abrí Favoritos."],
  ] },
  { id: "reviews", label: "Reseñas y calificaciones", questions: [
    ["¿Qué hago si tengo un problema con una reseña?", "Enviá una consulta con el nombre del servicio y la fecha aproximada de la reseña para que soporte pueda ubicarla."],
  ] },
  { id: "technical", label: "Errores de la aplicación", questions: [
    ["¿Qué información le sirve a soporte?", "Indicá la pantalla, qué estabas intentando hacer, el mensaje exacto y si usás la app o el navegador."],
  ] },
] as const

export type Topic = typeof topics[number]["id"]
export const states = { received: "Recibida", reviewing: "En revisión", resolved: "Resuelta" } as const
export type TicketState = keyof typeof states

export type Ticket = {
  id: string
  ownerId: string
  topic: Topic
  subject: string
  status: TicketState
  priority: "normal" | "urgent"
  assignee: string
  updatedAt?: { toMillis(): number } | null
}
export type SupportEntry = {
  id: string
  role: "user" | "support"
  text: string
  createdAt?: { toDate(): Date } | null
}

export const topicName = (id: Topic) => topics.find(topic => topic.id === id)?.label ?? id
export const ticketCode = (id: string) => "PE-" + id.toUpperCase()

export async function createTicket(uid: string, topic: Topic, subject: string, description: string) {
  const ticket = doc(collection(db, "supportTickets"))
  const batch = writeBatch(db)
  batch.set(ticket, {
    ownerId: uid, topic, subject: subject.trim(), status: "received",
    priority: "normal", assignee: "", createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  })
  batch.set(doc(collection(ticket, "messages")), {
    role: "user", text: description.trim(), createdAt: serverTimestamp(),
  })
  await batch.commit()
  return ticket.id
}

export async function sendSupportEntry(id: string, text: string, admin: boolean, internal: boolean) {
  const ticket = doc(db, "supportTickets", id)
  const batch = writeBatch(db)
  batch.set(doc(collection(ticket, internal ? "notes" : "messages")), {
    role: admin ? "support" : "user", text: text.trim(), createdAt: serverTimestamp(),
  })
  if (!internal) batch.update(ticket, { updatedAt: serverTimestamp() })
  if (admin && !internal) {
    batch.set(doc(collection(ticket, "activity")), {
      role: "support", text: "Respuesta registrada", createdAt: serverTimestamp(),
    })
  }
  await batch.commit()
}

export async function updateTicket(id: string, changes: Partial<Pick<Ticket, "status" | "priority" | "assignee">>, detail: string) {
  const ticket = doc(db, "supportTickets", id)
  const batch = writeBatch(db)
  batch.update(ticket, { ...changes, updatedAt: serverTimestamp() })
  batch.set(doc(collection(ticket, "activity")), {
    role: "support", text: detail, createdAt: serverTimestamp(),
  })
  await batch.commit()
}
