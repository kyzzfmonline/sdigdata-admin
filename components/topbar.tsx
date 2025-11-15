"use client"

import { useStore } from "@/lib/store"
import { usePermissions } from "@/lib/permission-context"
import { Bell, User, Menu, Search, PanelLeftClose, PanelLeftOpen, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Breadcrumbs } from "@/components/breadcrumbs"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationCenter } from "@/components/notification-center"
import { usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface TopbarProps {
  onMenuClick?: () => void
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
}

export function Topbar({ onMenuClick, sidebarCollapsed, onToggleSidebar }: TopbarProps) {
  const { user, logout } = useStore()
  const { roles } = usePermissions()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="bg-card border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-40 shadow-sm relative">
      {/* Subtle kente accent stripe at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FDB927]/30 via-[#006B3F]/30 to-[#CE1126]/30" />
      {/* Left: Desktop Sidebar Toggle + Mobile Menu + Breadcrumbs */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Desktop Sidebar Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </Button>

        {/* Mobile Menu */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Back Button - show on pages other than dashboard */}
        {pathname !== "/dashboard" && (
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}

        {/* Breadcrumbs */}
        <div className="hidden sm:flex min-w-0">
          <Breadcrumbs />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Search Button - triggers command palette */}
        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex items-center gap-2 text-muted-foreground"
          onClick={() => {
            // Trigger command palette - will be handled by useCommandPalette hook
            const event = new KeyboardEvent("keydown", {
              key: "k",
              metaKey: true,
              bubbles: true,
            })
            document.dispatchEvent(event)
          }}
        >
          <Search className="w-4 h-4" />
          <span className="text-xs">Search</span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Notifications */}
        <NotificationCenter />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="w-5 h-5" />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.username}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                <Badge
                  variant="outline"
                  className="w-fit mt-1 text-xs bg-gradient-to-r from-[#FDB927]/10 to-[#006B3F]/10 border-[#FDB927]/30"
                >
                  {roles.length > 0 ? roles[0].name : user?.role}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/dashboard")}>Dashboard</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
