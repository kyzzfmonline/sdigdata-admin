"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useParties } from "@/hooks/parties"

interface PartySelectorProps {
  value?: string
  onChange: (value: string, partyName?: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  showIndependent?: boolean
}

export function PartySelector({
  value,
  onChange,
  placeholder = "Select party",
  disabled = false,
  className,
  showIndependent = true,
}: PartySelectorProps) {
  const [open, setOpen] = useState(false)
  const { data: partiesData, isLoading } = useParties({ status: "active" })

  const parties = partiesData?.parties || []

  // Find selected party for display
  const selectedParty = parties.find((p) => p.id === value)
  const displayName = value === "independent"
    ? "Independent (No Party)"
    : selectedParty
      ? `${selectedParty.name}${selectedParty.abbreviation ? ` (${selectedParty.abbreviation})` : ""}`
      : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled || isLoading}
        >
          {displayName ? (
            <div className="flex items-center gap-2 truncate">
              {selectedParty?.logo_url ? (
                <Avatar className="h-5 w-5">
                  <AvatarImage src={selectedParty.logo_url} alt={selectedParty.name} />
                  <AvatarFallback>
                    <Building2 className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
              ) : value === "independent" ? (
                <Building2 className="h-4 w-4 text-muted-foreground" />
              ) : null}
              <span className="truncate">{displayName}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search parties..." />
          <CommandList>
            <CommandEmpty>No party found.</CommandEmpty>
            <CommandGroup>
              {showIndependent && (
                <CommandItem
                  value="independent"
                  onSelect={() => {
                    onChange("independent", "Independent")
                    setOpen(false)
                  }}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>Independent (No Party)</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4",
                      value === "independent" ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              )}
              {parties.map((party) => (
                <CommandItem
                  key={party.id}
                  value={`${party.name} ${party.abbreviation || ""}`}
                  onSelect={() => {
                    onChange(party.id, party.name)
                    setOpen(false)
                  }}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Avatar className="h-5 w-5">
                      {party.logo_url ? (
                        <AvatarImage src={party.logo_url} alt={party.name} />
                      ) : null}
                      <AvatarFallback
                        style={{ backgroundColor: party.color_primary || undefined }}
                        className="text-[10px]"
                      >
                        {party.abbreviation?.slice(0, 2) || party.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{party.name}</span>
                      {party.abbreviation && (
                        <span className="text-xs text-muted-foreground">
                          {party.abbreviation}
                        </span>
                      )}
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4",
                      value === party.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
