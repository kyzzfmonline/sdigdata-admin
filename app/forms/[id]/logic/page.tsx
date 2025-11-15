"use client"

/**
 * Conditional Logic Builder Page
 * Create and manage conditional rules for dynamic form behavior
 */

import { useState } from "react"
import { useParams } from "next/navigation"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  useConditionalRules,
  useCreateConditionalRule,
  useUpdateConditionalRule,
  useDeleteConditionalRule,
  useTestConditionalRule,
  useReorderConditionalRules,
  type ConditionalRule,
  type ConditionOperator,
  type ActionType,
} from "@/hooks/forms/use-conditional-logic"
import {
  GitBranch,
  Plus,
  Edit,
  Trash2,
  Play,
  MoveUp,
  MoveDown,
  AlertCircle,
  CheckCircle2,
  Settings,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useForm } from "react-hook-form"
import { Switch } from "@/components/ui/switch"

const OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Does Not Contain" },
  { value: "starts_with", label: "Starts With" },
  { value: "ends_with", label: "Ends With" },
  { value: "is_empty", label: "Is Empty" },
  { value: "is_not_empty", label: "Is Not Empty" },
  { value: "in", label: "In List" },
  { value: "not_in", label: "Not In List" },
  { value: "matches_regex", label: "Matches Pattern" },
]

const ACTIONS: { value: ActionType; label: string; description: string }[] = [
  { value: "show", label: "Show Field", description: "Make field visible" },
  { value: "hide", label: "Hide Field", description: "Make field hidden" },
  { value: "enable", label: "Enable Field", description: "Make field editable" },
  { value: "disable", label: "Disable Field", description: "Make field read-only" },
  { value: "set_value", label: "Set Value", description: "Set field value" },
  { value: "set_required", label: "Make Required", description: "Mark field as required" },
  { value: "set_optional", label: "Make Optional", description: "Mark field as optional" },
  { value: "set_options", label: "Set Options", description: "Change available options" },
  { value: "calculate", label: "Calculate", description: "Calculate field value" },
  { value: "validate", label: "Validate", description: "Add custom validation" },
]

export default function ConditionalLogicPage() {
  const params = useParams()
  const formId = params.id as string

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<ConditionalRule | null>(null)

  const { data: rules, isLoading: rulesLoading } = useConditionalRules(formId)
  const createRule = useCreateConditionalRule(formId)
  const updateRule = useUpdateConditionalRule(formId, selectedRule?.id || "")
  const deleteRule = useDeleteConditionalRule(formId)
  const testRule = useTestConditionalRule(formId, selectedRule?.id || "")
  const reorderRules = useReorderConditionalRules(formId)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<{
    name: string
    description?: string
    condition_field: string
    condition_operator: ConditionOperator
    condition_value: string
    action_type: ActionType
    action_target_field: string
    action_value?: string
    is_active: boolean
  }>()

  const watchOperator = watch("condition_operator")
  const watchActionType = watch("action_type")

  const onCreateRule = async (data: any) => {
    try {
      await createRule.mutateAsync({
        form_id: formId,
        name: data.name,
        description: data.description,
        conditions: [
          {
            field_id: data.condition_field,
            operator: data.condition_operator,
            value: data.condition_value,
          },
        ],
        actions: [
          {
            type: data.action_type,
            target_field_ids: [data.action_target_field],
            parameters: data.action_value ? { value: data.action_value } : undefined,
          },
        ],
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
        name: data.name,
        description: data.description,
        conditions: [
          {
            field_id: data.condition_field,
            operator: data.condition_operator,
            value: data.condition_value,
          },
        ],
        actions: [
          {
            type: data.action_type,
            target_field_ids: [data.action_target_field],
            parameters: data.action_value ? { value: data.action_value } : undefined,
          },
        ],
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

  const handleTestRule = async () => {
    if (!selectedRule) return
    try {
      const result = await testRule.mutateAsync({
        form_data: {}, // Would need actual test data from form
      })
      // Show test results
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleMoveRule = async (ruleId: string, direction: "up" | "down") => {
    if (!rules) return
    const index = rules.findIndex((r) => r.id === ruleId)
    if (index === -1) return

    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= rules.length) return

    const reordered = [...rules]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(newIndex, 0, moved)

    try {
      await reorderRules.mutateAsync({
        rule_priorities: reordered.map((r, idx) => ({
          rule_id: r.id,
          priority: reordered.length - idx,
        })),
      })
    } catch (error) {
      // Error handled by mutation
    }
  }

  const openEditDialog = (rule: ConditionalRule) => {
    setSelectedRule(rule)
    setValue("name", rule.name)
    setValue("description", rule.description || "")
    setValue("is_active", rule.enabled)
    if (rule.conditions.length > 0) {
      setValue("condition_field", rule.conditions[0].field_id)
      setValue("condition_operator", rule.conditions[0].operator)
      setValue("condition_value", rule.conditions[0].value)
    }
    if (rule.actions.length > 0) {
      setValue("action_type", rule.actions[0].type)
      setValue("action_target_field", rule.actions[0].target_field_ids[0] || "")
      setValue("action_value", rule.actions[0].parameters?.value || "")
    }
    setIsEditDialogOpen(true)
  }

  const needsValue = (operator: ConditionOperator) => {
    return !["is_empty", "is_not_empty"].includes(operator)
  }

  const needsActionValue = (actionType: ActionType) => {
    return ["set_value", "set_options", "calculate", "validate"].includes(actionType)
  }

  const getRuleStatusColor = (rule: ConditionalRule) => {
    if (!rule.enabled) return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
  }

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <GitBranch className="h-8 w-8 text-primary" />
              Conditional Logic
            </h1>
            <p className="text-muted-foreground mt-1">
              Create dynamic rules to control form behavior
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Rule
          </Button>
        </div>

        {/* Info Card */}
        <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-900/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-blue-600" />
              How Conditional Logic Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Define rules with conditions (IF) and actions (THEN) to create dynamic forms. Rules
              are evaluated in priority order. Example: IF "Age" is greater than 18 THEN show
              "Voting Registration" field.
            </p>
          </CardContent>
        </Card>

        {/* Rules List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Conditional Rules</CardTitle>
                <CardDescription>{rules?.length || 0} rule(s) configured</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                Evaluated in order
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {rulesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : rules && rules.length > 0 ? (
              <div className="space-y-3">
                {rules.map((rule, index) => (
                  <Card key={rule.id} className={!rule.enabled ? "opacity-60" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-mono text-muted-foreground">
                              #{index + 1}
                            </span>
                            <h4 className="font-medium">{rule.name}</h4>
                            <Badge className={getRuleStatusColor(rule)}>
                              {rule.enabled ? "Active" : "Inactive"}
                            </Badge>
                            {rule.priority !== undefined && (
                              <Badge variant="outline" className="text-xs">
                                Priority: {rule.priority}
                              </Badge>
                            )}
                          </div>
                          {rule.description && (
                            <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Rule Logic Display */}
                      <div className="space-y-2 bg-muted/50 p-3 rounded-lg mb-3">
                        <div className="flex items-start gap-2">
                          <Badge variant="secondary" className="mt-0.5">
                            IF
                          </Badge>
                          <div className="flex-1 text-sm">
                            {rule.conditions.map((condition, idx) => (
                              <div key={idx} className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{condition.field_id}</span>
                                <span className="text-muted-foreground">{condition.operator}</span>
                                <span className="font-medium">"{condition.value}"</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-2">
                          <Badge variant="default" className="mt-0.5">
                            THEN
                          </Badge>
                          <div className="flex-1 text-sm">
                            {rule.actions.map((action, idx) => (
                              <div key={idx} className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{action.type}</span>
                                <span className="text-muted-foreground">field</span>
                                <span className="font-medium">
                                  {action.target_field_ids.join(", ")}
                                </span>
                                {action.parameters?.value && (
                                  <>
                                    <span className="text-muted-foreground">to</span>
                                    <span className="font-medium">"{action.parameters.value}"</span>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveRule(rule.id, "up")}
                          disabled={index === 0 || reorderRules.isPending}
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveRule(rule.id, "down")}
                          disabled={index === rules.length - 1 || reorderRules.isPending}
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRule(rule)
                            setIsTestDialogOpen(true)
                          }}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Test
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(rule)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRule(rule)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <GitBranch className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No conditional rules</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Create your first rule to add dynamic behavior to your form
                </p>
                <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Rule
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit(isEditDialogOpen ? onEditRule : onCreateRule)}>
              <DialogHeader>
                <DialogTitle>
                  {isEditDialogOpen ? "Edit Conditional Rule" : "Create Conditional Rule"}
                </DialogTitle>
                <DialogDescription>
                  Define a condition and action for dynamic form behavior
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Rule Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Show address if age > 18"
                      {...register("name", { required: "Name is required" })}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what this rule does..."
                      rows={2}
                      {...register("description")}
                    />
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

                <Separator />

                {/* Condition Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">IF</Badge>
                    <span className="text-sm font-medium">Condition</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="condition_field">Field *</Label>
                      <Input
                        id="condition_field"
                        placeholder="field_id"
                        {...register("condition_field", { required: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="condition_operator">Operator *</Label>
                      <Select
                        defaultValue="equals"
                        onValueChange={(value) =>
                          setValue("condition_operator", value as ConditionOperator)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATORS.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="condition_value">
                        Value {needsValue(watchOperator) && "*"}
                      </Label>
                      <Input
                        id="condition_value"
                        placeholder="comparison value"
                        disabled={!needsValue(watchOperator)}
                        {...register("condition_value", {
                          required: needsValue(watchOperator) ? "Value is required" : false,
                        })}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Action Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default">THEN</Badge>
                    <span className="text-sm font-medium">Action</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="action_type">Action Type *</Label>
                      <Select
                        defaultValue="show"
                        onValueChange={(value) => setValue("action_type", value as ActionType)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTIONS.map((action) => (
                            <SelectItem key={action.value} value={action.value}>
                              {action.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="action_target_field">Target Field *</Label>
                      <Input
                        id="action_target_field"
                        placeholder="field_id"
                        {...register("action_target_field", { required: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="action_value">
                        Value {needsActionValue(watchActionType) && "*"}
                      </Label>
                      <Input
                        id="action_value"
                        placeholder="action value"
                        disabled={!needsActionValue(watchActionType)}
                        {...register("action_value", {
                          required: needsActionValue(watchActionType) ? "Value is required" : false,
                        })}
                      />
                    </div>
                  </div>
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
              <AlertDialogTitle>Delete Rule</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedRule?.name}"? This action cannot be
                undone.
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
              <DialogTitle>Test Rule: {selectedRule?.name}</DialogTitle>
              <DialogDescription>
                Test this rule with sample data to see how it behaves
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Testing feature requires form field data. Connect to your form to test rules.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span>Rule testing will be available when form data is connected</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsTestDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutWrapper>
  )
}
