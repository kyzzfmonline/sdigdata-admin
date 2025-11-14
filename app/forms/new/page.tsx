"use client"

import { LayoutWrapper } from "@/components/layout-wrapper"
import { FormBuilder } from "@/components/form-builder"
import { RouteGuard } from "@/components/route-guard"

export default function NewFormPage() {
  return (
    <RouteGuard permission="forms.create">
      <LayoutWrapper>
        <FormBuilder autoLock={false} enableAutosave={false} />
      </LayoutWrapper>
    </RouteGuard>
  )
}
