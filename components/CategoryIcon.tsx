"use client"

import { cn } from "@/lib/utils"
import { getCategoryIconSrc } from "@/lib/categoryIcons"

export function CategoryIcon({
  name,
  icon,
  className,
}: {
  name: string
  icon?: string | null
  className?: string
}) {
  const src = getCategoryIconSrc(name, icon)
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        draggable={false}
        className={cn("object-contain select-none pointer-events-none", className)}
      />
    )
  }

  return (
    <span className={cn("leading-none", className)} aria-hidden>
      {icon && !icon.startsWith("/") ? icon : "📍"}
    </span>
  )
}
