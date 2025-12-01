"use client"

import { use } from "react"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { PageHeader } from "@/components/page-header"
import { RouteGuard } from "@/components/route-guard"
import { CandidateForm } from "@/components/candidates/candidate-form"
import { useCandidateProfile } from "@/hooks/candidates"
import { Skeleton } from "@/components/ui/skeleton"

interface EditCandidatePageProps {
  params: Promise<{ id: string }>
}

export default function EditCandidatePage({ params }: EditCandidatePageProps) {
  const { id } = use(params)
  const { data: candidate, isLoading, error } = useCandidateProfile(id)

  return (
    <RouteGuard permissions={["elections:manage"]}>
      <LayoutWrapper>
        <PageHeader
          title="Edit Candidate Profile"
          description="Update candidate information"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Candidates", href: "/candidates" },
            { label: candidate?.name || "...", href: `/candidates/${id}` },
            { label: "Edit" },
          ]}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">Failed to load candidate profile. Please try again.</p>
            </div>
          ) : candidate ? (
            <CandidateForm candidate={candidate} />
          ) : null}
        </div>
      </LayoutWrapper>
    </RouteGuard>
  )
}
