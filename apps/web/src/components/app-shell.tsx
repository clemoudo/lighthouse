"use client"

import { useState } from "react"
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
} from "lucide-react"
import { Button, Drawer, Divider, Avatar, Dropdown, type MenuProps, Skeleton } from "antd"
import { cn } from "@/lib/utils"
import { useSession, signOut } from "@/lib/auth-client"

const navItems = [
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
  },
]

function UserProfile() {
  const { data: session, isPending } = useSession()

  if (isPending) {
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
      label: "Mon Profil",
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
            <span className="truncate text-sm font-medium text-white">{session.user.name}</span>
            <span className="truncate text-[10px] text-white/50">{session.user.email}</span>
          </div>
        </div>
      </Dropdown>
    </div>
  )
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6">
        <Image src="/lighthouse.png" alt="Lighthouse" width={48} height={48} className="shrink-0" />
        <div>
          <h1 className="text-lg font-semibold text-white">Lighthouse</h1>
          <p className="text-xs text-white/70">Programme Scolaire</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all",
                isActive
                  ? "bg-white/20 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <div className="flex flex-col">
                <span>{item.name}</span>
                <span className="text-xs font-normal opacity-70">{item.description}</span>
              </div>
            </Link>
          )
        })}
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
    <div className="flex min-h-screen bg-surface-secondary">
      {/* Desktop Sidebar */}
      <aside
        className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block"
        style={{ background: "var(--color-sidebar-bg)" }}
      >
        <NavContent />
      </aside>

      {/* Mobile Header + Content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background px-4 lg:hidden">
          <Button
            type="text"
            onClick={() => setOpen(true)}
            aria-label="Menu"
            className="p-2 flex items-center justify-center"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Image src="/lighthouse.png" alt="Lighthouse" width={32} height={32} />
            <span className="font-semibold text-foreground">Lighthouse</span>
          </div>
        </header>

        {/* Mobile Drawer */}
        <Drawer
          placement="left"
          onClose={() => setOpen(false)}
          open={open}
          closable={false}
          styles={{ body: { padding: 0, background: "var(--color-sidebar-bg)" } }}
          size={256}
        >
          <NavContent onNavigate={() => setOpen(false)} />
        </Drawer>

        {/* Main Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
