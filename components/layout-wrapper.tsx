"use client"

import type React from "react"
import { useState, useEffect } from "react"

import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { ProtectedRoute } from "./protected-route"
import { CommandPalette } from "./command-palette"
import { CommandPaletteProvider } from "./command-palette-provider"
import { Sheet, SheetContent } from "@/components/ui/sheet"

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Load sidebar state from localStorage
  useEffect(() => {
    setIsClient(true)
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved))
    }
  }, [])

  // Save sidebar state to localStorage
  const handleToggleSidebar = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem("sidebar-collapsed", JSON.stringify(newState))
  }

  return (
    <ProtectedRoute>
      <CommandPaletteProvider>
        {/* Global Command Palette (Cmd+K) */}
        <CommandPalette />

        <div className="flex h-screen overflow-hidden bg-background">
          {/* Desktop Sidebar - Only render on client to prevent hydration mismatch */}
          {isClient && (
            <div className="hidden lg:flex">
              <Sidebar isCollapsed={sidebarCollapsed} onToggleCollapse={handleToggleSidebar} />
            </div>
          )}

          {/* Mobile Sidebar (Sheet/Drawer) */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Main Content */}
          <div
            className={`flex-1 flex flex-col min-w-0 relative ${isClient && !sidebarCollapsed ? "lg:ml-0" : ""}`}
          >
            <Topbar
              onMenuClick={() => setSidebarOpen(true)}
              sidebarCollapsed={sidebarCollapsed}
              onToggleSidebar={handleToggleSidebar}
            />
            <main
              className="flex-1 overflow-auto bg-background"
              role="main"
              aria-label="Main content"
            >
              <div className="min-h-full">{children}</div>
            </main>
          </div>
        </div>
      </CommandPaletteProvider>
    </ProtectedRoute>
  )
}
