"use client"

import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react"
import { X } from "lucide-react"

const DRAG_THRESHOLD = 8
const EDGE = 8
const NAV_CLEARANCE = 120

type Pos = { left: number; bottom: number }

function readPos(key: string): Pos | null {
  try {
    const raw = localStorage.getItem(`pe-float-pos:${key}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Pos
    if (typeof parsed.left !== "number" || typeof parsed.bottom !== "number") return null
    return parsed
  } catch {
    return null
  }
}

function writePos(key: string, pos: Pos) {
  try {
    localStorage.setItem(`pe-float-pos:${key}`, JSON.stringify(pos))
  } catch {
    /* ignore */
  }
}

function isHidden(key: string) {
  try {
    return sessionStorage.getItem(`pe-float-hide:${key}`) === "1"
  } catch {
    return false
  }
}

function writeHidden(key: string) {
  try {
    sessionStorage.setItem(`pe-float-hide:${key}`, "1")
  } catch {
    /* ignore */
  }
}

function clearHidden(key: string) {
  try {
    sessionStorage.removeItem(`pe-float-hide:${key}`)
  } catch {
    /* ignore */
  }
}

function clampPos(left: number, bottom: number, width: number, height: number): Pos {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const maxLeft = Math.max(EDGE, vw - width - EDGE)
  const maxBottom = Math.max(NAV_CLEARANCE, vh - height - EDGE)
  return {
    left: Math.min(maxLeft, Math.max(EDGE, left)),
    bottom: Math.min(maxBottom, Math.max(NAV_CLEARANCE, bottom)),
  }
}

function useDraggableFloat(
  id: string,
  defaultLeft: (vw: number) => number,
  defaultBottom: number,
) {
  const handleRef = useRef<HTMLDivElement>(null)
  const defaultLeftRef = useRef(defaultLeft)
  const defaultBottomRef = useRef(defaultBottom)
  defaultLeftRef.current = defaultLeft
  defaultBottomRef.current = defaultBottom
  const dragRef = useRef<{
    startX: number
    startY: number
    origLeft: number
    origBottom: number
    moved: boolean
  } | null>(null)
  const skipPressRef = useRef(false)
  const [hidden, setHidden] = useState(false)
  const [pos, setPos] = useState<Pos | null>(null)

  const measure = useCallback(() => {
    const rect = handleRef.current?.getBoundingClientRect()
    return {
      width: rect?.width || 64,
      height: rect?.height || 64,
    }
  }, [])

  const applyDefaultPos = useCallback(() => {
    const { width, height } = measure()
    const saved = readPos(id)
    setPos(
      clampPos(
        saved?.left ?? defaultLeftRef.current(window.innerWidth),
        saved?.bottom ?? defaultBottomRef.current,
        width,
        height,
      ),
    )
  }, [id, measure])

  useEffect(() => {
    if (isHidden(id)) {
      setHidden(true)
      return
    }
    applyDefaultPos()
  }, [id, applyDefaultPos])

  useEffect(() => {
    const onResize = () => {
      setPos((current) => {
        if (!current) return current
        const { width, height } = measure()
        const next = clampPos(current.left, current.bottom, width, height)
        writePos(id, next)
        return next
      })
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [id, measure])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("[data-float-dismiss]")) return
    const { width, height } = measure()
    const current = pos ?? clampPos(defaultLeftRef.current(window.innerWidth), defaultBottomRef.current, width, height)
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      origLeft: current.left,
      origBottom: current.bottom,
      moved: false,
    }
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (!drag.moved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
      drag.moved = true
    }
    if (!drag.moved) return
    const { width, height } = measure()
    setPos(clampPos(drag.origLeft + dx, drag.origBottom - dy, width, height))
  }

  const onPointerUp = () => {
    if (skipPressRef.current) {
      skipPressRef.current = false
      dragRef.current = null
      return true
    }
    const drag = dragRef.current
    dragRef.current = null
    if (!drag) return true
    if (drag.moved) {
      setPos((current) => {
        if (current) writePos(id, current)
        return current
      })
      return true
    }
    return false
  }

  const dismiss = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    event.preventDefault()
    skipPressRef.current = true
    writeHidden(id)
    setHidden(true)
  }

  const restore = () => {
    clearHidden(id)
    setHidden(false)
    // Posicionar en el siguiente frame (el handle ya montó).
    requestAnimationFrame(() => applyDefaultPos())
  }

  return {
    handleRef,
    hidden,
    pos,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    dismiss,
    restore,
  }
}

function DismissButton({ onPointerDown }: { onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void }) {
  return (
    <button
      type="button"
      data-float-dismiss
      onPointerDown={onPointerDown}
      aria-label="Ocultar"
      className="absolute -top-1.5 -right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-500 shadow-md border border-gray-200 active:scale-95"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  )
}

function RestoreChip({
  label,
  icon,
  onClick,
  left,
  bottom,
  zIndex,
}: {
  label: string
  icon?: ReactNode
  onClick: () => void
  left: number
  bottom: number
  zIndex: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Mostrar ${label}`}
      className="fixed flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs font-bold uppercase tracking-wide text-primary shadow-lg border border-primary/20 active:scale-95"
      style={{ left, bottom, zIndex }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

type DraggableFloatProps = {
  id: string
  children: ReactNode
  onPress?: () => void
  defaultLeft: (vw: number) => number
  defaultBottom?: number
  zIndex?: number
  /** Texto del chip para volver a mostrar tras cerrar con X */
  restoreLabel?: string
  restoreIcon?: ReactNode
}

export function DraggableFloat({
  id,
  children,
  onPress,
  defaultLeft,
  defaultBottom = NAV_CLEARANCE,
  zIndex = 400,
  restoreLabel = "Mostrar",
  restoreIcon,
}: DraggableFloatProps) {
  const drag = useDraggableFloat(id, defaultLeft, defaultBottom)

  if (drag.hidden) {
    return (
      <RestoreChip
        label={restoreLabel}
        icon={restoreIcon}
        onClick={drag.restore}
        left={EDGE + 8}
        bottom={defaultBottom}
        zIndex={zIndex}
      />
    )
  }

  return (
    <div
      ref={drag.handleRef}
      className="fixed touch-none select-none cursor-grab active:cursor-grabbing"
      style={{
        left: drag.pos?.left ?? EDGE,
        bottom: drag.pos?.bottom ?? defaultBottom,
        zIndex,
        visibility: drag.pos ? "visible" : "hidden",
      }}
      onPointerDown={drag.onPointerDown}
      onPointerMove={drag.onPointerMove}
      onPointerUp={() => {
        if (!drag.onPointerUp()) onPress?.()
      }}
      onPointerCancel={() => {
        drag.onPointerUp()
      }}
    >
      <div className="relative">
        {children}
        <DismissButton onPointerDown={drag.dismiss} />
      </div>
    </div>
  )
}

type DraggableAnchorProps = {
  id: string
  children: ReactNode
  extra?: ReactNode
  onPress?: () => void
  defaultLeft: (vw: number) => number
  defaultBottom?: number
  zIndex?: number
  restoreLabel?: string
  restoreIcon?: ReactNode
}

export function DraggableAnchor({
  id,
  children,
  extra,
  onPress,
  defaultLeft,
  defaultBottom = NAV_CLEARANCE,
  zIndex = 500,
  restoreLabel = "Mostrar",
  restoreIcon,
}: DraggableAnchorProps) {
  const drag = useDraggableFloat(id, defaultLeft, defaultBottom)
  const left = drag.pos?.left ?? 0
  const alignRight = typeof window !== "undefined" ? left > window.innerWidth / 2 : true

  if (drag.hidden) {
    return (
      <RestoreChip
        label={restoreLabel}
        icon={restoreIcon}
        onClick={drag.restore}
        left={typeof window !== "undefined" ? Math.max(EDGE, window.innerWidth - 140) : EDGE}
        bottom={defaultBottom}
        zIndex={zIndex}
      />
    )
  }

  return (
    <div
      className="fixed"
      style={{
        left: drag.pos?.left ?? EDGE,
        bottom: drag.pos?.bottom ?? defaultBottom,
        zIndex,
        visibility: drag.pos ? "visible" : "hidden",
      }}
    >
      {extra ? (
        <div className={`absolute bottom-full mb-4 ${alignRight ? "right-0" : "left-0"}`}>
          {extra}
        </div>
      ) : null}
      <div
        ref={drag.handleRef}
        className="relative touch-none select-none cursor-grab active:cursor-grabbing"
        onPointerDown={drag.onPointerDown}
        onPointerMove={drag.onPointerMove}
        onPointerUp={() => {
          if (!drag.onPointerUp()) onPress?.()
        }}
        onPointerCancel={() => {
          drag.onPointerUp()
        }}
      >
        {children}
        <DismissButton onPointerDown={drag.dismiss} />
      </div>
    </div>
  )
}
