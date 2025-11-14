/**
 * Field Type Card
 * Individual card for each field type in the palette
 */

"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { FieldTypeConfig } from "@/lib/form-builder/field-configs"

interface FieldTypeCardProps {
  config: FieldTypeConfig
  onClick: () => void
  index: number
}

export function FieldTypeCard({ config, onClick, index }: FieldTypeCardProps) {
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Button
        onClick={onClick}
        variant="outline"
        className="w-full justify-start h-auto p-4 hover:bg-muted hover:border-primary transition-all group"
        aria-label={`Add ${config.label} field. ${config.description}`}
      >
        <div className="flex items-start gap-3 w-full">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 text-left min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm text-foreground">{config.label}</h4>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle
                      className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-help"
                      aria-label="Field information"
                    />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="font-semibold mb-1">{config.label}</p>
                    <p className="text-xs mb-2">{config.description}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold">Example use:</span> {config.exampleUseCase}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{config.description}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground">
                {config.category}
              </span>

              {config.supportsOptions && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Options
                </span>
              )}

              {config.supportsValidation && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Validation
                </span>
              )}
            </div>
          </div>
        </div>
      </Button>
    </motion.div>
  )
}
