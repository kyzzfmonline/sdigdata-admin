"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { MediaUploader } from "@/components/media-uploader"
import type { FormBranding } from "@/lib/types"
import { Palette, Upload } from "lucide-react"

interface FormBrandingEditorProps {
  branding?: FormBranding
  onUpdate: (branding: FormBranding) => void
}

export function FormBrandingEditor({ branding = {}, onUpdate }: FormBrandingEditorProps) {
  const [localBranding, setLocalBranding] = useState<FormBranding>(branding)

  const handleBrandingChange = (updates: Partial<FormBranding>) => {
    const updated = { ...localBranding, ...updates }
    setLocalBranding(updated)
    onUpdate(updated)
  }

  return (
    <div className="bg-card/80 backdrop-blur-xl border border-border/30 rounded-3xl p-8 shadow-sm">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-primary/10 to-primary/10 rounded-xl">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-light text-foreground">Form Branding</h3>
            <p className="text-sm text-muted-foreground">
              Customize your form's appearance and identity
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Logo Upload */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium text-foreground">Form Logo</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Display your brand at the top of the form
            </p>
          </div>
          <div className="group">
            <MediaUploader
              accept="image/*"
              label={
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-xl group-hover:bg-muted/80 transition-colors">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">Upload Logo</span>
                </div>
              }
              onUploadSuccess={(url) => handleBrandingChange({ logo_url: url })}
            />
          </div>
          {localBranding.logo_url && (
            <div className="p-4 bg-muted/50 rounded-2xl border border-border/50">
              <p className="text-xs text-muted-foreground mb-3 font-medium">Logo Preview</p>
              <div className="flex items-center gap-4">
                <img
                  src={localBranding.logo_url || "/placeholder.svg"}
                  alt="Form logo"
                  className="h-12 w-12 object-contain rounded-lg bg-card border border-border"
                />
                <div className="text-sm text-muted-foreground">Logo uploaded successfully</div>
              </div>
            </div>
          )}
        </div>

        {/* Banner Upload */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium text-foreground">Form Banner</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Create visual impact with a header banner
            </p>
          </div>
          <div className="group">
            <MediaUploader
              accept="image/*"
              label={
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-xl group-hover:bg-muted/80 transition-colors">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">Upload Banner</span>
                </div>
              }
              onUploadSuccess={(url) => handleBrandingChange({ banner_url: url })}
            />
          </div>
          {localBranding.banner_url && (
            <div className="p-4 bg-muted/50 rounded-2xl border border-border/50">
              <p className="text-xs text-muted-foreground mb-3 font-medium">Banner Preview</p>
              <img
                src={localBranding.banner_url || "/placeholder.svg"}
                alt="Form banner"
                className="h-24 w-full object-cover rounded-xl bg-card border border-border"
              />
            </div>
          )}
        </div>

        {/* Color Customization */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium text-foreground">Brand Colors</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Choose colors that match your brand identity
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">Primary Color</Label>
              <div className="flex gap-3">
                <div className="relative">
                  <input
                    type="color"
                    value={localBranding.primary_color || "#6366f1"}
                    onChange={(e) => handleBrandingChange({ primary_color: e.target.value })}
                    className="w-12 h-12 rounded-xl cursor-pointer border-2 border-card shadow-lg"
                  />
                  <div className="absolute inset-0 rounded-xl ring-2 ring-border/50 pointer-events-none" />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={localBranding.primary_color || "#6366f1"}
                    onChange={(e) => handleBrandingChange({ primary_color: e.target.value })}
                    placeholder="#6366f1"
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">Accent Color</Label>
              <div className="flex gap-3">
                <div className="relative">
                  <input
                    type="color"
                    value={localBranding.accent_color || "#f59e0b"}
                    onChange={(e) => handleBrandingChange({ accent_color: e.target.value })}
                    className="w-12 h-12 rounded-xl cursor-pointer border-2 border-card shadow-lg"
                  />
                  <div className="absolute inset-0 rounded-xl ring-2 ring-border/50 pointer-events-none" />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={localBranding.accent_color || "#f59e0b"}
                    onChange={(e) => handleBrandingChange({ accent_color: e.target.value })}
                    placeholder="#f59e0b"
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
