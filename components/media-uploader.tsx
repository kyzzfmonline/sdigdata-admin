"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { Upload, X, CheckCircle } from "lucide-react"
import axios from "axios"
import { filesAPI } from "@/lib/api"

interface MediaUploaderProps {
  onUploadSuccess: (fileUrl: string) => void
  accept?: string
  maxSize?: number
  label?: React.ReactNode
}

export function MediaUploader({
  onUploadSuccess,
  accept = "image/*",
  maxSize = 10 * 1024 * 1024, // 10MB default
  label = "Upload Image",
}: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSize / (1024 * 1024)}MB`)
      return
    }

    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setError(null)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Step 1: Request presigned URL from backend
      const presignResponse = await filesAPI.presign(file.name, file.type, "PUT")

      const { upload_url, file_url } = presignResponse.data.data || presignResponse.data

      // Step 2: Upload file directly to MinIO/S3
      const uploadResponse = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`)
      }

      // Step 3: Success - set the file URL
      setUploadedUrl(file_url)
      onUploadSuccess(file_url)
      setUploadProgress(100)
    } catch (err) {
      console.error("Upload error:", err)
      let errorMsg = "Upload failed"

      if (err instanceof Error) {
        errorMsg = err.message
      } else {
        errorMsg = "Upload failed"
      }

      setError(errorMsg)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add("border-primary")
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("border-primary")
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.remove("border-primary")
    const file = e.dataTransfer.files?.[0]
    if ((file && file.type.startsWith("image/")) || file.type === "application/pdf") {
      await uploadFile(file)
    }
  }

  return (
    <div className="space-y-3">
      {uploadedUrl ? (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Upload successful</p>
              <p className="text-xs text-green-700 truncate">{uploadedUrl}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setUploadedUrl(null)
                setUploadProgress(0)
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors cursor-pointer hover:border-primary"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground mb-1">
              {isUploading ? "Uploading..." : label}
            </p>
            <p className="text-xs text-muted-foreground mb-3">Drag and drop or click to select</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Choose File
            </Button>
          </div>

          {isUploading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Uploading...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}
