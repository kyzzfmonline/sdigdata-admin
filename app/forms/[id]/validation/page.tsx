"use client"

/**
 * Form Validation Rules Page
 * Create and manage custom validation rules for form fields
 */

import { useState } from "react"
import { useParams } from "next/navigation"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  useValidationRules,
  useCreateValidationRule,
  useUpdateValidationRule,
  useDeleteValidationRule,
  useTestValidationRule,
  type ValidationRule,
  type ValidationRuleType,
} from "@/hooks/forms/use-form-validation"
import { Shield, Plus, Edit, Trash2, Play, AlertCircle, CheckCircle2, Copy } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useForm } from "react-hook-form"
import { Switch } from "@/components/ui/switch"

const VALIDATION_TYPES: {
  value: ValidationRuleType
  label: string
  description: string
  needsValue: boolean
}[] = [
  {
    value: "required",
    label: "Required",
    description: "Field must have a value",
    needsValue: false,
  },
  {
    value: "min_length",
    label: "Min Length",
    description: "Minimum character count",
    needsValue: true,
  },
  {
    value: "max_length",
    label: "Max Length",
    description: "Maximum character count",
    needsValue: true,
  },
  {
    value: "min_value",
    label: "Min Value",
    description: "Minimum numeric value",
    needsValue: true,
  },
  {
    value: "max_value",
    label: "Max Value",
    description: "Maximum numeric value",
    needsValue: true,
  },
  { value: "pattern", label: "Pattern", description: "Must match regex pattern", needsValue: true },
  { value: "email", label: "Email", description: "Must be valid email", needsValue: false },
  { value: "url", label: "URL", description: "Must be valid URL", needsValue: false },
  { value: "phone", label: "Phone", description: "Must be valid phone number", needsValue: false },
  { value: "date_range", label: "Date Range", description: "Date within range", needsValue: true },
  { value: "file_size", label: "File Size", description: "Maximum file size", needsValue: true },
  { value: "file_type", label: "File Type", description: "Allowed file types", needsValue: true },
  {
    value: "custom_function",
    label: "Custom Function",
    description: "Custom validation logic",
    needsValue: true,
  },
  { value: "unique", label: "Unique", description: "Value must be unique", needsValue: false },
  {
    value: "comparison",
    label: "Comparison",
    description: "Compare with another field",
    needsValue: true,
  },
  {
    value: "conditional",
    label: "Conditional",
    description: "Validation based on condition",
    needsValue: true,
  },
]

export default function ValidationRulesPage() {
  const params = useParams()
  const formId = params.id as string

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<ValidationRule | null>(null)
  const [selectedFieldId, setSelectedFieldId] = useState<string | "all">("all")

  const { data: rules, isLoading: rulesLoading } = useValidationRules(formId)
  const createRule = useCreateValidationRule(formId)
  const updateRule = useUpdateValidationRule(formId, selectedRule?.id || "")
  const deleteRule = useDeleteValidationRule(formId)
  const testRule = useTestValidationRule(formId, selectedRule?.id || "")

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<{
    field_id: string
    rule_type: ValidationRuleType
    error_message: string
    rule_value?: string
    is_active: boolean
  }>()

  const watchRuleType = watch("rule_type")

  const onCreateRule = async (data: any) => {
    try {
      await createRule.mutateAsync({
        form_id: formId,
        field_id: data.field_id,
        name: `${data.rule_type} validation`,
        rule_type: data.rule_type,
        error_message: data.error_message,
        parameters: data.rule_value ? { value: data.rule_value } : {},
        enabled: data.is_active,
      })
      setIsCreateDialogOpen(false)
      reset()
    } catch (error) {
      // Error handled by mutation
    }
  }

  const onEditRule = async (data: any) => {
    if (!selectedRule) return
    try {
      await updateRule.mutateAsync({
        rule_type: data.rule_type,
        error_message: data.error_message,
        parameters: data.rule_value ? { value: data.rule_value } : {},
        enabled: data.is_active,
      })
      setIsEditDialogOpen(false)
      setSelectedRule(null)
      reset()
    } catch (error) {
      // Error handled by mutation
    }
  }

  const onDeleteRule = async () => {
    if (!selectedRule) return
    try {
      await deleteRule.mutateAsync(selectedRule.id)
      setIsDeleteDialogOpen(false)
      setSelectedRule(null)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const openEditDialog = (rule: ValidationRule) => {
    setSelectedRule(rule)
    setValue("field_id", rule.field_id)
    setValue("rule_type", rule.rule_type)
    setValue("error_message", rule.error_message)
    setValue("rule_value", rule.parameters?.value || "")
    setValue("is_active", rule.enabled)
    setIsEditDialogOpen(true)
  }

  const getValidationTypeInfo = (type: ValidationRuleType) => {
    return VALIDATION_TYPES.find((t) => t.value === type)
  }

  const needsValue = (ruleType: ValidationRuleType) => {
    const type = VALIDATION_TYPES.find((t) => t.value === ruleType)
    return type?.needsValue || false
  }

  const getRuleStatusColor = (rule: ValidationRule) => {
    if (!rule.enabled) return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
  }

  const groupedRules = rules?.reduce(
    (acc, rule) => {
      if (!acc[rule.field_id]) {
        acc[rule.field_id] = []
      }
      acc[rule.field_id].push(rule)
      return acc
    },
    {} as Record<string, ValidationRule[]>
  )

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Validation Rules
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure custom validation rules for form fields
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Rule
          </Button>
        </div>

        {/* Stats */}
        {rules && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rules.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {rules.filter((r) => r.enabled).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fields with Rules</CardTitle>
                <Copy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {groupedRules ? Object.keys(groupedRules).length : 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inactive Rules</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {rules.filter((r) => !r.enabled).length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Label>Filter by Field:</Label>
              <Select value={selectedFieldId} onValueChange={setSelectedFieldId}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  {groupedRules &&
                    Object.keys(groupedRules).map((fieldId) => (
                      <SelectItem key={fieldId} value={fieldId}>
                        {fieldId} ({groupedRules[fieldId].length} rules)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Rules List */}
        <Card>
          <CardHeader>
            <CardTitle>Validation Rules</CardTitle>
            <CardDescription>
              {selectedFieldId === "all"
                ? `All validation rules (${rules?.length || 0})`
                : `Rules for field: ${selectedFieldId}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rulesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : groupedRules && Object.keys(groupedRules).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedRules)
                  .filter(([fieldId]) => selectedFieldId === "all" || fieldId === selectedFieldId)
                  .map(([fieldId, fieldRules]) => (
                    <div key={fieldId}>
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-semibold">{fieldId}</h3>
                        <Badge variant="outline">{fieldRules.length} rules</Badge>
                      </div>
                      <div className="space-y-2">
                        {fieldRules.map((rule) => {
                          const typeInfo = getValidationTypeInfo(rule.rule_type)
                          return (
                            <Card key={rule.id} className={!rule.enabled ? "opacity-60" : ""}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <Badge variant="secondary">
                                        {typeInfo?.label || rule.rule_type}
                                      </Badge>
                                      <Badge className={getRuleStatusColor(rule)}>
                                        {rule.enabled ? "Active" : "Inactive"}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {typeInfo?.description}
                                    </p>
                                    <div className="text-sm">
                                      <span className="font-medium">Error Message: </span>
                                      <span className="text-muted-foreground">
                                        {rule.error_message}
                                      </span>
                                    </div>
                                    {rule.parameters?.value && (
                                      <div className="text-sm mt-1">
                                        <span className="font-medium">Value: </span>
                                        <span className="text-muted-foreground font-mono">
                                          {rule.parameters.value}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedRule(rule)
                                        setIsTestDialogOpen(true)
                                      }}
                                    >
                                      <Play className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openEditDialog(rule)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedRule(rule)
                                        setIsDeleteDialogOpen(true)
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No validation rules</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Add validation rules to ensure data quality
                </p>
                <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Rule
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Rule Dialog */}
        <Dialog
          open={isCreateDialogOpen || isEditDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false)
              setIsEditDialogOpen(false)
              setSelectedRule(null)
              reset()
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit(isEditDialogOpen ? onEditRule : onCreateRule)}>
              <DialogHeader>
                <DialogTitle>
                  {isEditDialogOpen ? "Edit Validation Rule" : "Create Validation Rule"}
                </DialogTitle>
                <DialogDescription>Define a validation rule for a form field</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="field_id">Field ID *</Label>
                  <Input
                    id="field_id"
                    placeholder="e.g., email_address"
                    disabled={isEditDialogOpen}
                    {...register("field_id", { required: "Field ID is required" })}
                  />
                  {errors.field_id && (
                    <p className="text-sm text-destructive">{errors.field_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rule_type">Validation Type *</Label>
                  <Select
                    defaultValue="required"
                    onValueChange={(value) => setValue("rule_type", value as ValidationRuleType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {VALIDATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{type.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {type.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {needsValue(watchRuleType) && (
                  <div className="space-y-2">
                    <Label htmlFor="rule_value">Validation Value *</Label>
                    <Input
                      id="rule_value"
                      placeholder="e.g., 5, /^[A-Z]/, file.pdf"
                      {...register("rule_value", {
                        required: needsValue(watchRuleType)
                          ? "Value is required for this validation type"
                          : false,
                      })}
                    />
                    {errors.rule_value && (
                      <p className="text-sm text-destructive">{errors.rule_value.message}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="error_message">Error Message *</Label>
                  <Textarea
                    id="error_message"
                    placeholder="Message shown when validation fails"
                    rows={2}
                    {...register("error_message", { required: "Error message is required" })}
                  />
                  {errors.error_message && (
                    <p className="text-sm text-destructive">{errors.error_message.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Rule is Active</Label>
                  <Switch
                    id="is_active"
                    defaultChecked={true}
                    onCheckedChange={(checked) => setValue("is_active", checked)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    setIsEditDialogOpen(false)
                    setSelectedRule(null)
                    reset()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createRule.isPending || updateRule.isPending}>
                  {createRule.isPending || updateRule.isPending ? "Saving..." : "Save Rule"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Validation Rule</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this validation rule? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDeleteRule}
                disabled={deleteRule.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteRule.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Test Dialog */}
        <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Validation Rule</DialogTitle>
              <DialogDescription>Test this validation rule with sample data</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Enter a test value to see if it passes validation:
              </p>
              <Input placeholder="Enter test value..." />
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <span>Validation testing will validate the input against the rule</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>
                Close
              </Button>
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Test
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutWrapper>
  )
}
