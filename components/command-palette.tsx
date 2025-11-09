"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Users,
  Settings,
  PlusCircle,
  Search,
} from "lucide-react"
import { useCommandPalette } from "./command-palette-provider"

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette()
  const router = useRouter()

  // Toggle command palette with Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(!open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, setOpen])

  const handleSelect = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => handleSelect("/dashboard")}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/forms")}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Forms</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/responses")}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Responses</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/users")}>
            <Users className="mr-2 h-4 w-4" />
            <span>Users</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => handleSelect("/forms/new")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Create New Form</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/users")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Add New User</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Search">
          <CommandItem>
            <Search className="mr-2 h-4 w-4" />
            <span>Search Forms...</span>
          </CommandItem>
          <CommandItem>
            <Search className="mr-2 h-4 w-4" />
            <span>Search Responses...</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
