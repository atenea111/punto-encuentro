"use client"

import { cn } from "@/lib/utils"

type PuntoBotIconProps = {
  className?: string
  face?: string
}

export function PuntoBotIcon({ className, face = "#ffffff" }: PuntoBotIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <circle cx="32" cy="7.5" r="4.4" fill="currentColor" />
      <rect x="30.2" y="11.2" width="3.6" height="8" rx="1.8" fill="currentColor" />
      <circle cx="32" cy="38" r="21.5" fill="currentColor" />
      <circle cx="32" cy="40" r="17.4" fill="white" fillOpacity="0.12" />
      <circle cx="24.2" cy="35" r="3.7" fill={face} />
      <circle cx="39.8" cy="35" r="3.7" fill={face} />
      <circle cx="25.1" cy="34.2" r="1.1" fill="currentColor" className="opacity-35" />
      <circle cx="40.7" cy="34.2" r="1.1" fill="currentColor" className="opacity-35" />
      <path
        d="M23.4 44.2c3.4 6.2 13.8 6.2 17.2 0"
        stroke={face}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
