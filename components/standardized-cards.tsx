"use client"

import React from "react"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps, Variants } from "framer-motion"
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react"

type CardVariant = "default" | "elevated" | "outlined" | "filled" | "gradient"
type CardSize = "sm" | "md" | "lg"
type CardStatus = "default" | "success" | "warning" | "error" | "info"

interface BaseCardProps {
  variant?: CardVariant
  size?: CardSize
  status?: CardStatus
  hover?: boolean
  animate?: boolean
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

interface StatCardProps extends Omit<BaseCardProps, "children"> {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label: string
    direction?: "up" | "down" | "neutral"
  }
  badge?: string
  loading?: boolean
}

interface ContentCardProps extends BaseCardProps {
  title?: string
  description?: string
  icon?: LucideIcon
  actions?: React.ReactNode
}

// Base standardized card component
export function StandardizedCard({
  variant = "default",
  size = "md",
  status = "default",
  hover = true,
  animate = true,
  className,
  children,
  onClick,
}: BaseCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "elevated":
        return "shadow-lg border-0 bg-card"
      case "outlined":
        return "border-2 border-border bg-transparent shadow-none"
      case "filled":
        return "border-0 bg-muted/50 shadow-sm"
      case "gradient":
        return "border-0 bg-gradient-to-br from-card via-card to-card/80 shadow-lg backdrop-blur-sm"
      default:
        return "border border-border bg-card shadow-sm"
    }
  }

  const getStatusStyles = () => {
    if (variant === "gradient") return ""

    switch (status) {
      case "success":
        return "border-success/20 bg-success/5"
      case "warning":
        return "border-warning/20 bg-warning/5"
      case "error":
        return "border-destructive/20 bg-destructive/5"
      case "info":
        return "border-info/20 bg-info/5"
      default:
        return ""
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

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  }

  const hoverVariants: Variants = hover
    ? {
        hover: {
          y: -2,
          boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
          transition: { duration: 0.2 },
        },
      }
    : {}

  if (animate) {
    return (
      <motion.div
        className={cn(
          "rounded-lg transition-all duration-200",
          getVariantStyles(),
          getStatusStyles(),
          hover && "hover:shadow-md cursor-pointer",
          className
        )}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={hover ? "hover" : undefined}
        onClick={onClick}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-lg transition-all duration-200",
        getVariantStyles(),
        getStatusStyles(),
        hover && "hover:shadow-md cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// Standardized stat card for metrics and KPIs
export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  badge,
  loading = false,
  variant = "default",
  size = "md",
  status = "default",
  className,
  ...props
}: StatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null
    if (trend.direction === "up" || (!trend.direction && trend.value > 0)) return TrendingUp
    if (trend.direction === "down" || (!trend.direction && trend.value < 0)) return TrendingDown
    return Minus
  }

  const getTrendColor = () => {
    if (!trend) return "text-muted-foreground"
    if (trend.direction === "up" || (!trend.direction && trend.value > 0)) return "text-success"
    if (trend.direction === "down" || (!trend.direction && trend.value < 0))
      return "text-destructive"
    return "text-muted-foreground"
  }

  const TrendIcon = getTrendIcon()

  if (loading) {
    return (
      <StandardizedCard
        variant={variant}
        size={size}
        status={status}
        className={className}
        animate={false}
      >
        <CardContent className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-8 w-8 bg-muted rounded" />
          </div>
          <div className="h-8 bg-muted rounded w-16 mb-2" />
          <div className="h-3 bg-muted rounded w-20" />
        </CardContent>
      </StandardizedCard>
    )
  }

  return (
    <StandardizedCard
      variant={variant}
      size={size}
      status={status}
      className={className}
      {...props}
    >
      <CardContent>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-medium text-muted-foreground truncate">{title}</h3>
              {badge && (
                <Badge variant="secondary" className="text-xs">
                  {badge}
                </Badge>
              )}
            </div>
            <motion.div
              className="flex items-baseline gap-2"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
              {trend && TrendIcon && (
                <TrendIcon className={cn("h-4 w-4 flex-shrink-0", getTrendColor())} />
              )}
            </motion.div>
            {trend && (
              <motion.div
                className="flex items-center gap-1 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <span className={cn("text-sm font-medium", getTrendColor())}>
                  {trend.value > 0 && "+"}
                  {trend.value}%
                </span>
                <span className="text-sm text-muted-foreground">{trend.label}</span>
              </motion.div>
            )}
            {description && !trend && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {Icon && (
            <motion.div
              className={cn(
                "flex-shrink-0 rounded-lg p-2",
                status === "success"
                  ? "bg-success/10"
                  : status === "warning"
                    ? "bg-warning/10"
                    : status === "error"
                      ? "bg-destructive/10"
                      : status === "info"
                        ? "bg-info/10"
                        : "bg-primary/10"
              )}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  status === "success"
                    ? "text-success"
                    : status === "warning"
                      ? "text-warning"
                      : status === "error"
                        ? "text-destructive"
                        : status === "info"
                          ? "text-info"
                          : "text-primary"
                )}
              />
            </motion.div>
          )}
        </div>
      </CardContent>
    </StandardizedCard>
  )
}

// Standardized content card for forms, settings, etc.
export function ContentCard({
  title,
  description,
  icon: Icon,
  actions,
  variant = "default",
  size = "md",
  status = "default",
  className,
  children,
  ...props
}: ContentCardProps) {
  return (
    <StandardizedCard
      variant={variant}
      size={size}
      status={status}
      className={cn("p-0", className)}
      {...props}
    >
      {(title || description || Icon || actions) && (
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {Icon && (
                <div
                  className={cn(
                    "flex-shrink-0 rounded-lg p-2 mt-0.5",
                    status === "success"
                      ? "bg-success/10"
                      : status === "warning"
                        ? "bg-warning/10"
                        : status === "error"
                          ? "bg-destructive/10"
                          : status === "info"
                            ? "bg-info/10"
                            : "bg-primary/10"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      status === "success"
                        ? "text-success"
                        : status === "warning"
                          ? "text-warning"
                          : status === "error"
                            ? "text-destructive"
                            : status === "info"
                              ? "text-info"
                              : "text-primary"
                    )}
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                {title && (
                  <CardTitle className="text-lg font-semibold text-foreground mb-1">
                    {title}
                  </CardTitle>
                )}
                {description && (
                  <CardDescription className="text-sm text-muted-foreground">
                    {description}
                  </CardDescription>
                )}
              </div>
            </div>
            {actions && <div className="flex-shrink-0 ml-4">{actions}</div>}
          </div>
        </CardHeader>
      )}
      <CardContent className={cn(!(title || description || Icon || actions) && "pt-6")}>
        {children}
      </CardContent>
    </StandardizedCard>
  )
}

// Specialized form card for settings and configuration
export function FormCard({
  title,
  description,
  icon: Icon,
  children,
  variant = "outlined",
  size = "md",
  className,
  ...props
}: Omit<ContentCardProps, "actions">) {
  return (
    <ContentCard
      title={title}
      description={description}
      icon={Icon}
      variant={variant}
      size={size}
      className={cn("space-y-6", className)}
      {...props}
    >
      {children}
    </ContentCard>
  )
}
