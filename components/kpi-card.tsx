"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  LucideIcon,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface KPICardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    label: string
    direction?: "up" | "down" | "neutral"
  }
  description?: string
  loading?: boolean
  variant?: "default" | "success" | "warning" | "error" | "info"
  size?: "sm" | "md" | "lg"
}

export function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  loading = false,
  variant = "default",
  size = "md",
}: KPICardProps) {
  const getTrendIcon = () => {
    if (!trend) return null
    if (trend.direction === "up" || (!trend.direction && trend.value > 0)) return TrendingUp
    if (trend.direction === "down" || (!trend.direction && trend.value < 0)) return TrendingDown
    return Minus
  }

  const getTrendColor = () => {
    if (!trend) return ""
    if (trend.direction === "up" || (!trend.direction && trend.value > 0)) return "text-success"
    if (trend.direction === "down" || (!trend.direction && trend.value < 0))
      return "text-destructive"
    return "text-muted-foreground"
  }

  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "border-success/20 bg-success/5"
      case "warning":
        return "border-warning/20 bg-warning/5"
      case "error":
        return "border-destructive/20 bg-destructive/5"
      case "info":
        return "border-info/20 bg-info/5"
      default:
        return "border-border bg-card hover:shadow-lg"
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "p-4"
      case "lg":
        return "p-8"
      default:
        return "p-6"
    }
  }

  const TrendIcon = getTrendIcon()

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={cn("overflow-hidden border-0", getVariantStyles())}>
          <CardContent className={getSizeStyles()}>
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          "overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl",
          getVariantStyles()
        )}
      >
        <CardContent className={getSizeStyles()}>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <motion.p
                className="text-sm font-medium text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {title}
              </motion.p>
              <motion.div
                className="flex items-baseline gap-2"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <span
                  className={cn(
                    "font-bold tracking-tight",
                    size === "sm" ? "text-2xl" : size === "lg" ? "text-4xl" : "text-3xl"
                  )}
                >
                  {value}
                </span>
                {trend && TrendIcon && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  >
                    <TrendIcon className={cn("h-4 w-4", getTrendColor())} />
                  </motion.div>
                )}
              </motion.div>
              {trend && (
                <motion.div
                  className="flex items-center gap-1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <span className={cn("text-sm font-medium", getTrendColor())}>
                    {trend.value > 0 && "+"}
                    {trend.value}%
                  </span>
                  <span className="text-sm text-muted-foreground">{trend.label}</span>
                </motion.div>
              )}
              {description && !trend && (
                <motion.p
                  className="text-xs text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {description}
                </motion.p>
              )}
            </div>
            <motion.div
              className={cn(
                "rounded-lg bg-primary/10 p-3 flex-shrink-0",
                variant === "success" && "bg-success/10",
                variant === "warning" && "bg-warning/10",
                variant === "error" && "bg-destructive/10",
                variant === "info" && "bg-info/10"
              )}
              whileHover={{
                scale: 1.1,
                backgroundColor:
                  variant === "success"
                    ? "hsl(var(--success) / 0.15)"
                    : variant === "warning"
                      ? "hsl(var(--warning) / 0.15)"
                      : variant === "error"
                        ? "hsl(var(--destructive) / 0.15)"
                        : "hsl(var(--primary) / 0.15)",
                transition: { duration: 0.2 },
              }}
            >
              <Icon
                className={cn(
                  "h-6 w-6",
                  variant === "success"
                    ? "text-success"
                    : variant === "warning"
                      ? "text-warning"
                      : variant === "error"
                        ? "text-destructive"
                        : variant === "info"
                          ? "text-info"
                          : "text-primary"
                )}
              />
            </motion.div>
          </div>

          {/* Progress bar for certain metrics */}
          {title.toLowerCase().includes("rate") &&
            typeof value === "string" &&
            value.includes("%") && (
              <motion.div
                className="mt-4"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <div className="w-full bg-muted rounded-full h-2">
                  <motion.div
                    className="bg-primary h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${parseInt(value)}%` }}
                    transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
