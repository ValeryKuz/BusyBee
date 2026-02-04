import * as React from "react"
import { cn } from "@/lib/utils"

const badgeVariants = {
  default: "bg-honey text-gray-800",
  secondary: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-700",
  destructive: "bg-red-100 text-red-700",
  outline: "border border-honey text-gray-700 bg-transparent",
  honey: "bg-honey/20 text-amber-700",
}

const Badge = React.forwardRef(({ className, variant = "default", ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold transition-colors",
      badgeVariants[variant],
      className
    )}
    {...props}
  />
))
Badge.displayName = "Badge"

export { Badge, badgeVariants }
