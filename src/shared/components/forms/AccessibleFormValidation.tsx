/**
 * Accessible Form Validation System for MyDub.ai
 * Provides comprehensive form validation with accessibility features
 */

import React, { createContext, useContext, useCallback, useMemo } from 'react'
import { useForm, UseFormReturn, FieldValues, Path, FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import { useFormAnnouncer } from '@/shared/components/accessibility/ScreenReaderAnnouncer'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface ValidationRule {
  required?: boolean | string
  minLength?: { value: number; message: string }
  maxLength?: { value: number; message: string }
  pattern?: { value: RegExp; message: string }
  custom?: (value: any) => string | boolean
}

interface FormValidationContextType<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>
  isSubmitting: boolean
  submitCount: number
  errors: FieldErrors<T>
  validateField: (fieldName: Path<T>) => Promise<boolean>
  validateForm: () => Promise<boolean>
  announceValidation: (fieldName: string, isValid: boolean, error?: string) => void
}

const FormValidationContext = createContext<FormValidationContextType | null>(null)

interface AccessibleFormProviderProps<T extends FieldValues = FieldValues> {
  children: React.ReactNode
  schema?: z.ZodSchema<T>
  defaultValues?: Partial<T>
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all'
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit'
}

export function AccessibleFormProvider<T extends FieldValues = FieldValues>({
  children,
  schema,
  defaultValues,
  mode = 'onBlur',
  reValidateMode = 'onChange'
}: AccessibleFormProviderProps<T>) {
  const { announceValidation: announceValidationBase, announceFormSubmission, announceFormSuccess, announceFormError } = useFormAnnouncer()
  
  const form = useForm<T>({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
    mode,
    reValidateMode
  })

  const [submitCount, setSubmitCount] = React.useState(0)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const validateField = useCallback(async (fieldName: Path<T>): Promise<boolean> => {
    const result = await form.trigger(fieldName)
    const error = form.formState.errors[fieldName]
    
    announceValidationBase(
      String(fieldName),
      result,
      error?.message as string
    )
    
    return result
  }, [form, announceValidationBase])

  const validateForm = useCallback(async (): Promise<boolean> => {
    const result = await form.trigger()
    const errors = form.formState.errors
    const errorCount = Object.keys(errors).length
    
    if (errorCount > 0) {
      announceFormError(`Form has ${errorCount} validation error${errorCount === 1 ? '' : 's'}`)
      
      // Focus first error field
      const firstErrorField = Object.keys(errors)[0]
      const firstErrorElement = document.getElementById(firstErrorField)
      if (firstErrorElement) {
        firstErrorElement.focus()
      }
    } else {
      announceFormSuccess('Form validation passed')
    }
    
    return result
  }, [form, announceFormError, announceFormSuccess])

  const announceValidation = useCallback((fieldName: string, isValid: boolean, error?: string) => {
    announceValidationBase(fieldName, isValid, error)
  }, [announceValidationBase])

  const contextValue: FormValidationContextType<T> = useMemo(() => ({
    form,
    isSubmitting,
    submitCount,
    errors: form.formState.errors,
    validateField,
    validateForm,
    announceValidation
  }), [form, isSubmitting, submitCount, validateField, validateForm, announceValidation])

  return (
    <FormValidationContext.Provider value={contextValue}>
      {children}
    </FormValidationContext.Provider>
  )
}

export function useFormValidation<T extends FieldValues = FieldValues>() {
  const context = useContext(FormValidationContext) as FormValidationContextType<T>
  if (!context) {
    throw new Error('useFormValidation must be used within an AccessibleFormProvider')
  }
  return context
}

/**
 * Form validation summary component
 */
interface FormValidationSummaryProps {
  className?: string
  showSuccessMessage?: boolean
  successMessage?: string
}

export function FormValidationSummary({ 
  className,
  showSuccessMessage = false,
  successMessage = 'Form is valid and ready to submit'
}: FormValidationSummaryProps) {
  const { errors, form } = useFormValidation()
  const errorKeys = Object.keys(errors)
  const hasErrors = errorKeys.length > 0
  const isValid = form.formState.isValid

  if (!hasErrors && !showSuccessMessage) {
    return null
  }

  if (!hasErrors && isValid && showSuccessMessage) {
    return (
      <Alert className={cn('border-green-200 bg-green-50', className)}>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Form Valid</AlertTitle>
        <AlertDescription className="text-green-700">
          {successMessage}
        </AlertDescription>
      </Alert>
    )
  }

  if (hasErrors) {
    return (
      <Alert variant="destructive" className={className} role="alert" aria-live="assertive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>
          Form Validation Error{errorKeys.length > 1 ? 's' : ''}
        </AlertTitle>
        <AlertDescription>
          <div className="space-y-1">
            <p>Please correct the following error{errorKeys.length > 1 ? 's' : ''}:</p>
            <ul className="list-disc list-inside space-y-1" role="list">
              {errorKeys.map((key) => {
                const error = errors[key]
                const message = error?.message as string
                return (
                  <li key={key}>
                    <button
                      type="button"
                      className="text-left underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
                      onClick={() => {
                        const element = document.getElementById(key)
                        if (element) {
                          element.focus()
                          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        }
                      }}
                      aria-describedby={`${key}-error`}
                    >
                      {message || `Invalid ${key}`}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}

/**
 * Accessible form submit button with validation states
 */
interface AccessibleSubmitButtonProps extends React.ComponentProps<typeof Button> {
  children: React.ReactNode
  validateOnSubmit?: boolean
  onValidSubmit?: () => void | Promise<void>
  loadingText?: string
  successText?: string
  showValidationSummary?: boolean
}

export function AccessibleSubmitButton({
  children,
  validateOnSubmit = true,
  onValidSubmit,
  loadingText = 'Submitting...',
  successText,
  showValidationSummary = true,
  onClick,
  disabled,
  ...props
}: AccessibleSubmitButtonProps) {
  const { form, validateForm, isSubmitting } = useFormValidation()
  const { announceFormSubmission, announceFormSuccess, announceFormError } = useFormAnnouncer()
  const [submitState, setSubmitState] = React.useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    
    setSubmitState('submitting')
    announceFormSubmission()

    try {
      if (validateOnSubmit) {
        const isValid = await validateForm()
        if (!isValid) {
          setSubmitState('error')
          return
        }
      }

      if (onValidSubmit) {
        await onValidSubmit()
        setSubmitState('success')
        if (successText) {
          announceFormSuccess(successText)
        }
      } else if (onClick) {
        await onClick(e)
        setSubmitState('success')
      }
    } catch (error) {
      setSubmitState('error')
      announceFormError('Form submission failed. Please try again.')
      console.error('Form submission error:', error)
    }
  }

  const isDisabled = disabled || isSubmitting || submitState === 'submitting'
  const buttonText = submitState === 'submitting' ? loadingText : 
                    submitState === 'success' && successText ? successText :
                    children

  return (
    <div className="space-y-4">
      {showValidationSummary && <FormValidationSummary />}
      
      <Button
        type="submit"
        disabled={isDisabled}
        onClick={handleClick}
        aria-describedby={showValidationSummary ? 'form-validation-summary' : undefined}
        className={cn(
          submitState === 'success' && 'bg-green-600 hover:bg-green-700',
          props.className
        )}
        {...props}
      >
        {submitState === 'submitting' && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
        )}
        {buttonText}
      </Button>
    </div>
  )
}

/**
 * Hook for field-level validation
 */
export function useFieldValidation<T extends FieldValues = FieldValues>(fieldName: Path<T>) {
  const { form, validateField, announceValidation, errors } = useFormValidation<T>()
  const fieldError = errors[fieldName]
  const [hasBeenTouched, setHasBeenTouched] = React.useState(false)

  const validate = useCallback(async () => {
    const isValid = await validateField(fieldName)
    setHasBeenTouched(true)
    return isValid
  }, [fieldName, validateField])

  const onBlur = useCallback(async () => {
    if (hasBeenTouched || form.formState.isSubmitted) {
      await validate()
    }
  }, [validate, hasBeenTouched, form.formState.isSubmitted])

  return {
    error: fieldError?.message as string | undefined,
    hasError: !!fieldError,
    hasBeenTouched,
    validate,
    onBlur,
    register: form.register(fieldName, { onBlur })
  }
}

/**
 * Real-time validation indicator component
 */
interface ValidationIndicatorProps {
  fieldName: string
  className?: string
}

export function ValidationIndicator({ fieldName, className }: ValidationIndicatorProps) {
  const { errors, form } = useFormValidation()
  const hasError = !!errors[fieldName]
  const fieldState = form.getFieldState(fieldName)
  const isDirty = fieldState.isDirty
  const isTouched = fieldState.isTouched

  if (!isDirty && !isTouched) {
    return null
  }

  return (
    <div className={cn('flex items-center ml-2', className)} aria-hidden="true">
      {hasError ? (
        <AlertTriangle className="h-4 w-4 text-destructive" />
      ) : (
        <CheckCircle className="h-4 w-4 text-green-600" />
      )}
    </div>
  )
}

/**
 * Common validation schemas
 */
export const validationSchemas = {
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
    
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number'),
    
  phone: z.string()
    .min(1, 'Phone number is required')
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number'),
    
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
    
  required: z.string().min(1, 'This field is required'),
  
  url: z.string().url('Please enter a valid URL'),
  
  postalCode: z.string()
    .min(1, 'Postal code is required')
    .regex(/^[\d\-\s]+$/, 'Please enter a valid postal code')
}

export default AccessibleFormProvider