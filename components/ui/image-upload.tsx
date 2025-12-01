"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { filesAPI } from "@/lib/api"
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  accept?: string
  maxSize?: number // in MB
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  accept = "image/*",
  maxSize = 5,
  className,
  placeholder = "Upload image",
  disabled = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleUpload = useCallback(
    async (file: File) => {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        })
        return
      }

      // Validate file size
      const fileSizeMB = file.size / (1024 * 1024)
      if (fileSizeMB > maxSize) {
        toast({
          title: "File too large",
          description: `Maximum file size is ${maxSize}MB`,
          variant: "destructive",
        })
        return
      }

      setIsUploading(true)

      try {
        // Get presigned URL from backend
        const response = await filesAPI.presign(file.name, file.type, "PUT")
        const { presigned_url, file_url } = response.data.data

        // Upload file directly to S3/Spaces
        await fetch(presigned_url, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        })

        // Set the permanent file URL
        onChange(file_url)

        toast({
          title: "Upload successful",
          description: "Image uploaded successfully",
        })
      } catch (error: any) {
        console.error("Upload error:", error)
        toast({
          title: "Upload failed",
          description: error.response?.data?.detail || "Failed to upload image",
          variant: "destructive",
        })
      } finally {
        setIsUploading(false)
      }
    },
    [maxSize, onChange, toast]
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
    // Reset input so same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled || isUploading) return

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleRemove = () => {
    onChange("")
    onRemove?.()
  }

  return (
    <div className={cn("space-y-2", className)}>
      {value ? (
        <div className="relative group">
          <div className="relative w-full h-40 rounded-lg border overflow-hidden bg-muted">
            <img
              src={value}
              alt="Uploaded image"
              className="w-full h-full object-contain"
            />
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && inputRef.current?.click()}
        >
          <Input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={disabled || isUploading}
            className="sr-only"
          />

          <div className="flex flex-col items-center justify-center gap-2 text-center">
            {isUploading ? (
              <>
                <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <div className="p-3 rounded-full bg-muted">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{placeholder}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Drag & drop or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Max size: {maxSize}MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
