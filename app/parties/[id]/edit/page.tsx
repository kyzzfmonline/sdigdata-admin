"use client"

import { use } from "react"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { PageHeader } from "@/components/page-header"
import { RouteGuard } from "@/components/route-guard"
import { PartyForm } from "@/components/parties/party-form"
import { useParty } from "@/hooks/parties"
import { Skeleton } from "@/components/ui/skeleton"

interface EditPartyPageProps {
  params: Promise<{ id: string }>
}

export default function EditPartyPage({ params }: EditPartyPageProps) {
  const { id } = use(params)
  const { data: party, isLoading, error } = useParty(id)

  return (
    <RouteGuard permissions={["elections:manage"]}>
      <LayoutWrapper>
        <PageHeader
          title="Edit Political Party"
          description="Update party information and branding"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Political Parties", href: "/parties" },
            { label: party?.name || "...", href: `/parties/${id}` },
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
              <p className="text-destructive">Failed to load party. Please try again.</p>
            </div>
          ) : party ? (
            <PartyForm party={party} />
          ) : null}
        </div>
      </LayoutWrapper>
    </RouteGuard>
  )
}
