"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import type { Form } from "@/lib/types"
import { useForms, usePublishForm, useDeleteForm } from "@/hooks/use-forms"
import { Edit, Eye, Send, Trash2, UserPlus, MoreHorizontal, Share2 } from "lucide-react"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { TableSkeleton } from "@/components/skeleton-loader"
import { usePermissions } from "@/lib/permission-context"
import { PermissionGuard } from "@/components/permission-guards"

export function FormsListTable() {
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null)
  const { data: forms = [], isLoading } = useForms()
  const publishForm = usePublishForm()
  const deleteForm = useDeleteForm()
  const { toast } = useToast()
  const router = useRouter()
  const { hasPermission } = usePermissions()

  const handlePublish = (formId: string) => {
    publishForm.mutate(formId)
  }

  const handleDelete = () => {
    if (!deleteFormId) return
    deleteForm.mutate(deleteFormId, {
      onSettled: () => setDeleteFormId(null),
    })
  }

  const handleBulkDelete = (selectedForms: Form[]) => {
    if (
      confirm(
        `Are you sure you want to delete ${selectedForms.length} form(s)? This action cannot be undone.`
      )
    ) {
      // Delete forms one by one
      selectedForms.forEach((form) => {
        deleteForm.mutate(form.id)
      })
    }
  }

  const handleRowDoubleClick = (form: Form) => {
    router.push(`/forms/${form.id}/edit`)
  }

  const handleShare = async (form: Form) => {
    const shareUrl = `${window.location.origin}/public/forms/${form.id}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: "Link Copied",
        description: "Public form link has been copied to clipboard",
      })
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea")
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)

      toast({
        title: "Link Copied",
        description: "Public form link has been copied to clipboard",
      })
    }
  }

  const columns: ColumnDef<Form>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => {
        return (
          <div className="flex flex-col">
            <span className="font-medium">{row.getValue("title")}</span>
            <span className="text-xs text-muted-foreground">v{row.original.version}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return <Badge variant={status === "published" ? "success" : "warning"}>{status}</Badge>
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => {
        const [formattedDate, setFormattedDate] = useState("")
        const [formattedTime, setFormattedTime] = useState("")

        useEffect(() => {
          const date = new Date(row.getValue("created_at"))
          setFormattedDate(date.toLocaleDateString())
          setFormattedTime(
            date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          )
        }, [row]) // Re-run if row data changes

        return (
          <div className="flex flex-col">
            <span className="text-sm">{formattedDate}</span>
            <span className="text-xs text-muted-foreground">{formattedTime}</span>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const form = row.original

        return (
          <div className="flex items-center justify-end gap-2">
            {hasPermission("forms.read") && (
              <Link href={`/forms/${form.id}/preview`}>
                <Button variant="ghost" size="icon" title="Preview">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
            )}
            {hasPermission("forms.update") && (
              <Link href={`/forms/${form.id}/edit`}>
                <Button variant="ghost" size="icon" title="Edit">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {form.status === "draft" && hasPermission("forms.update") && (
                  <DropdownMenuItem onClick={() => handlePublish(form.id)}>
                    <Send className="mr-2 h-4 w-4" />
                    Publish
                  </DropdownMenuItem>
                )}
                {form.status === "published" && hasPermission("forms.read") && (
                  <DropdownMenuItem onClick={() => handleShare(form)}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Public Link
                  </DropdownMenuItem>
                )}
                {hasPermission("forms.assign") && (
                  <DropdownMenuItem asChild>
                    <Link href={`/forms/${form.id}/assign`}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Assign to Agents
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {hasPermission("forms.delete") && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteFormId(form.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <TableSkeleton rows={5} columns={4} />
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <DataTable
        columns={columns}
        data={forms}
        searchKey="title"
        searchPlaceholder="Search forms..."
        filterOptions={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
            ],
          },
        ]}
        onRowDoubleClick={handleRowDoubleClick}
        bulkActions={
          hasPermission("forms.delete")
            ? [
                {
                  label: "Delete Selected",
                  action: handleBulkDelete,
                  variant: "destructive",
                },
              ]
            : []
        }
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteFormId} onOpenChange={() => setDeleteFormId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the form and all associated
              responses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
