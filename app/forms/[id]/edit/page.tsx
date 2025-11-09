"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { FormBuilder } from "@/components/form-builder"
import { formsAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { Form } from "@/lib/types"
import { Loader } from "lucide-react"

export default function EditFormPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState<Form | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await formsAPI.getById(params.id as string)
        setForm(response.data.data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load form",
          variant: "destructive",
        })
        router.push("/forms")
      } finally {
        setIsLoading(false)
      }
    }

    fetchForm()
  }, [params.id, router, toast])

  const handleSave = async (formData: any) => {
    try {
      await formsAPI.update(params.id as string, formData)
      toast({
        title: "Success",
        description:
          formData.status === "published"
            ? "Form published successfully"
            : "Draft saved successfully",
      })
      // Stay on the page after saving
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save form",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <LayoutWrapper>
        <div className="p-8 flex items-center justify-center h-screen">
          <Loader className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </LayoutWrapper>
    )
  }

  if (!form) {
    return (
      <LayoutWrapper>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Form not found</p>
        </div>
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Edit Form</h1>
          <p className="text-muted-foreground mt-1">{form.title}</p>
        </div>
        <FormBuilder initialForm={form} onSave={handleSave} />
      </div>
    </LayoutWrapper>
  )
}
