"use client"

import { useState, type FormEvent } from "react"
import { Capacitor } from "@capacitor/core"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CustomAlert } from "@/components/CustomAlert"
import { GoogleSignInButton } from "@/components/GoogleSignInButton"
import { AdminDashboard } from "@/components/AdminDashboard"
import { AdminMovedToWeb } from "@/components/AdminMovedToWeb"
import { useAuth } from "@/hooks/useAuth"
import { useRoles } from "@/hooks/useRoles"
import { Eye, EyeOff } from "lucide-react"

export default function AdminWebPage() {
  const { user, signIn, signInWithGoogle, logout, loading: authLoading } = useAuth()
  const { isAdmin, loading: rolesLoading } = useRoles()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")

  if (Capacitor.isNativePlatform()) {
    return <AdminMovedToWeb logout={logout} />
  }

  if (authLoading || (user && rolesLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 font-medium">Cargando panel...</p>
      </div>
    )
  }

  if (user && isAdmin) {
    return <AdminDashboard user={user} logout={logout} />
  }

  if (user && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <h1 className="text-xl font-bold">Sin acceso</h1>
            <p className="text-sm text-gray-600">
              Esta cuenta no es de administrador. El panel web es solo para el equipo de Punto Encuentro.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                await logout()
                localStorage.removeItem("userType")
              }}
            >
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError("")
    const result = await signIn(email, password)
    if (!result.success) {
      setError(result.error || "No se pudo iniciar sesión")
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError("")
    const result = await signInWithGoogle("client")
    if (!result.success) {
      setError(result.error || "No se pudo iniciar sesión con Google")
    }
    setGoogleLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <img src="/logonuevo.jpeg" alt="Punto Encuentro" className="w-20 h-20 mx-auto mb-4 rounded-lg object-cover" />
          <h1 className="text-2xl font-bold text-primary">Administración</h1>
          <p className="text-sm text-muted-foreground mt-1">Panel web de Punto Encuentro</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            {error && (
              <CustomAlert type="error" title="Error" message={error} onClose={() => setError("")} />
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading || googleLoading}>
                {loading ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>
            <GoogleSignInButton onClick={handleGoogle} loading={googleLoading} disabled={loading} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
