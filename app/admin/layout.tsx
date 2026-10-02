import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Administración | Punto Encuentro",
  description: "Panel de administración de Punto Encuentro",
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children
}
