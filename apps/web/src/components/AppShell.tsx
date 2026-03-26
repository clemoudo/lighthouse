"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Search, BookOpen, BarChart3, Menu } from "lucide-react"
import { Button } from "@repo/ui/components/button"
import { cn, Sheet, SheetContent, SheetTrigger } from "@repo/ui"
import { messages } from "@/messages/fr"

const navItems = [
  {
    name: messages.navigation.search.name,
    href: "/recherche",
    icon: Search,
    description: messages.navigation.search.description,
  },
  {
    name: messages.navigation.repository.name,
    href: "/referentiel",
    icon: BookOpen,
    description: messages.navigation.repository.description,
  },
  {
    name: messages.navigation.followUp.name,
    href: "/suivi",
    icon: BarChart3,
    description: messages.navigation.followUp.description,
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
          alt={messages.common.appName}
          width={48}
          height={48}
          className="shrink-0"
        />
        <div>
          <h1 className="text-lg font-semibold text-sidebar-foreground">
            {messages.common.appName}
          </h1>
          <p className="text-xs text-sidebar-foreground/70">{messages.common.appSubtitle}</p>
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
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
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

      {/* Footer */}
      <div className="border-t border-sidebar-border px-4 py-4">
        <p className="text-xs text-sidebar-foreground/60">{messages.common.cycle}</p>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <NavContent />
      </aside>

      {/* Mobile Header + Content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background px-4 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">{messages.navigation.menu}</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 bg-sidebar p-0 text-sidebar-foreground [&>button]:text-sidebar-foreground"
            >
              <NavContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <Image src="/lighthouse.png" alt={messages.common.appName} width={32} height={32} />
            <span className="font-semibold text-foreground">{messages.common.appName}</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
