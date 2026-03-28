"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Search, BookOpen, BarChart3, Menu } from "lucide-react"
import { Button, Drawer } from "@heroui/react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    name: "Recherche",
    href: "/recherche",
    icon: Search,
    description: "Recherche sémantique",
  },
  {
    name: "Référentiel",
    href: "/referentiel",
    icon: BookOpen,
    description: "Programme scolaire",
  },
  {
    name: "Mon Suivi",
    href: "/suivi",
    icon: BarChart3,
    description: "Progression",
  },
]

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6">
        <Image
          src="/lighthouse.png"
          alt="Lighthouse"
          width={48}
          height={48}
          className="shrink-0"
        />
        <div>
          <h1 className="text-lg font-semibold text-white">
            Lighthouse
          </h1>
          <p className="text-xs text-white/70">
            Programme Scolaire
          </p>
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
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <div className="flex flex-col">
                <span>{item.name}</span>
                <span className="text-xs font-normal opacity-70">
                  {item.description}
                </span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/20 px-4 py-4">
        <p className="text-xs text-white/60">
          Maternelle - Cycle 1
        </p>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-default-50">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 bg-primary lg:block" style={{ background: "oklch(0.35 0.12 240)" }}>
        <NavContent />
      </aside>

      {/* Mobile Header + Content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-default-200 bg-background px-4 lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onPress={() => setOpen(true)}
            aria-label="Menu"
            className="p-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Image
              src="/lighthouse.png"
              alt="Lighthouse"
              width={32}
              height={32}
            />
            <span className="font-semibold text-foreground">Lighthouse</span>
          </div>
        </header>

        {/* Mobile Drawer */}
        <Drawer>
          <Drawer.Backdrop isOpen={open} onOpenChange={setOpen}>
            <Drawer.Content placement="left" className="w-64 max-w-[80vw]">
              <Drawer.Dialog className="h-full border-none shadow-none" style={{ background: "oklch(0.35 0.12 240)" }}>
                <Drawer.Header className="sr-only">
                  <Drawer.Heading>Navigation</Drawer.Heading>
                </Drawer.Header>
                <Drawer.Body className="p-0 overflow-hidden">
                  <NavContent onNavigate={() => setOpen(false)} />
                </Drawer.Body>
              </Drawer.Dialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer>

        {/* Main Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
