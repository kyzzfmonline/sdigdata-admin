"use client"

import { LayoutWrapper } from "@/components/layout-wrapper"
import { PageHeader } from "@/components/page-header"
import { RouteGuard } from "@/components/route-guard"
import { ElectionForm } from "@/components/elections/election-form"

export default function NewElectionPage() {
  return (
    <RouteGuard permissions={["elections:create"]}>
      <LayoutWrapper>
        <PageHeader
          title="Create Election"
          description="Set up a new election, poll, survey, or referendum"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Elections", href: "/elections" },
            { label: "New" },
          ]}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ElectionForm />
        </div>
      </LayoutWrapper>
    </RouteGuard>
  )
}
