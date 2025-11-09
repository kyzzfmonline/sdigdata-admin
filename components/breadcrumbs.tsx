"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"

export function Breadcrumbs() {
  const pathname = usePathname()

  // Split pathname into segments
  const segments = pathname.split("/").filter(Boolean)

  // Create breadcrumb items
  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/")
    const isLast = index === segments.length - 1

    // Format segment for display
    let label = segment
    if (segment === "forms") label = "Forms"
    else if (segment === "dashboard") label = "Dashboard"
    else if (segment === "settings") label = "Settings"
    else if (segment === "analytics") label = "Analytics"
    else if (segment === "users") label = "Users"
    else if (segment === "responses") label = "Responses"
    else if (segment === "preview") label = "Preview"
    else if (segment === "edit") label = "Edit"
    else if (segment === "assign") label = "Assign"
    else if (segment === "new") label = "New"
    else if (segment === "agent") label = "Agent"
    else if (segment === "submit") label = "Submit"
    // For dynamic segments like [id], keep as is or try to resolve

    return {
      href,
      label,
      isLast,
    }
  })

  if (breadcrumbs.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center space-x-1 text-sm text-muted-foreground"
    >
      <Link href="/dashboard" className="flex items-center hover:text-foreground transition-colors">
        <Home className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Link>

      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.href}>
          <ChevronRight className="h-4 w-4" />
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
