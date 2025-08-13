import { ReactNode } from 'react'
import { Label } from '@/shared/components/ui/label'
import { cn } from '@/shared/lib/utils'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface FormFieldProps {
  label?: string
  error?: string
  success?: string
  hint?: string
  required?: boolean
  children: ReactNode
  className?: string
  labelClassName?: string
  errorClassName?: string
  successClassName?: string
  hintClassName?: string
}

export function FormField({
  label,
  error,
  success,
  hint,
  required,
  children,
  className,
  labelClassName,
  errorClassName,
  successClassName,
  hintClassName
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className={cn('block text-sm font-medium', labelClassName)}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        {children}
        
        {/* Success/Error Icons */}
        {(error || success) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {error && <AlertCircle className="h-5 w-5 text-red-500" />}
            {success && !error && <CheckCircle className="h-5 w-5 text-green-500" />}
          </div>
        )}
      </div>
      
      {/* Hint Text */}
      {hint && !error && !success && (
        <p className={cn('text-sm text-gray-500', hintClassName)}>
          {hint}
        </p>
      )}
      
      {/* Error Message */}
      {error && (
        <div className={cn(
          'flex items-start gap-2 text-sm text-red-600',
          errorClassName
        )}>
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Success Message */}
      {success && !error && (
        <div className={cn(
          'flex items-start gap-2 text-sm text-green-600',
          successClassName
        )}>
          <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}
    </div>
  )
}