"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Plus, Edit, Trash2, Users, GripVertical } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  useCreatePosition,
  useUpdatePosition,
  useDeletePosition,
} from "@/hooks/elections"
import { CandidatesManager } from "./candidates-manager"
import type { ElectionPosition } from "@/lib/types"

const positionSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  max_selections: z.coerce.number().min(1, "Must allow at least 1 selection"),
  display_order: z.coerce.number().optional(),
})

type PositionFormData = z.infer<typeof positionSchema>

interface PositionsManagerProps {
  electionId: string
  positions: ElectionPosition[]
  canEdit: boolean
}

export function PositionsManager({ electionId, positions, canEdit }: PositionsManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState<ElectionPosition | null>(null)

  const createPosition = useCreatePosition()
  const updatePosition = useUpdatePosition()
  const deletePosition = useDeletePosition()

  const form = useForm<PositionFormData>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      title: "",
      description: "",
      max_selections: 1,
      display_order: positions.length + 1,
    },
  })

  const onSubmit = async (data: PositionFormData) => {
    if (editingPosition) {
      updatePosition.mutate(
        {
          electionId,
          positionId: editingPosition.id,
          data,
        },
        {
          onSuccess: () => {
            setEditingPosition(null)
            form.reset()
          },
        }
      )
    } else {
      createPosition.mutate(
        {
          electionId,
          data,
        },
        {
          onSuccess: () => {
            setIsAddDialogOpen(false)
            form.reset({
              title: "",
              description: "",
              max_selections: 1,
              display_order: positions.length + 2,
            })
          },
        }
      )
    }
  }

  const handleEdit = (position: ElectionPosition) => {
    setEditingPosition(position)
    form.reset({
      title: position.title,
      description: position.description || "",
      max_selections: position.max_selections,
      display_order: position.display_order,
    })
  }

  const handleDelete = (positionId: string) => {
    if (confirm("Are you sure you want to delete this position? All candidates will be removed.")) {
      deletePosition.mutate({ electionId, positionId })
    }
  }

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false)
    setEditingPosition(null)
    form.reset()
  }

  const sortedPositions = [...positions].sort((a, b) => a.display_order - b.display_order)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Positions</h3>
          <p className="text-sm text-muted-foreground">
            Configure the positions voters will vote for
          </p>
        </div>
        {canEdit && (
          <Dialog open={isAddDialogOpen || !!editingPosition} onOpenChange={(open) => {
            if (!open) handleCloseDialog()
            else setIsAddDialogOpen(true)
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Position
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingPosition ? "Edit Position" : "Add Position"}
                </DialogTitle>
                <DialogDescription>
                  {editingPosition
                    ? "Update the position details"
                    : "Create a new position for this election"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., President, Chairman" {...field} />
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe this position..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="max_selections"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Selections</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormDescription>
                          How many candidates can a voter select for this position?
                        </FormDescription>
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
                      disabled={createPosition.isPending || updatePosition.isPending}
                    >
                      {createPosition.isPending || updatePosition.isPending
                        ? "Saving..."
                        : editingPosition
                        ? "Update"
                        : "Add Position"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {sortedPositions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No positions yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Add positions to your election to get started
            </p>
            {canEdit && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add First Position
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          <AnimatePresence>
            {sortedPositions.map((position, index) => (
              <motion.div
                key={position.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
              >
                <AccordionItem value={position.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-4 flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-medium">
                          #{position.display_order}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{position.title}</h4>
                        {position.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {position.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mr-4">
                        <span className="text-sm text-muted-foreground">
                          {position.candidates?.length || 0} candidates
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                          Max: {position.max_selections}
                        </span>
                      </div>
                      {canEdit && (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(position)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDelete(position.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4">
                    <CandidatesManager
                      electionId={electionId}
                      positionId={position.id}
                      candidates={position.candidates || []}
                      canEdit={canEdit}
                    />
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </AnimatePresence>
        </Accordion>
      )}
    </div>
  )
}
