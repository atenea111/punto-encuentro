"use client"

import { useEffect, useState } from "react"
import { Capacitor } from "@capacitor/core"

export type VisibleViewport = {
  /** Offset desde el tope del layout viewport (px). */
  top: number
  /** Alto visible real (px). */
  height: number
  /** Padding extra que hay que sumar para no tapar el teclado (px). */
  keyboardInset: number
}

/**
 * Área visible real (sobre el teclado).
 * Si el layout ya se achicó, no restamos el teclado otra vez.
 * Si el WebView es fullscreen y no se achica, usamos el alto del plugin.
 */
export function useVisibleViewport(): VisibleViewport {
  const [frame, setFrame] = useState<VisibleViewport>(() => ({
    top: 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
    keyboardInset: 0,
  }))

  useEffect(() => {
    let keyboardHeight = 0
    let idleLayoutHeight = window.innerHeight
    let cancelled = false
    const handles: Array<{ remove: () => void | Promise<void> }> = []

    const updateFrame = (next: VisibleViewport) => {
      setFrame((current) =>
        current.top === next.top && current.height === next.height && current.keyboardInset === next.keyboardInset
          ? current
          : next,
      )
    }

    const apply = () => {
      if (cancelled) return
      const vv = window.visualViewport
      const layoutHeight = window.innerHeight

      if (keyboardHeight <= 40) {
        idleLayoutHeight = layoutHeight
      }

      const layoutAlreadyShrunk = idleLayoutHeight - layoutHeight > 40
      const vvTop = vv ? Math.round(vv.offsetTop) : 0
      const vvHeight = vv ? Math.round(vv.height) : layoutHeight
      const vvOverlap = vv ? Math.max(0, Math.round(layoutHeight - vvHeight - vvTop)) : 0
      const overlapInset = vvOverlap > 40 ? vvOverlap : 0
      const reportedInset = Math.max(keyboardHeight, overlapInset)

      if (layoutAlreadyShrunk) {
        updateFrame({
          top: 0,
          height: Math.max(120, overlapInset > 40 ? vvHeight : layoutHeight),
          keyboardInset: 0,
        })
        return
      }

      const inset = reportedInset > 40 ? reportedInset : 0
      updateFrame({
        top: 0,
        height: Math.max(120, layoutHeight - inset),
        keyboardInset: inset,
      })
    }

    apply()
    const vv = window.visualViewport
    vv?.addEventListener("resize", apply)
    vv?.addEventListener("scroll", apply)
    window.addEventListener("resize", apply)
    window.addEventListener("orientationchange", apply)

    if (Capacitor.isNativePlatform()) {
      void import("@capacitor/keyboard")
        .then(({ Keyboard }) => {
          if (cancelled) return
          // setScroll controla todo el WebView en iOS, no sólo el teclado.
          // El asistente monta este hook aun cerrado: nunca bloquear la página.
          if (Capacitor.getPlatform() === "ios") {
            void Keyboard.setScroll({ isDisabled: false }).catch(() => undefined)
          }
          const keepHandle = (handle: { remove: () => void | Promise<void> }) => {
            if (cancelled) void handle.remove()
            else handles.push(handle)
          }
          const onShow = (info: { keyboardHeight: number }) => {
            keyboardHeight = Math.round(info.keyboardHeight || 0)
            apply()
          }
          const onHide = () => {
            keyboardHeight = 0
            apply()
          }
          void Keyboard.addListener("keyboardWillShow", onShow).then(keepHandle)
          void Keyboard.addListener("keyboardDidShow", onShow).then(keepHandle)
          void Keyboard.addListener("keyboardWillHide", onHide).then(keepHandle)
          void Keyboard.addListener("keyboardDidHide", onHide).then(keepHandle)
        })
        .catch(() => {
          // Plugin ausente: solo visualViewport
        })
    }

    return () => {
      cancelled = true
      vv?.removeEventListener("resize", apply)
      vv?.removeEventListener("scroll", apply)
      window.removeEventListener("resize", apply)
      window.removeEventListener("orientationchange", apply)
      handles.forEach((h) => {
        try {
          void h.remove()
        } catch {
          // ignore
        }
      })
    }
  }, [])

  return frame
}

/** @deprecated Preferí useVisibleViewport para layouts fullscreen. */
export function useKeyboardInset() {
  return useVisibleViewport().keyboardInset
}
