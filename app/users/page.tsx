import { LayoutWrapper } from "@/components/layout-wrapper"
import { UserManagementTable } from "@/components/user-management-table"
import { RouteGuard } from "@/components/route-guard"
import { PageHeader } from "@/components/page-header"

export default function UsersPage() {
  return (
    <RouteGuard permissions={["users.admin", "users.create", "users.read"]}>
      <LayoutWrapper>
        <PageHeader
          title="Users"
          description="Manage users and their roles"
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Users" }]}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <UserManagementTable />
        </div>
      </LayoutWrapper>
    </RouteGuard>
  )
}
