"use client"

import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { type ReactNode } from "react"
import { Flex, Typography } from "antd"

const { Title } = Typography

interface SectionHeaderProps {
  title: string
  icon?: LucideIcon
  className?: string
  iconClassName?: string
  children?: ReactNode
}

export const SectionHeader = ({
  title,
  icon: Icon,
  className,
  iconClassName,
  children,
}: SectionHeaderProps) => {
  return (
    <Flex
      vertical={false}
      align="center"
      justify="space-between"
      gap={16}
      className={cn("flex-col sm:flex-row px-1", className)}
    >
      <Flex align="center" gap={8}>
        {Icon && <Icon className={cn("h-5 w-5 text-primary shrink-0", iconClassName)} />}
        <Title level={3} className="m-0! text-xl! font-bold! text-foreground!">
          {title}
        </Title>
      </Flex>
      {children}
    </Flex>
  )
}
