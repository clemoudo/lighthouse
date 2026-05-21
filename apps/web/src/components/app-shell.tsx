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
} from "antd"
import { cn } from "@/lib/utils"
import { useSession, signOut } from "@/lib/auth-client"
import { UserRole } from "@/api/generated/model"

const { Text, Title } = Typography

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
]

function UserProfile() {
  const { data: session, isPending } = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isPending) {
    return (
      <div className="flex items-center gap-3 px-4 py-4">
        <Skeleton.Avatar active size="small" shape="circle" />
        <div className="flex flex-1 flex-col gap-1">
          <div className="h-3 w-20 rounded bg-white/10" />
          <div className="h-2 w-24 rounded bg-white/5" />
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="px-4 py-4">
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
        <div className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/10">
          <Avatar
            src={session.user.image}
            icon={!session.user.image && <UserIcon size={18} />}
            className="bg-white/20 shrink-0 border-none"
          />
          <div className="flex flex-1 flex-col min-w-0">
            <Text className="truncate text-sm font-medium text-white">{session.user.name}</Text>
            <Text className="truncate text-[10px] text-white/50">{session.user.email}</Text>
          </div>
        </div>
      </Dropdown>
    </div>
  )
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isAdmin = mounted && session?.user.role === UserRole.ADMIN

  const renderLink = (item: NavItem) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

    const content = (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all w-full",
          item.disabled
            ? "opacity-50 cursor-not-allowed text-white/40"
            : isActive
              ? "bg-white/20 text-white"
              : "text-white/80 hover:bg-white/10 hover:text-white",
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        <div className="flex flex-col overflow-hidden">
          <span className="truncate">{item.name}</span>
          <span className="text-[11px] font-normal opacity-70 truncate">{item.description}</span>
        </div>
      </div>
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
    <div className="flex h-full flex-col bg-primary">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-8">
        <Image
          src="/lighthouse-64.png"
          alt="Lighthouse"
          width={44}
          height={44}
          className="shrink-0"
        />
        <div className="flex flex-col">
          <Title level={4} className="m-0! text-white! font-bold!">
            Lighthouse
          </Title>
          <Text className="text-[11px] text-white/60 font-medium uppercase tracking-wider">
            Programme Scolaire
          </Text>
        </div>
      </div>

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
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen bg-layout overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden h-full w-64 shrink-0 lg:block border-r border-border">
        <NavContent />
      </aside>

      {/* Mobile Header + Content */}
      <div className="flex flex-1 flex-col min-w-0 h-full">
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
          <div className="flex items-center gap-2">
            <Image src="/lighthouse-64.png" alt="Lighthouse" width={32} height={32} />
            <span className="font-semibold text-text">Lighthouse</span>
          </div>
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
        <main className="flex-1 min-w-0 p-6 overflow-y-auto flex flex-col">{children}</main>
      </div>
    </div>
  )
}
