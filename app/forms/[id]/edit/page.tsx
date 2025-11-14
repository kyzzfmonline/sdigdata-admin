"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { FormBuilder } from "@/components/form-builder"
import { formsAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { Form } from "@/lib/types"
import { Loader } from "lucide-react"
import { RouteGuard } from "@/components/route-guard"

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

  if (isLoading) {
    return (
      <RouteGuard permission="forms.edit">
        <LayoutWrapper>
          <div className="p-8 flex items-center justify-center h-screen">
            <Loader className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        </LayoutWrapper>
      </RouteGuard>
    )
  }

  if (!form) {
    return (
      <RouteGuard permission="forms.edit">
        <LayoutWrapper>
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Form not found</p>
          </div>
        </LayoutWrapper>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard permission="forms.edit">
      <LayoutWrapper>
        <FormBuilder initialForm={form} autoLock={true} enableAutosave={true} />
      </LayoutWrapper>
    </RouteGuard>
  )
}
