import { useState, useEffect, useCallback } from "react"
import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export type AdminAuditLog = {
  id: string
  adminId: string
  adminEmail?: string
  action: string
  targetType: string
  targetId: string
  details?: string
  createdAt: Date
}

export async function logAdminAction(input: {
  adminId: string
  adminEmail?: string
  action: string
  targetType: string
  targetId: string
  details?: string
}) {
  await addDoc(collection(db, "admin_logs"), {
    ...input,
    createdAt: serverTimestamp(),
  })
}

export function useAdminAudit(max = 100) {
  const [logs, setLogs] = useState<AdminAuditLog[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const q = query(collection(db, "admin_logs"), orderBy("createdAt", "desc"), limit(max))
      const snap = await getDocs(q)
      setLogs(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            adminId: data.adminId || "",
            adminEmail: data.adminEmail,
            action: data.action || "",
            targetType: data.targetType || "",
            targetId: data.targetId || "",
            details: data.details,
            createdAt: data.createdAt?.toDate?.() || new Date(),
          }
        })
      )
    } catch (error) {
      console.error("Error loading admin audit logs:", error)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [max])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { logs, loading, refresh, logAdminAction }
}
