import { LayoutWrapper } from "@/components/layout-wrapper"
import { ResponsesTable } from "@/components/responses-table"
import { RouteGuard } from "@/components/route-guard"
import { PageHeader } from "@/components/page-header"

export default function ResponsesPage() {
  return (
    <RouteGuard permission="responses:read">
      <LayoutWrapper>
        <PageHeader
          title="Responses"
          description="View and manage form responses"
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Responses" }]}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ResponsesTable />
        </div>
      </LayoutWrapper>
    </RouteGuard>
  )
}
