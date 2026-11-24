"use client"

import Link from "next/link"
import { useEffect, useState, type FormEvent } from "react"
import { ArrowLeft, Bell, BriefcaseBusiness, ChevronRight, CircleHelp, CreditCard, Flag, Heart, ImageIcon, LockKeyhole, MapPin, MessagesSquare, Smartphone, Star, UserRound } from "lucide-react"
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/firebase"
import { createTicket, sendSupportEntry, states, ticketCode, topicName, topics, updateTicket, type SupportEntry, type Ticket, type Topic } from "@/lib/support"

const icons: Record<Topic, typeof UserRound> = {
  account: UserRound,
  service: BriefcaseBusiness,
  messages: MessagesSquare,
  report: Flag,
  privacy: LockKeyhole,
  location: MapPin,
  payments: CreditCard,
  media: ImageIcon,
  notifications: Bell,
  search: Heart,
  reviews: Star,
  technical: Smartphone,
}
const field = "w-full rounded-xl border border-[#cbdcdc] bg-white px-4 py-3 text-[#153942]"
const panel = "rounded-2xl border border-[#dbe6e6] bg-white p-5"
const button = "bg-[#007d87] text-white hover:bg-[#086873]"
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

export function SupportCenter({ uid, admin = false, initialTicketId }: { uid?: string; admin?: boolean; initialTicketId?: string }) {
  const [view, setView] = useState<"home" | "topic" | "new" | "sent" | "list" | "thread">(initialTicketId ? "thread" : "home")
  const [topic, setTopic] = useState<Topic>("account")
  const [selected, setSelected] = useState(initialTicketId ?? "")
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [topicFilter, setTopicFilter] = useState("all")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [reason, setReason] = useState("Contenido ofensivo")
  const [reply, setReply] = useState("")
  const [internal, setInternal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [readError, setReadError] = useState("")
  const [error, setError] = useState("")
  const ticket = tickets.find(item => item.id === selected)

  useEffect(() => {
    if (!uid) { setTickets([]); setLoading(false); return }
    setTickets([])
    setLoading(true)
    setReadError("")
    const ref = collection(db, "supportTickets")
    return onSnapshot(admin ? ref : query(ref, where("ownerId", "==", uid)), snapshot => {
      setTickets(snapshot.docs.map(item => ({ ...item.data(), id: item.id } as Ticket))
        .sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0)))
      setLoading(false)
    }, () => { setReadError("No pudimos cargar las consultas."); setLoading(false) })
  }, [uid, admin])

  async function save(action: () => Promise<void>) {
    setError("")
    setBusy(true)
    try { await action() }
    catch (failure) { console.error("Soporte", failure); setError("No se pudo guardar el cambio. Volvé a intentar.") }
    finally { setBusy(false) }
  }

  function navigate(next: typeof view) {
    setError("")
    setView(next)
  }

  function openThread(id: string) {
    setSelected(id)
    setReply("")
    setInternal(false)
    navigate("thread")
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!uid || !subject.trim() || (topic !== "report" && !body.trim())) return
    void save(async () => {
      const description = topic === "report" ? [reason, body.trim()].filter(Boolean).join("\n\n") : body
      setSelected(await createTicket(uid, topic, subject, description))
      setSubject("")
      setBody("")
      navigate("sent")
    })
  }

  const currentTopic = topics.find(item => item.id === topic)!
  const title = admin ? ticket?.subject && view === "thread" ? ticket.subject : "Gestión de consultas"
    : { home: "¿En qué te ayudamos?", topic: currentTopic.label, new: "Contanos qué pasó",
      sent: "Recibimos tu consulta", list: "Mis consultas", thread: ticket?.subject ?? "Consulta" }[view]
  const visible = tickets.filter(item => {
    const text = normalize(ticketCode(item.id) + " " + item.subject + " " + topicName(item.topic))
    return (!admin || text.includes(normalize(search)))
      && (topicFilter === "all" || topicFilter === item.topic)
      && (filter === "all" || filter === item.status || (filter === "open" && item.status !== "resolved")
        || (filter === "unassigned" && !item.assignee) || (filter === "urgent" && item.priority === "urgent" && item.status !== "resolved"))
  })

  return <section className={"bg-[#f3f8f7] text-[#153942] " + (admin ? "rounded-2xl" : "mx-auto min-h-screen max-w-xl")}>
    <header className="rounded-t-2xl bg-[#0a3b44] p-5 text-white sm:p-7">
      <div className="flex items-center justify-between gap-4">
        {!admin && (view === "home" ? <Link href="/" className="inline-flex items-center gap-2"><ArrowLeft size={18} /> Punto Encuentro</Link>
          : <button type="button" onClick={() => navigate(view === "thread" ? "list" : "home")} className="inline-flex items-center gap-2"><ArrowLeft size={18} /> Ayuda</button>)}
        {!admin && uid && <button type="button" onClick={() => navigate("list")} className="font-medium text-teal-100">Mis consultas</button>}
        {admin && view === "thread" && <button type="button" onClick={() => { setSelected(""); navigate("list") }} className="inline-flex items-center gap-2"><ArrowLeft size={18} /> Bandeja de consultas</button>}
      </div>
      <h1 className="mt-4 break-words text-3xl font-bold">{title}</h1>
      {!admin && view === "home" && <input aria-label="Buscar tema" className={field + " mt-5"} placeholder="Buscá un tema" value={search} onChange={e => setSearch(e.target.value)} />}
    </header>
    <div className="space-y-5 p-5 sm:p-7">
      {(error || readError) && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{error || readError}</p>}

      {!admin && view === "home" && <>
        <h2 className="font-semibold">Temas de ayuda</h2>
        <div className="divide-y rounded-2xl border bg-white">
          {topics.map(item => {
            const Icon = icons[item.id]
            return normalize(item.label + " " + item.questions.flat().join(" ")).includes(normalize(search)) &&
              <button key={item.id} type="button" className="flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-teal-50"
                onClick={() => { setTopic(item.id); navigate("topic") }}>
                <Icon size={22} /> <span className="flex-1 font-semibold">{item.label}</span><ChevronRight size={18} />
              </button>
          })}
          {!topics.some(item => normalize(item.label + " " + item.questions.flat().join(" ")).includes(normalize(search))) &&
            <p className="p-4 text-sm">No encontramos temas con esa búsqueda.</p>}
        </div>
        <div className="space-y-3 rounded-2xl bg-[#e5f2f1] p-5">
          <h2 className="text-xl font-bold">¿Necesitás hablar con nosotros?</h2>
          <p>Contanos qué pasó y seguí la respuesta desde la app.</p>
          <Button className={button + " w-full"} onClick={() => navigate("new")}>Crear consulta</Button>
        </div>
        <button type="button" className="w-full text-center text-sm text-[#00717b]" onClick={() => { setTopic("account"); navigate("topic") }}>
          ¿No podés ingresar? Ayuda con el acceso
        </button>
      </>}

      {!admin && view === "topic" && <>
        <h2 className="font-semibold">Preguntas frecuentes</h2>
        {currentTopic.questions.map(([question, answer]) => <details key={question} className={panel}>
          <summary className="cursor-pointer font-semibold">{question}</summary><p className="mt-3">{answer}</p>
        </details>)}
        <Button className={button + " w-full"} onClick={() => { if (topic === "report") setSubject("Reporte de contenido"); navigate("new") }}>
          {topic === "report" ? "Crear reporte" : "Crear consulta"}
        </Button>
      </>}

      {!admin && view === "new" && (uid ? <form onSubmit={submit} className={panel + " space-y-4"}>
        <label className="block space-y-1"><span>Tema</span><select className={field} value={topic} onChange={e => setTopic(e.target.value as Topic)}>
          {topics.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select></label>
        <label className="block space-y-1"><span>Asunto</span><input className={field} maxLength={120} required value={subject} onChange={e => setSubject(e.target.value)} /></label>
        {topic === "report" && <fieldset className="space-y-2">
          <legend className="font-semibold">¿Qué ocurrió?</legend>
          {["Contenido ofensivo", "Spam o publicidad engañosa", "Suplantación de identidad", "Otro motivo"].map(value =>
            <label key={value} className="flex items-center gap-2">
              <input type="radio" name="report-reason" checked={reason === value} onChange={() => setReason(value)} />{value}
            </label>)}
        </fieldset>}
        <label className="block space-y-1"><span>{topic === "report" ? "Más información (opcional)" : "Descripción"}</span>
          <textarea className={field} rows={5} maxLength={topic === "report" ? 3900 : 4000} required={topic !== "report"} value={body} onChange={e => setBody(e.target.value)} />
        </label>
        <Button type="submit" disabled={busy || !subject.trim() || (topic !== "report" && !body.trim())} className={button + " w-full"}>
          {topic === "report" ? "Enviar reporte" : "Enviar consulta"}
        </Button>
      </form> : <div className={panel + " space-y-3"}>
        <p>Iniciá sesión para enviar y seguir tus consultas.</p><Link href="/" className="font-semibold underline">Ir a Punto Encuentro</Link>
      </div>)}

      {!admin && view === "sent" && <div className={panel + " space-y-4"}>
        <p>Quedó registrada con este número</p><p className="break-all font-mono font-bold">{ticketCode(selected)}</p>
        <Badge status="received" />
        <Button className={button + " w-full"} onClick={() => openThread(selected)}>Ver mi consulta</Button>
        <Button variant="outline" className="w-full" onClick={() => navigate("home")}>Volver a Ayuda</Button>
      </div>}

      {(view === "list" || (admin && view !== "thread")) && <>
        {admin && <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {([["unassigned", "Sin tomar", tickets.filter(t => !t.assignee && t.status !== "resolved").length], ["reviewing", "En gestión", tickets.filter(t => t.status === "reviewing").length], ["urgent", "Urgentes", tickets.filter(t => t.priority === "urgent" && t.status !== "resolved").length], ["resolved", "Resueltas", tickets.filter(t => t.status === "resolved").length]] as const).map(([value, label, count]) =>
              <button key={value} type="button" className={panel + " text-left hover:border-teal-600"} onClick={() => setFilter(value)}>{label}<b className="block text-2xl">{count}</b></button>)}
          </div>
          <input aria-label="Buscar consulta" className={field} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por consulta o tema" />
          <select aria-label="Filtrar por tema" className={field} value={topicFilter} onChange={e => setTopicFilter(e.target.value)}>
            <option value="all">Todos los temas</option>{topics.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </>}
        <select aria-label="Filtrar por estado" className={field} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">Todas las consultas</option><option value="open">Abiertas</option>
          {Object.entries(states).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          {admin && <><option value="unassigned">Sin asignar</option><option value="urgent">Urgentes</option></>}
        </select>
        {loading ? <p role="status">Cargando consultas…</p> : !visible.length && !readError && <p className={panel}>No hay consultas para mostrar.</p>}
        {visible.map(item => <button key={item.id} type="button" className={panel + " flex w-full items-start gap-3 text-left hover:border-teal-600"} onClick={() => openThread(item.id)}>
          <span className="min-w-0 flex-1"><small className="break-all text-[#506d74]">{ticketCode(item.id)}</small>
            <strong className="block break-words text-lg">{item.subject}</strong><span>{topicName(item.topic)}</span>
            {admin && <small className="mt-1 block break-all">{item.priority === "urgent" ? "Urgente" : "Normal"} · {item.assignee ? item.assignee === uid ? "Asignada a vos" : "Asignada al equipo" : "Sin asignar"}</small>}
          </span><Badge status={item.status} /><ChevronRight size={18} className="mt-1 shrink-0" />
        </button>)}
        {!admin && <Button className={button + " w-full"} onClick={() => navigate("new")}>Nueva consulta</Button>}
      </>}

      {view === "thread" && (ticket ? <>
        <div className="flex flex-wrap items-center gap-3"><code className="break-all text-sm">{ticketCode(ticket.id)}</code><Badge status={ticket.status} />
          <span>{topicName(ticket.topic)}</span></div>
        <div className={"grid gap-5 " + (admin ? "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" : "")}>
          <section className={panel + " min-w-0 space-y-4"}>
            <h2 className="font-bold">{admin ? "Conversación con el usuario" : "Conversación con soporte"}</h2>
            <Entries key={ticket.id + internal} id={ticket.id} group={internal ? "notes" : "messages"} />
            {(admin || ticket.status !== "resolved") && <form className="space-y-3" onSubmit={event => {
              event.preventDefault()
              if (!reply.trim()) return
              void save(async () => { await sendSupportEntry(ticket.id, reply, admin, internal); setReply("") })
            }}>
              {admin && <div className="flex flex-wrap gap-2">
                <Button type="button" variant={internal ? "outline" : "secondary"} disabled={busy} onClick={() => { setInternal(false); setReply("") }}>Respuesta al usuario</Button>
                <Button type="button" variant={internal ? "secondary" : "outline"} disabled={busy} onClick={() => { setInternal(true); setReply("") }}>Nota interna</Button>
              </div>}
              <textarea aria-label={internal ? "Nota interna" : "Respuesta"} placeholder={internal ? "Escribí una nota privada…" : "Escribí tu respuesta…"} className={field} rows={3} maxLength={4000}
                required value={reply} onChange={e => setReply(e.target.value)} />
              <Button type="submit" className={button} disabled={busy || !reply.trim()}>{internal ? "Guardar nota" : "Enviar respuesta"}</Button>
            </form>}
          </section>
          {admin && <aside className={panel + " space-y-4"}>
            <h2 className="font-bold">Seguimiento</h2>
            <p className="break-all text-sm">Cuenta {ticket.ownerId}</p>
            <label className="block space-y-1"><span>Estado</span><select disabled={busy} className={field} value={ticket.status} onChange={e => {
              const status = e.target.value as Ticket["status"]
              void save(() => updateTicket(ticket.id, { status }, "Estado cambiado a " + states[status]))
            }}>{Object.entries(states).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="block space-y-1"><span>Prioridad</span><select disabled={busy} className={field} value={ticket.priority} onChange={e => {
              const priority = e.target.value as Ticket["priority"]
              void save(() => updateTicket(ticket.id, { priority }, priority === "urgent" ? "Prioridad urgente" : "Prioridad normal"))
            }}><option value="normal">Normal</option><option value="urgent">Urgente</option></select></label>
            <p>{ticket.assignee ? ticket.assignee === uid ? "Asignada a vos" : "Asignada al equipo" : "Sin asignar"}</p>
            {uid && <Button disabled={busy} variant="outline" onClick={() => void save(() => updateTicket(ticket.id,
              { assignee: ticket.assignee === uid ? "" : uid }, ticket.assignee === uid ? "Asignación liberada" : "Tomada por el equipo"))}>
              {ticket.assignee === uid ? "Liberar consulta" : "Asignarme consulta"}
            </Button>}
            {ticket.status !== "resolved" && <Button className={button + " w-full"} disabled={busy} onClick={() => void save(() => updateTicket(ticket.id, { status: "resolved" }, "Consulta resuelta"))}>
              Marcar como resuelta
            </Button>}
            <h3 className="border-t pt-3 font-bold">Actividad</h3><p className="text-sm">Consulta creada</p><Entries key={ticket.id} id={ticket.id} group="activity" />
          </aside>}
        </div>
      </> : <p role="status">{readError || loading ? readError || "Cargando consulta…" : "La consulta aún no está disponible."}</p>)}
    </div>
  </section>
}

function Badge({ status }: { status: Ticket["status"] }) {
  const colors = { received: "bg-slate-100 text-slate-700", reviewing: "bg-amber-100 text-amber-900", resolved: "bg-green-100 text-green-900" }
  return <span className={"inline-block shrink-0 rounded-lg px-2 py-1 text-xs font-semibold " + colors[status]}>{states[status]}</span>
}

function Entries({ id, group }: { id: string; group: "messages" | "notes" | "activity" }) {
  const [entries, setEntries] = useState<SupportEntry[]>([])
  const [state, setState] = useState<"loading" | "ready" | "error">("loading")
  useEffect(() => onSnapshot(query(collection(db, "supportTickets", id, group), orderBy("createdAt")), snapshot => {
    setEntries(snapshot.docs.map(item => ({ ...item.data(), id: item.id } as SupportEntry)))
    setState("ready")
  }, () => setState("error")), [id, group])
  if (state === "loading") return <p role="status">Cargando…</p>
  if (state === "error") return <p role="alert">No pudimos cargar este historial.</p>
  if (!entries.length && group !== "activity") return <p className="text-sm text-[#506d74]">Todavía no hay entradas.</p>
  return <ul className="space-y-3">{entries.map(entry => <li key={entry.id} className={
    group === "activity" ? "text-sm" : "rounded-xl p-3 " + (entry.role === "support" ? "bg-[#e5f2f1]" : "bg-[#f1f5f4]")}>
    {group !== "activity" && <b className="text-xs text-[#506d74]">{group === "notes" ? "Nota interna" : entry.role === "support" ? "Soporte Punto Encuentro" : "Usuario"}</b>}
    <p className="whitespace-pre-wrap break-words">{entry.text}</p>
    {entry.createdAt && <time className="text-xs text-[#506d74]">{entry.createdAt.toDate().toLocaleString("es-AR")}</time>}
  </li>)}</ul>
}

export function HelpLink() {
  return <Button asChild variant="outline" className="gap-2"><Link href="/ayuda/"><CircleHelp size={18} /> Ayuda y consultas</Link></Button>
}
