"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  ClipboardList,
  BarChart3,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useStore } from "@/lib/store"
import { usePermissions } from "@/lib/permission-context"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"

const adminNavigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview & Analytics",
    badge: null,
  },
  {
    name: "Forms",
    href: "/forms",
    icon: FileText,
    description: "Create & Manage Forms",
    badge: null,
  },
  {
    name: "Responses",
    href: "/responses",
    icon: MessageSquare,
    description: "View Submissions",
    badge: null,
  },
  {
    name: "Users",
    href: "/users",
    icon: Users,
    description: "User Management",
    badge: null,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Advanced Reports",
    badge: "New",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    description: "System Configuration",
    badge: null,
  },
]

const agentNavigation = [
  {
    name: "My Forms",
    href: "/agent",
    icon: ClipboardList,
    description: "Assigned Forms",
    badge: null,
  },
  {
    name: "Submissions",
    href: "/agent/submissions",
    icon: MessageSquare,
    description: "My Responses",
    badge: null,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Preferences",
    badge: null,
  },
]

interface SidebarProps {
  onNavigate?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function Sidebar({ onNavigate, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user } = useStore()
  const { hasRole, hasAdminAccess, roles } = usePermissions()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleNavigation = () => {
    onNavigate?.()
  }

  // Select navigation based on user role
  const navigation = hasRole("agent") ? agentNavigation : adminNavigation
  const panelTitle = hasRole("agent") ? "Field Agent Portal" : "Admin Panel"

  return (
    <motion.aside
      className={cn(
        "bg-sidebar border-r border-sidebar-border min-h-screen flex flex-col relative transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
      initial={false}
      animate={{ width: isCollapsed ? 64 : 256 }}
    >
      {/* Collapse Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar shadow-md hover:bg-sidebar-accent"
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>

      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <h1 className="text-xl font-bold text-sidebar-foreground">SDIGdata</h1>
                <p className="text-xs text-sidebar-foreground/70">{panelTitle}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1" role="navigation" aria-label="Main navigation">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const isHovered = hoveredItem === item.href

          return (
            <div key={item.href} className="relative">
              <Link
                href={item.href}
                onClick={handleNavigation}
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium group relative overflow-hidden",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isCollapsed && "justify-center px-2"
                )}
                aria-current={isActive ? "page" : undefined}
                title={isCollapsed ? item.name : undefined}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary-foreground rounded-r"
                    layoutId="activeIndicator"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Icon with animation */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 shrink-0",
                      isActive && "text-sidebar-primary-foreground"
                    )}
                  />
                </motion.div>

                {/* Text content */}
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{item.name}</span>
                        {item.badge && (
                          <Badge
                            variant="secondary"
                            className="ml-2 text-xs px-1.5 py-0.5 h-5 bg-primary/20 text-primary-foreground border-0"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-sidebar-foreground/60 truncate mt-0.5">
                        {item.description}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hover effect */}
                <motion.div
                  className="absolute inset-0 bg-sidebar-accent/50 rounded-lg"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: isHovered ? 1 : 0,
                    opacity: isHovered ? 1 : 0,
                  }}
                  transition={{ duration: 0.15 }}
                />
              </Link>

              {/* Tooltip for collapsed state */}
              <AnimatePresence>
                {isCollapsed && isHovered && (
                  <motion.div
                    initial={{ opacity: 0, x: 10, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-full ml-2 z-50"
                  >
                    <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 min-w-max">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <div
          className={cn(
            "px-3 py-3 rounded-lg bg-sidebar-accent/50 transition-all duration-200",
            isCollapsed ? "px-2" : ""
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-primary">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 min-w-0 overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-sidebar-foreground truncate">
                        {user?.username}
                      </p>
                      <p className="text-xs text-sidebar-foreground/70 truncate">{user?.email}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 text-xs border-sidebar-foreground/20 text-sidebar-foreground/90"
                    >
                      {roles.length > 0 ? roles[0].name : user?.role}
                    </Badge>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <motion.button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 text-sm font-medium group",
            isCollapsed && "justify-center px-2"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          aria-label="Logout"
        >
          <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
            <LogOut className="w-5 h-5 shrink-0" />
          </motion.div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  )
}
