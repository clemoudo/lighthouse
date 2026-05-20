"use client"

import { BookOpen } from "lucide-react"
import { type ChatSource } from "@repo/api"

interface SourcePillProps {
  source: ChatSource
}

export function SourcePill({ source }: SourcePillProps) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-fill-quaternary border border-border text-[10px] font-medium text-text-secondary hover:border-primary/30 hover:bg-fill-tertiary transition-colors cursor-pointer group">
      <BookOpen size={10} className="text-primary/60 group-hover:text-primary" />
      <span>
        {source.source} — p.{source.page}
      </span>
    </div>
  )
}
