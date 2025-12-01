"use client"

import { use } from "react"
import Link from "next/link"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { PageHeader } from "@/components/page-header"
import { RouteGuard } from "@/components/route-guard"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { ElectionForm } from "@/components/elections/election-form"
import { useElection } from "@/hooks/elections"

export default function EditElectionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: election, isLoading, error } = useElection(id)

  if (isLoading) {
    return (
      <RouteGuard permissions={["elections:manage"]}>
        <LayoutWrapper>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-[600px]" />
          </div>
        </LayoutWrapper>
      </RouteGuard>
    )
  }

  if (error || !election) {
    return (
      <RouteGuard permissions={["elections:manage"]}>
        <LayoutWrapper>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Election Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The election you're looking for doesn't exist or has been removed.
              </p>
              <Link href="/elections">
                <Button>Back to Elections</Button>
              </Link>
            </div>
          </div>
        </LayoutWrapper>
      </RouteGuard>
    )
  }

  if (election.status !== "draft") {
    return (
      <RouteGuard permissions={["elections:manage"]}>
        <LayoutWrapper>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Cannot Edit Election</h2>
              <p className="text-muted-foreground mb-4">
                Only draft elections can be edited. This election is currently{" "}
                <strong>{election.status}</strong>.
              </p>
              <Link href={`/elections/${id}`}>
                <Button>View Election</Button>
              </Link>
            </div>
          </div>
        </LayoutWrapper>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard permissions={["elections:manage"]}>
      <LayoutWrapper>
        <PageHeader
          title={`Edit: ${election.title}`}
          description="Modify election settings and configuration"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Elections", href: "/elections" },
            { label: election.title, href: `/elections/${id}` },
            { label: "Edit" },
          ]}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ElectionForm election={election} />
        </div>
      </LayoutWrapper>
    </RouteGuard>
  )
}
