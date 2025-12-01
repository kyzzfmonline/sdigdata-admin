"use client"

import { LayoutWrapper } from "@/components/layout-wrapper"
import { PageHeader } from "@/components/page-header"
import { RouteGuard } from "@/components/route-guard"
import { PartyForm } from "@/components/parties/party-form"

export default function NewPartyPage() {
  return (
    <RouteGuard permissions={["elections:create"]}>
      <LayoutWrapper>
        <PageHeader
          title="Register Political Party"
          description="Add a new political party to the system"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Political Parties", href: "/parties" },
            { label: "New" },
          ]}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PartyForm />
        </div>
      </LayoutWrapper>
    </RouteGuard>
  )
}
