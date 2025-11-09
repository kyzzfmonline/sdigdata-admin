import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    label: string
  }
  description?: string
  loading?: boolean
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  loading = false,
}: StatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null
    if (trend.value > 0) return TrendingUp
    if (trend.value < 0) return TrendingDown
    return Minus
  }

  const getTrendColor = () => {
    if (!trend) return ""
    if (trend.value > 0) return "text-success"
    if (trend.value < 0) return "text-destructive"
    return "text-muted-foreground"
  }

  const TrendIcon = getTrendIcon()

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden">
          <CardContent className="p-6">
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
      <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <motion.p
                className="text-3xl font-bold tracking-tight"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                {value}
              </motion.p>
              {trend && (
                <motion.div
                  className="flex items-center gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  {TrendIcon && <TrendIcon className={cn("h-4 w-4", getTrendColor())} />}
                  <span className={cn("text-sm font-medium", getTrendColor())}>
                    {trend.value > 0 && "+"}
                    {trend.value}%
                  </span>
                  <span className="text-sm text-muted-foreground">{trend.label}</span>
                </motion.div>
              )}
              {description && !trend && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
            <motion.div
              className="rounded-lg bg-primary/10 p-3"
              whileHover={{
                scale: 1.1,
                backgroundColor: "hsl(var(--primary) / 0.15)",
                transition: { duration: 0.2 },
              }}
            >
              <Icon className="h-6 w-6 text-primary" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
