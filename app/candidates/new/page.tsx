"use client"

import { LayoutWrapper } from "@/components/layout-wrapper"
import { PageHeader } from "@/components/page-header"
import { RouteGuard } from "@/components/route-guard"
import { CandidateForm } from "@/components/candidates/candidate-form"

export default function NewCandidatePage() {
  return (
    <RouteGuard permissions={["elections:create"]}>
      <LayoutWrapper>
        <PageHeader
          title="Add Candidate Profile"
          description="Create a new candidate profile for elections"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Candidates", href: "/candidates" },
            { label: "New" },
          ]}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CandidateForm />
        </div>
      </LayoutWrapper>
    </RouteGuard>
  )
}
