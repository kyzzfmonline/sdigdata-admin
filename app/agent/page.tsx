"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { PageHeader } from "@/components/page-header"
import { formsAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { FileText, Loader, CheckCircle2 } from "lucide-react"
import type { Form } from "@/lib/types"

export default function AgentDashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [forms, setForms] = useState<Form[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAssignedForms = async () => {
      try {
        const response = await formsAPI.getAssigned()
        setForms(response.data.data)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.detail || "Failed to load assigned forms",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssignedForms()
  }, [toast])

  if (isLoading) {
    return (
      <LayoutWrapper>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-screen">
          <Loader className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper>
      <PageHeader title="My Assigned Forms" description="Forms available for data collection" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {forms.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Forms Assigned</h3>
            <p className="text-muted-foreground">
              You don't have any forms assigned yet. Contact your administrator.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => (
              <Card key={form.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {form.schema?.branding?.logo_url && (
                      <img
                        src={form.schema.branding.logo_url}
                        alt="Form logo"
                        className="h-10 w-10 object-contain"
                      />
                    )}
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  {form.status === "active" && (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2">{form.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {form.schema?.fields?.length || 0} fields • Version {form.version}
                </p>

                {form.schema?.branding?.header_text && (
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                    {form.schema.branding.header_text}
                  </p>
                )}

                <Button className="w-full" onClick={() => router.push(`/agent/submit/${form.id}`)}>
                  Start Data Collection
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </LayoutWrapper>
  )
}
