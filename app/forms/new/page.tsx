"use client"

import { useRouter } from "next/navigation"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { LazyFormBuilder as FormBuilder } from "@/components/lazy-components"
import { formsAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { Form } from "@/lib/types"
import { RouteGuard } from "@/components/route-guard"

export default function NewFormPage() {
  const router = useRouter()
  const { toast } = useToast()

  const handleSave = async (
    formData: Omit<Form, "id" | "created_at" | "updated_at" | "created_by">
  ) => {
    try {
      const backendFormData = {
        title: formData.title,
        organization_id: formData.organization_id,
        status: formData.status,
        version: formData.version,
        form_schema: formData.schema,
      }
      const response = await formsAPI.create(backendFormData)
      toast({
        title: "Success",
        description: formData.status === "published" ? "Form published" : "Form saved as draft",
      })
      // Navigate to edit the newly created form
      if (response.data?.data?.id) {
        router.push(`/forms/${response.data.data.id}/edit`)
      } else {
        router.push("/forms")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save form",
        variant: "destructive",
      })
    }
  }

  return (
    <RouteGuard permission="forms.create">
      <LayoutWrapper>
        <div className="p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Create New Form</h1>
            <p className="text-muted-foreground mt-1">Design a data collection form</p>
          </div>
          <FormBuilder onSave={handleSave} />
        </div>
      </LayoutWrapper>
    </RouteGuard>
  )
}
