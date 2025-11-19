import { LayoutWrapper } from "@/components/layout-wrapper"
import { ProfessionalResponsesTable } from "@/components/responses/professional-responses-table"
import { RouteGuard } from "@/components/route-guard"

export default function ResponsesPage() {
  return (
    <RouteGuard permission="responses:read">
      <LayoutWrapper>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProfessionalResponsesTable />
        </div>
      </LayoutWrapper>
    </RouteGuard>
  )
}
