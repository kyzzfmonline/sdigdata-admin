"use client"

import Link from "next/link"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { motion } from "framer-motion"
import { usePermissions } from "@/lib/permission-context"
import { RouteGuard } from "@/components/route-guard"
import { PartiesTable } from "@/components/parties/parties-table"

export default function PartiesPage() {
  const { hasPermission } = usePermissions()

  return (
    <RouteGuard permissions={["elections:read", "elections:create", "elections:manage"]}>
      <LayoutWrapper>
        <PageHeader
          title="Political Parties"
          description="Manage political parties, their branding, and candidate affiliations"
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Political Parties" }]}
          action={
            hasPermission("elections:create") && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/parties/new">
                  <Button className="gap-2 shadow-lg hover:shadow-xl transition-all duration-300">
                    <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
                      <Plus className="h-4 w-4" />
                    </motion.div>
                    Register Party
                  </Button>
                </Link>
              </motion.div>
            )
          }
        />
        <motion.div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <PartiesTable />
        </motion.div>
      </LayoutWrapper>
    </RouteGuard>
  )
}
