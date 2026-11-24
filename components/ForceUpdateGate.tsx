"use client"

import { useEffect, useState } from "react"
import { Capacitor } from "@capacitor/core"
import { App } from "@capacitor/app"
import { Button } from "@/components/ui/button"
import { Download, AlertCircle } from "lucide-react"
import type { AppSettings } from "@/hooks/useAppSettings"
import { fetchPublicAndroidMinVersion } from "@/lib/forceUpdateConfig"
import { ANDROID_VERSION_CODE } from "@/lib/appVersion"

export type ForceUpdatePolicy = Pick<
  AppSettings,
  "minAndroidVersionCode" | "forceUpdateMessage" | "forceUpdateBlockAtMinimum"
>

function resolveMinVersion(settingsMin: number, publicMin: number): number {
  return Math.max(Number(settingsMin) || 0, Number(publicMin) || 0)
}

function mustForceUpdate(installedCode: number, min: number, blockAtMinimum: boolean): boolean {
  if (min <= 0 || installedCode <= 0) return false
  if (blockAtMinimum) return installedCode <= min
  return installedCode < min
}

const PLAY_STORE_PACKAGE = "com.encuentro12"
const PLAY_STORE_WEB = `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE}`

export function openPlayStoreUpdate() {
  const marketUrl = `market://details?id=${PLAY_STORE_PACKAGE}`
  if (Capacitor.getPlatform() === "android") {
    window.location.href = marketUrl
    window.setTimeout(() => {
      window.open(PLAY_STORE_WEB, "_system")
    }, 1200)
  } else {
    window.open(PLAY_STORE_WEB, "_blank", "noopener,noreferrer")
  }
}

function parseInstalledVersionCode(build: string, version: string): number {
  const fromBuild = parseInt(String(build).trim(), 10)
  if (!Number.isNaN(fromBuild) && fromBuild > 0) return fromBuild
  const semverMatch = String(version).match(/(\d+)\.(\d+)\.(\d+)/)
  if (semverMatch) {
    const patch = parseInt(semverMatch[3], 10)
    if (!Number.isNaN(patch) && patch > 0) return patch
  }
  return 0
}

export function useForceUpdateRequired(settings: AppSettings, settingsLoading: boolean) {
  const [checking, setChecking] = useState(true)
  const [required, setRequired] = useState(false)
  const [installedBuild, setInstalledBuild] = useState(0)
  const [installedVersion, setInstalledVersion] = useState("")
  const [effectiveMin, setEffectiveMin] = useState(0)

  useEffect(() => {
    if (settingsLoading) return

    // Esta política y su enlace de tienda corresponden solamente a Android.
    // iOS tendrá una política independiente cuando exista su ficha de App Store.
    if (Capacitor.getPlatform() !== "android") {
      setRequired(false)
      setChecking(false)
      return
    }

    let cancelled = false

    const run = async () => {
      const publicMin = await fetchPublicAndroidMinVersion()
      const min = resolveMinVersion(settings.minAndroidVersionCode, publicMin)

      try {
        const info = await App.getInfo()
        if (cancelled) return
        const build = parseInstalledVersionCode(info.build, info.version)
        setInstalledBuild(build)
        setInstalledVersion(info.version || "")
        setEffectiveMin(min)
        setRequired(
          mustForceUpdate(build, min, settings.forceUpdateBlockAtMinimum === true)
        )
      } catch (error) {
        console.error("Error leyendo versión instalada:", error)
        if (!cancelled) {
          setEffectiveMin(min)
          setRequired(false)
        }
      } finally {
        if (!cancelled) setChecking(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [
    settingsLoading,
    settings.minAndroidVersionCode,
    settings.forceUpdateBlockAtMinimum,
  ])

  return { checking, required, installedBuild, installedVersion, effectiveMin, bundledCode: ANDROID_VERSION_CODE }
}

export function ForceUpdateScreen({
  settings,
  installedBuild,
  installedVersion,
  effectiveMin,
}: {
  settings: AppSettings
  installedBuild: number
  installedVersion: string
  effectiveMin: number
}) {
  const min = effectiveMin || Number(settings.minAndroidVersionCode) || 0
  const message =
    settings.forceUpdateMessage?.trim() ||
    "Hay una nueva versión de Punto Encuentro. Actualizá la app para seguir usándola con las últimas mejoras y correcciones."

  return (
    <div className="fixed inset-0 z-[200] bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-sm space-y-6">
        <img
          src="/logonuevo.jpeg"
          alt=""
          className="w-24 h-24 mx-auto rounded-2xl object-cover shadow-md"
        />
        <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100">
          <AlertCircle className="h-10 w-10 text-orange-600 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-gray-900">Actualización obligatoria</h1>
          <p className="text-sm text-gray-700 mt-3 leading-relaxed">{message}</p>
          <p className="text-[11px] text-gray-500 mt-3">
            Tu versión: {installedVersion || "—"} (código {installedBuild || "—"}) · Requerida: {min}+
          </p>
        </div>
        <Button
          className="w-full h-14 text-base font-bold rounded-2xl shadow-lg"
          onClick={openPlayStoreUpdate}
        >
          <Download className="h-5 w-5 mr-2" />
          Actualizar en Google Play
        </Button>
        <p className="text-xs text-muted-foreground">
          Después de instalar la actualización, volvé a abrir la app.
        </p>
      </div>
    </div>
  )
}
