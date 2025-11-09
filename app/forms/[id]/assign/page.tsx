"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formsAPI, usersAPI } from "@/lib/api"
import type { Form, User } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Loader } from "lucide-react"
import { UserCardSkeleton } from "@/components/skeleton-loader"

export default function AssignFormPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState<Form | null>(null)
  const [agents, setAgents] = useState<User[]>([])
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [formRes, agentsRes] = await Promise.all([
          formsAPI.getById(params.id as string),
          usersAPI.getAll({ role: "agent" }),
        ])
        setForm(formRes.data.data)
        // Users endpoint returns paginated response: {success, data: {data, pagination, filters}}
        setAgents(agentsRes.data.data.data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        })
        router.push("/forms")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id, router, toast])

  const handleToggleAgent = (agentId: string) => {
    const newSelected = new Set(selectedAgents)
    if (newSelected.has(agentId)) {
      newSelected.delete(agentId)
    } else {
      newSelected.add(agentId)
    }
    setSelectedAgents(newSelected)
  }

  const handleAssign = async () => {
    if (selectedAgents.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one agent",
        variant: "destructive",
      })
      return
    }

    setIsAssigning(true)
    try {
      await formsAPI.assign(params.id as string, {
        agent_ids: Array.from(selectedAgents),
      })
      toast({
        title: "Success",
        description: "Form assigned to selected agents",
      })
      router.push("/forms")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign form",
        variant: "destructive",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  if (isLoading) {
    return (
      <LayoutWrapper>
        <div className="p-8 max-w-2xl">
          <div className="mb-6">
            <div className="h-9 w-48 bg-muted animate-pulse rounded mb-2" />
            <div className="h-6 w-64 bg-muted animate-pulse rounded" />
          </div>
          <Card className="p-6">
            <div className="h-7 w-48 bg-muted animate-pulse rounded mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <UserCardSkeleton key={i} />
              ))}
            </div>
          </Card>
        </div>
      </LayoutWrapper>
    )
  }

  if (!form) {
    return (
      <LayoutWrapper>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Form not found</p>
        </div>
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper>
      <div className="p-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Assign Form</h1>
          <p className="text-muted-foreground mt-1">{form.title}</p>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Select Field Agents</h2>

          {agents.length === 0 ? (
            <p className="text-muted-foreground">No field agents available</p>
          ) : (
            <div className="space-y-3 mb-6">
              {agents.map((agent) => (
                <label
                  key={agent.id}
                  className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedAgents.has(agent.id)}
                    onChange={() => handleToggleAgent(agent.id)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{agent.username}</p>
                    <p className="text-sm text-muted-foreground">{agent.email}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleAssign} disabled={isAssigning || selectedAgents.size === 0}>
              {isAssigning ? "Assigning..." : "Assign to Selected Agents"}
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </Card>
      </div>
    </LayoutWrapper>
  )
}
