"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  Search,
  BookOpen,
  BarChart3,
  Menu,
  MessageSquare,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  LucideIcon,
} from "lucide-react"
import {
  Button,
  Drawer,
  Divider,
  Avatar,
  Dropdown,
  type MenuProps,
  Skeleton,
  Typography,
  Tooltip,
  Flex,
} from "antd"
import { cn } from "@/lib/utils"
import { signOut } from "@/lib/auth-client"
import { useAuth } from "@/contexts/AuthContext"
import { UserRole } from "@/api/generated/model"

import { env } from "@/env"

const { Text, Title } = Typography
const { Avatar: SkeletonAvatar } = Skeleton

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  description: string
  disabled?: boolean
}

const navItems: NavItem[] = [
  {
    name: "Assistant IA",
    href: "/assistant",
    icon: MessageSquare,
    description: "Aide à la planification",
  },
  {
    name: "Recherche",
    href: "/search",
    icon: Search,
    description: "Recherche sémantique",
    disabled: true,
  },
  {
    name: "Référentiel",
    href: "/curriculum",
    icon: BookOpen,
    description: "Programme scolaire",
  },
  {
    name: "Mon Suivi",
    href: "/tracking",
    icon: BarChart3,
    description: "Progression",
    disabled: true,
  },
]

const adminItems = [
  {
    name: "Documents",
    href: "/admin/documents",
    icon: ShieldCheck,
    description: "Gestion du RAG",
  },
  {
    name: "Utilisateurs",
    href: "/admin/users",
    icon: UserIcon,
    description: "Gestion des comptes",
  },
  {
    name: "Consommation",
    href: "/admin/usage",
    icon: BarChart3,
    description: "Suivi des tokens IA",
  },
]

const UserProfile = () => {
  const { user, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isLoading) {
    return (
      <Flex align="center" gap={12} className="p-2">
        <SkeletonAvatar active size="small" shape="circle" />
        <Flex vertical flex={1} gap={4}>
          <div className="h-3 w-20 rounded bg-white/10" />
          <div className="h-2 w-24 rounded bg-white/5" />
        </Flex>
      </Flex>
    )
  }

  if (!user) {
    return (
      <div className="p-2">
        <Link href="/sign-in" className="block w-full">
          <Button
            type="primary"
            block
            className="bg-white/10 hover:bg-white/20 border-white/20 text-white text-xs h-9 flex items-center justify-center gap-2"
          >
            <UserIcon size={14} />
            Connexion / Inscription
          </Button>
        </Link>
      </div>
    )
  }

  const items: MenuProps["items"] = [
    {
      key: "profile",
      label: <Link href="/settings">Mon Profil</Link>,
      icon: <UserIcon size={16} />,
    },
    {
      key: "logout",
      label: "Déconnexion",
      danger: true,
      icon: <LogOut size={16} />,
      onClick: async () => {
        await signOut()
      },
    },
  ]

  return (
    <div className="px-3 py-4">
      <Dropdown menu={{ items }} placement="topRight" trigger={["click"]}>
        <Flex
          align="center"
          gap={12}
          className="cursor-pointer rounded-lg px-3 py-2 transition-colors hover:bg-white/10"
        >
          <Avatar
            src={user.image ?? undefined}
            icon={!user.image && <UserIcon size={18} />}
            className="bg-white/20 shrink-0 border-none"
          />
          <Flex vertical flex={1} className="min-w-0">
            <Text className="truncate text-sm font-medium text-white">{user.name}</Text>
            <Text className="truncate text-[10px] text-white/50">{user.email}</Text>
          </Flex>
        </Flex>
      </Dropdown>
    </div>
  )
}

const NavContent = ({ onNavigate }: { onNavigate?: () => void }) => {
  const pathname = usePathname()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isAdmin = mounted && user?.role === UserRole.admin

  const renderLink = (item: NavItem) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

    const content = (
      <Flex
        align="center"
        gap={12}
        className={cn(
          "rounded-lg px-3 py-3 text-sm font-medium transition-all w-full",
          item.disabled
            ? "opacity-50 cursor-not-allowed text-white/40"
            : isActive
              ? "bg-white/20 text-white"
              : "text-white/80 hover:bg-white/10 hover:text-white",
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        <Flex vertical className="overflow-hidden">
          <span className="truncate">{item.name}</span>
          <span className="text-[11px] font-normal opacity-70 truncate">{item.description}</span>
        </Flex>
      </Flex>
    )

    if (item.disabled) {
      return (
        <Tooltip title="Prochainement disponible" placement="right" key={item.href}>
          {content}
        </Tooltip>
      )
    }

    return (
      <Link key={item.href} href={item.href} onClick={onNavigate} className="block">
        {content}
      </Link>
    )
  }

  return (
    <Flex vertical className="h-full bg-primary">
      {/* Logo */}
      <Flex align="center" gap={12} className="px-4 py-8">
        <Image
          src="/lighthouse-64.png"
          alt="Lighthouse"
          width={44}
          height={44}
          className="shrink-0"
        />
        <Flex vertical>
          <Title level={4} className="m-0! text-white! font-bold!">
            Lighthouse
          </Title>
          <Text className="text-[11px] text-white/60 font-medium uppercase tracking-wider">
            Programme Scolaire
          </Text>
        </Flex>
      </Flex>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(renderLink)}

        {isAdmin && (
          <>
            <div className="px-3 pt-6 pb-2">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                Administration
              </Text>
            </div>
            {adminItems.map(renderLink)}
          </>
        )}
      </nav>

      {/* Footer / User Profile */}
      <Divider className="bg-white/10 m-0" />
      <UserProfile />
      <Text className="pb-3 text-[10px] text-white/30 text-center">
        &copy; Lighthouse - {env.NEXT_PUBLIC_APP_VERSION}
      </Text>
    </Flex>
  )
}

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const isAssistantRoute = pathname === "/assistant" || pathname?.startsWith("/assistant/")

  return (
    <Flex className="h-screen bg-layout overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden h-full w-64 shrink-0 lg:block border-r border-border">
        <NavContent />
      </aside>

      {/* Mobile Header + Content */}
      <Flex vertical flex={1} className="min-w-0 h-full">
        {/* Mobile Header */}
        <header className="flex h-16 items-center gap-4 border-b border-border bg-container px-4 lg:hidden shrink-0">
          <Button
            type="text"
            onClick={() => setOpen(true)}
            aria-label="Menu"
            className="p-2 flex items-center justify-center"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Flex align="center" gap={8}>
            <Image src="/lighthouse-64.png" alt="Lighthouse" width={32} height={32} />
            <span className="font-semibold text-text">Lighthouse</span>
          </Flex>
        </header>

        {/* Mobile Drawer */}
        <Drawer
          placement="left"
          onClose={() => setOpen(false)}
          open={open}
          closable={false}
          styles={{ body: { padding: 0 } }}
          size={256}
        >
          <NavContent onNavigate={() => setOpen(false)} />
        </Drawer>

        {/* Main Content */}
        <main
          className={cn("flex-1 min-w-0 overflow-y-auto flex flex-col", !isAssistantRoute && "p-6")}
        >
          {children}
        </main>
      </Flex>
    </Flex>
  )
}
