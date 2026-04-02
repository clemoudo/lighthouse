"use client"

import { type LucideIcon } from "lucide-react"
import { type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  subtitle?: string
  description?: string
  icon?: LucideIcon
  className?: string
  children?: ReactNode
}

export function PageHeader({
  title,
  subtitle,
  description,
  icon: Icon,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn("border-b border-default-200 bg-background px-4 py-6 lg:px-8", className)}>
      <div className="mx-auto max-w-4xl">
        {subtitle && (
          <div className="flex items-center gap-2 text-default-500 mb-2">
            {Icon && <Icon className="h-4 w-4" />}
            <span className="text-sm font-medium">{subtitle}</span>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          {description && <p className="text-base text-default-500 max-w-2xl">{description}</p>}
        </div>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  )
}
