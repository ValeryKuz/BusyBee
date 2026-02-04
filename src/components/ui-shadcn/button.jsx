import * as React from "react"
import { cn } from "@/lib/utils"

const buttonVariants = {
  variant: {
    default: "bg-honey hover:bg-honey-dark text-gray-800 shadow-sm hover:shadow-md",
    secondary: "bg-sky hover:bg-sky/90 text-white shadow-sm hover:shadow-md",
    accent: "bg-success hover:bg-success/90 text-white shadow-sm hover:shadow-md",
    destructive: "bg-coral hover:bg-coral/90 text-white shadow-sm hover:shadow-md",
    outline: "border-2 border-honey bg-transparent hover:bg-honey/10 text-gray-700",
    ghost: "hover:bg-honey/20 text-gray-700",
    link: "text-honey underline-offset-4 hover:underline",
  },
  size: {
    default: "h-11 px-5 py-2.5 text-base rounded-xl",
    sm: "h-9 px-4 py-2 text-sm rounded-xl",
    lg: "h-12 px-6 py-3 text-lg rounded-xl",
    icon: "h-10 w-10 rounded-xl",
  },
}

const Button = React.forwardRef(({ 
  className, 
  variant = "default", 
  size = "default", 
  children,
  ...props 
}, ref) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50",
        buttonVariants.variant[variant],
        buttonVariants.size[size],
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
