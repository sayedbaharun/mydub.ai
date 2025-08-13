import * as React from "react"

import { cn } from '@/shared/lib/utils'
import { useFormAnnouncer } from '@/shared/components/accessibility/ScreenReaderAnnouncer'

interface InputProps extends React.ComponentProps<"input"> {
  /** Whether the input has an error state */
  hasError?: boolean
  /** Field name for accessibility announcements */
  fieldName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, hasError, fieldName, onBlur, onFocus, ...props }, ref) => {
    const { announceFieldError } = useFormAnnouncer()
    const [isFocused, setIsFocused] = React.useState(false)

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      onBlur?.(e)
      
      // Announce validation errors on blur if present
      if (hasError && fieldName && props['aria-describedby']) {
        const errorElement = document.getElementById(props['aria-describedby'])
        if (errorElement?.textContent) {
          announceFieldError(fieldName, errorElement.textContent)
        }
      }
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-colors",
          // Error state styling
          hasError && "border-destructive focus-visible:ring-destructive",
          // Focus state styling
          isFocused && "ring-2 ring-ring ring-offset-2",
          className
        )}
        ref={ref}
        onFocus={handleFocus}
        onBlur={handleBlur}
        // Enhanced ARIA attributes
        aria-invalid={hasError}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
