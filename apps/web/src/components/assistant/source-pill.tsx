"use client"

import { BookOpen } from "lucide-react"
import { type ChatSource } from "@repo/api"
import { Flex } from "antd"
import Link from "next/link"

interface SourcePillProps {
  source: ChatSource
}

export const SourcePill = ({ source }: SourcePillProps) => {
  return (
    <Link href={`/curriculum?docId=${source.id}&page=${source.page}`} className="no-underline">
      <Flex
        align="center"
        gap={6}
        className="px-3 py-1 rounded-full bg-fill-quaternary border border-border text-[10px] font-medium text-text-secondary hover:border-primary/30 hover:bg-fill-tertiary transition-colors cursor-pointer group"
      >
        <BookOpen size={10} className="text-primary/60 dark:text-info group-hover:text-primary" />
        <span>
          {source.source} — p.{source.page}
        </span>
      </Flex>
    </Link>
  )
}
