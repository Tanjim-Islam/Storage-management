"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface CircularLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl"
  thickness?: "thin" | "regular" | "thick"
  label?: string
}

export function CircularLoader({
  size = "md",
  thickness = "regular",
  label = "Loading...",
  className,
  ...props
}: CircularLoaderProps) {
  // Size mapping
  const sizeMap = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  }

  // Thickness mapping
  const thicknessMap = {
    thin: "border-2",
    regular: "border-3",
    thick: "border-4",
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)} {...props}>
      <div
        className={cn(
          "animate-spin rounded-full border-solid border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.5)]",
          sizeMap[size],
          thicknessMap[thickness],
          "border-t-white border-l-white/70"
        )}
        role="status"
        aria-label={label}
      >
        <span className="sr-only">{label}</span>
      </div>
      {label && <p className="text-white font-medium text-lg">{label}</p>}
    </div>
  )
}
