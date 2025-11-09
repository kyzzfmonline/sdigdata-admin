"use client"

import { useMemo } from "react"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface PasswordStrengthProps {
  password: string
  className?: string
}

interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
}

const requirements: PasswordRequirement[] = [
  {
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    label: "Contains uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: "Contains lowercase letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    label: "Contains number",
    test: (password) => /[0-9]/.test(password),
  },
  {
    label: "Contains special character",
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
]

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: "No password", color: "bg-gray-200" }

    const metRequirements = requirements.filter((req) => req.test(password)).length
    const lengthScore = Math.min(password.length / 16, 1) // Max score at 16 chars
    const varietyScore = metRequirements / requirements.length

    // Combined score (60% variety, 40% length)
    const totalScore = varietyScore * 0.6 + lengthScore * 0.4

    if (totalScore < 0.3) {
      return { score: totalScore, label: "Weak", color: "bg-red-500" }
    }
    if (totalScore < 0.6) {
      return { score: totalScore, label: "Fair", color: "bg-orange-500" }
    }
    if (totalScore < 0.8) {
      return { score: totalScore, label: "Good", color: "bg-yellow-500" }
    }
    return { score: totalScore, label: "Strong", color: "bg-green-500" }
  }, [password])

  const requirementStatus = useMemo(() => {
    return requirements.map((req) => ({
      ...req,
      met: req.test(password),
    }))
  }, [password])

  if (!password) {
    return null
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Password strength:</span>
          <span
            className={cn("font-medium", {
              "text-red-600": strength.label === "Weak",
              "text-orange-600": strength.label === "Fair",
              "text-yellow-600": strength.label === "Good",
              "text-green-600": strength.label === "Strong",
            })}
          >
            {strength.label}
          </span>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300 rounded-full", strength.color)}
            style={{ width: `${strength.score * 100}%` }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Password must have:</p>
        <ul className="space-y-1">
          {requirementStatus.map((req, index) => (
            <li
              key={index}
              className={cn("flex items-center gap-2 text-xs transition-colors", {
                "text-green-600": req.met,
                "text-muted-foreground": !req.met,
              })}
            >
              {req.met ? (
                <Check className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <X className="w-3.5 h-3.5 text-muted-foreground/50" />
              )}
              <span>{req.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
