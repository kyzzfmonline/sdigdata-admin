"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Plus, Edit, Trash2, GripVertical, ListChecks } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  useCreatePollOption,
  useUpdatePollOption,
  useDeletePollOption,
} from "@/hooks/elections"
import type { PollOption } from "@/lib/types"

const pollOptionSchema = z.object({
  option_text: z.string().min(1, "Option text is required"),
  description: z.string().optional(),
  display_order: z.coerce.number().optional(),
})

type PollOptionFormData = z.infer<typeof pollOptionSchema>

interface PollOptionsManagerProps {
  electionId: string
  options: PollOption[]
  canEdit: boolean
}

export function PollOptionsManager({ electionId, options, canEdit }: PollOptionsManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingOption, setEditingOption] = useState<PollOption | null>(null)

  const createOption = useCreatePollOption()
  const updateOption = useUpdatePollOption()
  const deleteOption = useDeletePollOption()

  const form = useForm<PollOptionFormData>({
    resolver: zodResolver(pollOptionSchema),
    defaultValues: {
      option_text: "",
      description: "",
      display_order: options.length + 1,
    },
  })

  const onSubmit = async (data: PollOptionFormData) => {
    if (editingOption) {
      updateOption.mutate(
        {
          electionId,
          optionId: editingOption.id,
          data,
        },
        {
          onSuccess: () => {
            setEditingOption(null)
            form.reset()
          },
        }
      )
    } else {
      createOption.mutate(
        {
          electionId,
          data,
        },
        {
          onSuccess: () => {
            setIsAddDialogOpen(false)
            form.reset({
              option_text: "",
              description: "",
              display_order: options.length + 2,
            })
          },
        }
      )
    }
  }

  const handleEdit = (option: PollOption) => {
    setEditingOption(option)
    form.reset({
      option_text: option.option_text,
      description: option.description || "",
      display_order: option.display_order,
    })
  }

  const handleDelete = (optionId: string) => {
    if (confirm("Are you sure you want to delete this option?")) {
      deleteOption.mutate({ electionId, optionId })
    }
  }

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false)
    setEditingOption(null)
    form.reset()
  }

  const sortedOptions = [...options].sort((a, b) => a.display_order - b.display_order)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Poll Options</h3>
          <p className="text-sm text-muted-foreground">
            Configure the choices voters can select
          </p>
        </div>
        {canEdit && (
          <Dialog open={isAddDialogOpen || !!editingOption} onOpenChange={(open) => {
            if (!open) handleCloseDialog()
            else setIsAddDialogOpen(true)
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Option
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingOption ? "Edit Option" : "Add Option"}
                </DialogTitle>
                <DialogDescription>
                  {editingOption
                    ? "Update the option details"
                    : "Add a new option to this poll"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="option_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Option Text</FormLabel>
                        <FormControl>
                          <Input placeholder="Yes / No / Option A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional details about this option..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createOption.isPending || updateOption.isPending}
                    >
                      {createOption.isPending || updateOption.isPending
                        ? "Saving..."
                        : editingOption
                        ? "Update"
                        : "Add Option"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {sortedOptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ListChecks className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No options yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Add options for voters to choose from
            </p>
            {canEdit && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add First Option
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {sortedOptions.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                        <span className="text-xs font-medium">
                          #{option.display_order}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{option.option_text}</p>
                        {option.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {option.description}
                          </p>
                        )}
                      </div>
                      {canEdit && (
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(option)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDelete(option.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
