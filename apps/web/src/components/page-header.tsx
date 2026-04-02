"use client"

import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  className?: string
}

export function PageHeader({ title, description, icon: Icon, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-1 px-1", className)}>
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-8 w-8 text-primary shrink-0" />}
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
      </div>
      {description && (
        <p className="text-sm font-medium text-default-500 max-w-2xl leading-normal ml-11">
          {description}
        </p>
      )}
    </div>
  )
}
