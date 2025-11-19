/**
 * Format a date string to a human-friendly relative time
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  // Less than 1 minute
  if (diffMins < 1) return "Just now"
  // Less than 60 minutes
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`
  // Less than 24 hours
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`
  // Less than 7 days
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`

  // More than 7 days - show full date
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Format a date string to a full readable format
 */
export function formatFullDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

/**
 * Check if a string is likely an image URL
 */
export function isImageUrl(url: string): boolean {
  if (typeof url !== "string") return false
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"]
  const lowerUrl = url.toLowerCase()
  return imageExtensions.some((ext) => lowerUrl.includes(ext)) || lowerUrl.includes("image")
}

/**
 * Check if a string is a URL
 */
export function isUrl(str: string): boolean {
  if (typeof str !== "string") return false
  try {
    const url = new URL(str)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}
