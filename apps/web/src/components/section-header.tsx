"use client"

import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { type ReactNode } from "react"

interface SectionHeaderProps {
  title: string
  icon?: LucideIcon
  className?: string
  children?: ReactNode
}

export function SectionHeader({ title, icon: Icon, className, children }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5 text-primary shrink-0" />}
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  )
}
