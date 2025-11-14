"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { webhooksAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { Webhook, CreateWebhookInput } from "@/lib/types"
import {
  Webhook as WebhookIcon,
  Loader2,
  Plus,
  Trash2,
  Edit,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Activity,
  Calendar,
  AlertTriangle,
  Code,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

const AVAILABLE_EVENTS = [
  { id: "form.created", label: "Form Created", description: "When a new form is created" },
  { id: "form.updated", label: "Form Updated", description: "When a form is modified" },
  { id: "form.deleted", label: "Form Deleted", description: "When a form is deleted" },
  { id: "form.published", label: "Form Published", description: "When a form is published" },
  {
    id: "response.created",
    label: "Response Created",
    description: "When a new response is submitted",
  },
  { id: "response.updated", label: "Response Updated", description: "When a response is modified" },
  { id: "response.deleted", label: "Response Deleted", description: "When a response is deleted" },
  { id: "user.created", label: "User Created", description: "When a new user is created" },
  { id: "user.updated", label: "User Updated", description: "When a user is modified" },
  { id: "role.assigned", label: "Role Assigned", description: "When a role is assigned to a user" },
]

export default function WebhooksPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [webhookToDelete, setWebhookToDelete] = useState<Webhook | null>(null)
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null)

  const [formData, setFormData] = useState<CreateWebhookInput>({
    name: "",
    url: "",
    events: [],
    enabled: true,
  })

  // Fetch webhooks
  const { data: webhooksData, isLoading } = useQuery({
    queryKey: ["webhooks"],
    queryFn: async () => {
      const response = await webhooksAPI.getWebhooks()
      return response.data.data as { webhooks: Webhook[] }
    },
  })

  // Create webhook
  const createMutation = useMutation({
    mutationFn: (data: CreateWebhookInput) => webhooksAPI.createWebhook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] })
      toast({
        title: "Webhook Created",
        description: "Your webhook has been created successfully.",
      })
      setShowCreateDialog(false)
      setFormData({ name: "", url: "", events: [], enabled: true })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create webhook",
        variant: "destructive",
      })
    },
  })

  // Update webhook
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateWebhookInput> }) =>
      webhooksAPI.updateWebhook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] })
      toast({
        title: "Webhook Updated",
        description: "Your webhook has been updated successfully.",
      })
      setShowEditDialog(false)
      setSelectedWebhook(null)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update webhook",
        variant: "destructive",
      })
    },
  })

  // Delete webhook
  const deleteMutation = useMutation({
    mutationFn: (id: string) => webhooksAPI.deleteWebhook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] })
      toast({
        title: "Webhook Deleted",
        description: "The webhook has been deleted successfully.",
      })
      setWebhookToDelete(null)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete webhook",
        variant: "destructive",
      })
    },
  })

  // Test webhook
  const testMutation = useMutation({
    mutationFn: (id: string) => webhooksAPI.testWebhook(id),
    onSuccess: () => {
      toast({
        title: "Test Sent",
        description: "A test event has been sent to your webhook endpoint.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Test Failed",
        description: error.response?.data?.detail || "Failed to send test event",
        variant: "destructive",
      })
    },
  })

  const toggleEvent = (eventId: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter((e) => e !== eventId)
        : [...prev.events, eventId],
    }))
  }

  const openEditDialog = (webhook: Webhook) => {
    setSelectedWebhook(webhook)
    setFormData({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      enabled: webhook.enabled,
    })
    setShowEditDialog(true)
  }

  const webhooks = webhooksData?.webhooks || []

  return (
    <LayoutWrapper>
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <WebhookIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Webhooks</h1>
                <p className="text-muted-foreground mt-1">
                  Configure webhooks to receive real-time notifications
                </p>
              </div>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Webhook
            </Button>
          </div>
        </div>

        {/* Webhooks List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WebhookIcon className="w-5 h-5" />
              Your Webhooks
              {webhooksData && (
                <Badge variant="secondary" className="ml-2">
                  {webhooks.length} {webhooks.length === 1 ? "webhook" : "webhooks"}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Receive HTTP POST requests when events occur in your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : webhooks.length === 0 ? (
              <div className="text-center py-12">
                <WebhookIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No webhooks configured</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Webhook
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {webhooks.map((webhook) => (
                  <div
                    key={webhook.id}
                    className="flex items-start justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{webhook.name}</h3>
                        {webhook.enabled ? (
                          <Badge variant="default" className="text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="font-mono text-xs bg-muted px-2 py-1 rounded inline-block">
                          {webhook.url}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-2">
                          {webhook.events.map((event) => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 flex-wrap text-xs">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Created {formatDistanceToNow(new Date(webhook.created_at))} ago
                          </span>
                          {webhook.last_triggered_at && (
                            <span className="flex items-center gap-1">
                              <Activity className="w-3 h-3" />
                              Last triggered{" "}
                              {formatDistanceToNow(new Date(webhook.last_triggered_at))} ago
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => testMutation.mutate(webhook.id)}
                        disabled={testMutation.isPending || !webhook.enabled}
                        title="Send test event"
                      >
                        <PlayCircle className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(webhook)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setWebhookToDelete(webhook)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documentation */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Code className="w-5 h-5" />
              Webhook Documentation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Payload Format</h4>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto">
                {`{
  "event": "response.created",
  "timestamp": "2025-01-14T10:30:00Z",
  "data": {
    "id": "resp_123",
    "form_id": "form_456",
    ...
  }
}`}
              </pre>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Security</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>All webhook requests include a signature header for verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Your endpoint must respond with 2xx status code within 5 seconds</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Failed deliveries are retried with exponential backoff</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Webhook Dialog */}
        <Dialog
          open={showCreateDialog || showEditDialog}
          onOpenChange={(open) => {
            if (!open) {
              setShowCreateDialog(false)
              setShowEditDialog(false)
              setSelectedWebhook(null)
              setFormData({ name: "", url: "", events: [], enabled: true })
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{showEditDialog ? "Edit Webhook" : "Create Webhook"}</DialogTitle>
              <DialogDescription>
                Configure a webhook endpoint to receive real-time notifications
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label htmlFor="webhook-name">Webhook Name *</Label>
                <Input
                  id="webhook-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Slack Notifications"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="webhook-url">Endpoint URL *</Label>
                <Input
                  id="webhook-url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://your-domain.com/webhook"
                  className="mt-1"
                  type="url"
                />
                <p className="text-xs text-muted-foreground mt-1">Must be a valid HTTPS URL</p>
              </div>

              <div>
                <Label className="mb-3 block">Events to Subscribe *</Label>
                <div className="space-y-3 max-h-64 overflow-y-auto border rounded-lg p-4">
                  {AVAILABLE_EVENTS.map((event) => (
                    <div key={event.id} className="flex items-start gap-3">
                      <Checkbox
                        id={event.id}
                        checked={formData.events.includes(event.id)}
                        onCheckedChange={() => toggleEvent(event.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor={event.id} className="font-medium cursor-pointer">
                          {event.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {formData.events.length === 0 && (
                  <p className="text-xs text-red-500 mt-2">Please select at least one event</p>
                )}
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="webhook-enabled" className="font-medium">
                    Enable Webhook
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Webhook will start receiving events immediately
                  </p>
                </div>
                <Switch
                  id="webhook-enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false)
                  setShowEditDialog(false)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (showEditDialog && selectedWebhook) {
                    updateMutation.mutate({ id: selectedWebhook.id, data: formData })
                  } else {
                    createMutation.mutate(formData)
                  }
                }}
                disabled={
                  !formData.name ||
                  !formData.url ||
                  formData.events.length === 0 ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {showEditDialog ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <WebhookIcon className="w-4 h-4 mr-2" />
                    {showEditDialog ? "Update Webhook" : "Create Webhook"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Webhook Dialog */}
        <AlertDialog open={!!webhookToDelete} onOpenChange={() => setWebhookToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this webhook? This action cannot be undone.
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="font-medium text-foreground">{webhookToDelete?.name}</div>
                  <div className="text-sm text-muted-foreground font-mono mt-1">
                    {webhookToDelete?.url}
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => webhookToDelete && deleteMutation.mutate(webhookToDelete.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Webhook"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </LayoutWrapper>
  )
}
