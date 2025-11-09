"use client"

import { toast as sonnerToast } from "sonner"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success"
}

function toast({ title, description, variant = "default" }: ToastProps) {
  const message = title || description || ""
  const descriptionText = title && description ? description : undefined

  switch (variant) {
    case "destructive":
      return sonnerToast.error(message, {
        description: descriptionText,
      })
    case "success":
      return sonnerToast.success(message, {
        description: descriptionText,
      })
    default:
      return sonnerToast(message, {
        description: descriptionText,
      })
  }
}

function useToast() {
  return {
    toast,
    toasts: [], // Keep for compatibility
    dismiss: () => {}, // Keep for compatibility
  }
}

export { useToast, toast }
