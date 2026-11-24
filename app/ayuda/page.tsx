"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SupportCenter } from "@/components/SupportCenter"
import { useAuth } from "@/hooks/useAuth"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { clearPendingPush, supportPushUrl } from "@/lib/pushNotifications"

function HelpContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [openCount, setOpenCount] = useState(0)
  const requestedId = useSearchParams().get("consulta")
  const ticketId = user && requestedId && /^[A-Za-z0-9]{20}$/.test(requestedId) ? requestedId : undefined

  usePushNotifications(user?.uid, payload => {
    if (payload.type !== "support_reply") {
      window.location.assign("/")
      return
    }
    clearPendingPush()
    const href = supportPushUrl(payload, user?.uid)
    if (href) {
      router.replace(href)
      setOpenCount(count => count + 1)
    }
  })

  if (loading) return <p role="status" className="p-5">Cargando ayuda…</p>
  return <SupportCenter key={`${user?.uid ?? "guest"}:${ticketId ?? ""}:${openCount}`} uid={user?.uid} initialTicketId={ticketId} />
}

export default function HelpPage() {
  return <Suspense fallback={<p role="status" className="p-5">Cargando ayuda…</p>}><HelpContent /></Suspense>
}
