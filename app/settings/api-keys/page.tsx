"use client"

import { useState } from "react"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useAPIKeys,
  useAPIKeyStats,
  useCreateAPIKey,
  useRevokeAPIKey,
  type APIKeyWithSecret,
  type APIKeyCreate,
} from "@/hooks/api-keys/use-api-keys"
import {
  Key,
  Loader2,
  Plus,
  Trash2,
  Copy,
  Check,
  RotateCw,
  Calendar,
  Activity,
  AlertTriangle,
  Eye,
  EyeOff,
  TrendingUp,
  Shield,
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

const AVAILABLE_SCOPES = [
  { id: "forms:read", label: "Read Forms", description: "View form definitions" },
  { id: "forms:create", label: "Create Forms", description: "Create new forms" },
  { id: "forms:update", label: "Update Forms", description: "Modify existing forms" },
  { id: "forms:delete", label: "Delete Forms", description: "Delete forms" },
  { id: "responses:read", label: "Read Responses", description: "View form responses" },
  { id: "responses:create", label: "Create Responses", description: "Submit form responses" },
  { id: "responses:export", label: "Export Responses", description: "Export response data" },
  { id: "users:read", label: "Read Users", description: "View user information" },
]

export default function ApiKeysPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showKeyDialog, setShowKeyDialog] = useState(false)
  const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null)
  const [createdKey, setCreatedKey] = useState<APIKeyWithSecret | null>(null)
  const [copied, setCopied] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const [formData, setFormData] = useState<APIKeyCreate & { expires_in_days?: number }>({
    name: "",
    scopes: [],
  })

  // Use new hooks
  const { data: keys = [], isLoading } = useAPIKeys()
  const { data: stats } = useAPIKeyStats()
  const createMutation = useCreateAPIKey()
  const revokeMutation = useRevokeAPIKey()

  const handleCreateKey = async () => {
    try {
      const { expires_in_days, ...apiKeyData } = formData
      const payload: APIKeyCreate = {
        ...apiKeyData,
        expires_at: expires_in_days
          ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
      }
      const result = await createMutation.mutateAsync(payload)
      setCreatedKey(result)
      setShowCreateDialog(false)
      setShowKeyDialog(true)
      setFormData({ name: "", scopes: [] })
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleRevokeKey = async (keyId: string) => {
    try {
      await revokeMutation.mutateAsync(keyId)
      setKeyToRevoke(null)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleCopyKey = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey.key)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success("API key copied to clipboard")
    }
  }

  const toggleScope = (scopeId: string) => {
    setFormData((prev) => ({
      ...prev,
      scopes: prev.scopes?.includes(scopeId)
        ? prev.scopes.filter((s) => s !== scopeId)
        : [...(prev.scopes || []), scopeId],
    }))
  }

  return (
    <LayoutWrapper>
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">API Keys</h1>
                <p className="text-muted-foreground mt-1">
                  Manage API keys for programmatic access to your account
                </p>
              </div>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_keys}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
                <Shield className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.active_keys}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revoked</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.revoked_keys}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.total_usage.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* API Keys Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Your API Keys
              <Badge variant="secondary" className="ml-2">
                {keys.length} {keys.length === 1 ? "key" : "keys"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Use these keys to authenticate API requests to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : keys.length === 0 ? (
              <div className="text-center py-12">
                <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No API keys yet</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First API Key
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {keys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{key.name}</h3>
                        {key.expires_at && new Date(key.expires_at) < new Date() && (
                          <Badge variant="destructive" className="text-xs">
                            Expired
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <code className="bg-muted px-2 py-1 rounded">{key.key_prefix}...</code>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Created {formatDistanceToNow(new Date(key.created_at))} ago
                          </span>
                          {key.last_used_at && (
                            <span className="flex items-center gap-1">
                              <Activity className="w-3 h-3" />
                              Last used {formatDistanceToNow(new Date(key.last_used_at))} ago
                            </span>
                          )}
                          {key.expires_at && (
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Expires {format(new Date(key.expires_at), "PPP")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          {key.scopes.map((scope) => (
                            <Badge key={scope} variant="outline" className="text-xs">
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setKeyToRevoke(key.id)}
                      disabled={revokeMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Security Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Never share your API keys or commit them to version control.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Use environment variables to store API keys in your applications.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Grant only the minimum scopes required for your use case.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Revoke API keys immediately if you suspect they have been compromised.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Rotate API keys regularly for enhanced security.</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Create API Key Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Generate a new API key for programmatic access. Choose carefully which permissions
                to grant.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label htmlFor="key-name">Key Name *</Label>
                <Input
                  id="key-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Mobile App Integration"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  A descriptive name to help you identify this key
                </p>
              </div>

              <div>
                <Label htmlFor="expires-in">Expiration (days)</Label>
                <Input
                  id="expires-in"
                  type="number"
                  value={formData.expires_in_days}
                  onChange={(e) =>
                    setFormData({ ...formData, expires_in_days: Number(e.target.value) })
                  }
                  placeholder="365"
                  min="1"
                  max="730"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Key will expire after this many days (1-730)
                </p>
              </div>

              <div>
                <Label className="mb-3 block">Permissions (Scopes) *</Label>
                <div className="space-y-3 max-h-64 overflow-y-auto border rounded-lg p-4">
                  {AVAILABLE_SCOPES.map((scope) => (
                    <div key={scope.id} className="flex items-start gap-3">
                      <Checkbox
                        id={scope.id}
                        checked={formData.scopes?.includes(scope.id) || false}
                        onCheckedChange={() => toggleScope(scope.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor={scope.id} className="font-medium cursor-pointer">
                          {scope.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{scope.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {(!formData.scopes || formData.scopes.length === 0) && (
                  <p className="text-xs text-red-500 mt-2">Please select at least one permission</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateKey}
                disabled={
                  !formData.name ||
                  !formData.scopes ||
                  formData.scopes.length === 0 ||
                  createMutation.isPending
                }
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Create Key
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Display Created Key Dialog */}
        <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>API Key Created Successfully</DialogTitle>
              <DialogDescription>
                Make sure to copy your API key now. You won't be able to see it again!
              </DialogDescription>
            </DialogHeader>
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900 dark:text-amber-200">
                This is the only time you'll see the full API key. Store it securely!
              </AlertDescription>
            </Alert>
            <div className="space-y-4">
              <div>
                <Label>Key Name</Label>
                <div className="mt-1 p-3 bg-muted rounded-lg font-medium">{createdKey?.name}</div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>API Key</Label>
                  <Button variant="ghost" size="sm" onClick={() => setShowKey(!showKey)}>
                    {showKey ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-1" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-1" />
                        Show
                      </>
                    )}
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    value={createdKey?.key || ""}
                    type={showKey ? "text" : "password"}
                    readOnly
                    className="font-mono text-sm pr-12"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyKey}
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setShowKeyDialog(false)
                  setCreatedKey(null)
                  setShowKey(false)
                }}
              >
                I've Saved My Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Revoke Key Dialog */}
        <AlertDialog open={!!keyToRevoke} onOpenChange={() => setKeyToRevoke(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to revoke this API key? Applications using this key will
                immediately lose access.
                {keyToRevoke && keys.find((k) => k.id === keyToRevoke) && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="font-medium text-foreground">
                      {keys.find((k) => k.id === keyToRevoke)?.name}
                    </div>
                    <div className="text-sm text-muted-foreground font-mono mt-1">
                      {keys.find((k) => k.id === keyToRevoke)?.key_prefix}...
                    </div>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => keyToRevoke && handleRevokeKey(keyToRevoke)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {revokeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Revoking...
                  </>
                ) : (
                  "Revoke Key"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </LayoutWrapper>
  )
}
