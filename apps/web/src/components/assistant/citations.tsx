"use client"

import { Flex } from "antd"
import { SourcePill } from "./source-pill"
import { type ChatSource } from "@repo/api"

interface CitationsProps {
  sources?: ChatSource[]
}

export const Citations = ({ sources }: CitationsProps) => {
  if (!sources || sources.length === 0) return null

  return (
    <Flex wrap="wrap" gap={8} className="mt-1 px-1">
      {sources.map((source, sIdx) => (
        <SourcePill key={`${source.id}-${sIdx}`} source={source} />
      ))}
    </Flex>
  )
}
