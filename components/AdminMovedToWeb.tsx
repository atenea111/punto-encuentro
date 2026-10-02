"use client"

import { Button } from "@/components/ui/button"
import { ADMIN_WEB_URL } from "@/lib/adminWeb"

export function AdminMovedToWeb({
  logout,
}: {
  logout: () => Promise<{ success: boolean }>
}) {
  const handleLogout = async () => {
    await logout()
    localStorage.removeItem("userType")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 text-center space-y-5">
        <img src="/logonuevo.jpeg" alt="Punto Encuentro" className="w-20 h-20 mx-auto rounded-lg object-cover" />
        <h1 className="text-2xl font-bold text-gray-900">Panel de administración</h1>
        <p className="text-gray-600 text-sm leading-relaxed">
          El panel ya no se usa desde la app. Entrá desde la computadora, en el navegador:
        </p>
        <a
          href={ADMIN_WEB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-primary text-white font-bold rounded-xl py-3 px-4 break-all"
        >
          Abrir panel web
        </a>
        <p className="text-xs text-gray-400 break-all">{ADMIN_WEB_URL}</p>
        <Button variant="ghost" className="w-full text-gray-500" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}
