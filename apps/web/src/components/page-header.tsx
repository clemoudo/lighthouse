"use client"

import { type LucideIcon } from "lucide-react"
import { Flex, Typography } from "antd"
import { cn } from "@/lib/utils"

const { Title, Paragraph } = Typography

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  className?: string
}

export const PageHeader = ({ title, description, icon: Icon, className }: PageHeaderProps) => {
  return (
    <Flex vertical gap={4} className={cn("px-1 mb-6", className)}>
      <Flex align="center" gap={12}>
        {Icon && <Icon className="h-8 w-8 text-primary shrink-0" />}
        <Title level={1} className="m-0! text-2xl! font-bold tracking-tight sm:text-3xl!">
          {title}
        </Title>
      </Flex>
      {description && (
        <Paragraph
          type="secondary"
          className="mb-0! ml-11 max-w-2xl text-sm font-medium leading-normal"
        >
          {description}
        </Paragraph>
      )}
    </Flex>
  )
}
