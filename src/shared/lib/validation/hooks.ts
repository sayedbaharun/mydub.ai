/**
 * Validation hooks for form handling
 */

import { useState, useCallback } from 'react'
import { z, ZodError, ZodSchema } from 'zod'
import { sanitizers } from './schemas'

interface ValidationError {
  path: string
  message: string
}

interface UseValidationOptions {
  mode?: 'onChange' | 'onBlur' | 'onSubmit'
  revalidateMode?: 'onChange' | 'onBlur' | 'onSubmit'
  sanitize?: boolean
}

export function useValidation<T extends ZodSchema>(
  schema: T,
  options: UseValidationOptions = {}
) {
  const {
    mode = 'onChange',
    revalidateMode = 'onChange',
    sanitize = true,
  } = options

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isValidating, setIsValidating] = useState(false)
  const [hasValidated, setHasValidated] = useState(false)

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  const validate = useCallback(
    async (data: unknown): Promise<z.infer<T> | null> => {
      setIsValidating(true)
      setHasValidated(true)

      try {
        const validated = await schema.parseAsync(data)
        clearErrors()
        setIsValidating(false)
        return validated
      } catch (error) {
        if (error instanceof ZodError) {
          const newErrors: Record<string, string> = {}
          error.errors.forEach((err) => {
            const path = err.path.join('.')
            if (!newErrors[path]) {
              newErrors[path] = err.message
            }
          })
          setErrors(newErrors)
        }
        setIsValidating(false)
        return null
      }
    },
    [schema, clearErrors]
  )

  const validateField = useCallback(
    async (field: string, value: unknown): Promise<boolean> => {
      try {
        // Create a partial schema for single field validation
        const fieldSchema = schema.shape[field as keyof typeof schema.shape]
        if (fieldSchema) {
          await fieldSchema.parseAsync(value)
          clearFieldError(field)
          return true
        }
      } catch (error) {
        if (error instanceof ZodError) {
          setErrors((prev) => ({
            ...prev,
            [field]: error.errors[0]?.message || 'Invalid value',
          }))
        }
      }
      return false
    },
    [schema, clearFieldError]
  )

  return {
    errors,
    isValidating,
    hasValidated,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
  }
}

/**
 * Hook for form handling with validation
 */
interface UseFormOptions<T> {
  defaultValues?: Partial<T>
  schema?: ZodSchema<T>
  onSubmit?: (data: T) => void | Promise<void>
  sanitize?: boolean
}

export function useForm<T extends Record<string, any>>(
  options: UseFormOptions<T> = {}
) {
  const { defaultValues = {}, schema, onSubmit, sanitize = true } = options
  
  const [values, setValues] = useState<Partial<T>>(defaultValues)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validation = schema ? useValidation(schema) : null

  const handleChange = useCallback(
    (field: keyof T) => async (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const value = e.target.type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : e.target.value

      // Apply sanitization for text inputs
      let sanitizedValue = value
      if (sanitize && typeof value === 'string' && e.target.type === 'text') {
        sanitizedValue = sanitizers.normalizeWhitespace(value)
      }

      setValues((prev) => ({ ...prev, [field]: sanitizedValue }))

      // Validate on change if touched
      if (validation && touched[field as string]) {
        await validation.validateField(field as string, sanitizedValue)
      }
    },
    [validation, touched, sanitize]
  )

  const handleBlur = useCallback(
    (field: keyof T) => async () => {
      setTouched((prev) => ({ ...prev, [field]: true }))
      
      // Validate on blur
      if (validation && values[field] !== undefined) {
        await validation.validateField(field as string, values[field])
      }
    },
    [validation, values]
  )

  const setValue = useCallback(
    (field: keyof T, value: T[keyof T]) => {
      setValues((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const setFieldError = useCallback(
    (field: keyof T, error: string) => {
      if (validation) {
        validation.errors[field as string] = error
      }
    },
    [validation]
  )

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => async () => {
      if (e) {
        e.preventDefault()
      }

      setIsSubmitting(true)

      try {
        // Mark all fields as touched
        const allTouched = Object.keys(values).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {}
        )
        setTouched(allTouched)

        // Validate if schema provided
        if (validation) {
          const validatedData = await validation.validate(values)
          if (!validatedData) {
            setIsSubmitting(false)
            return
          }

          if (onSubmit) {
            await onSubmit(validatedData as T)
          }
        } else if (onSubmit) {
          await onSubmit(values as T)
        }
      } catch (error) {
        console.error('Form submission error:', error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [values, validation, onSubmit]
  )

  const reset = useCallback(() => {
    setValues(defaultValues)
    setTouched({})
    validation?.clearErrors()
  }, [defaultValues, validation])

  const getFieldProps = useCallback(
    (field: keyof T) => ({
      name: field as string,
      value: values[field] || '',
      onChange: handleChange(field),
      onBlur: handleBlur(field),
      error: validation?.errors[field as string],
      touched: touched[field as string],
    }),
    [values, handleChange, handleBlur, validation, touched]
  )

  return {
    values,
    errors: validation?.errors || {},
    touched,
    isSubmitting,
    isValid: validation ? Object.keys(validation.errors).length === 0 : true,
    handleChange,
    handleBlur,
    handleSubmit,
    setValue,
    setFieldError,
    reset,
    getFieldProps,
  }
}

/**
 * Hook for file validation
 */
export function useFileValidation(
  schema: ZodSchema<File>,
  options: { maxFiles?: number } = {}
) {
  const { maxFiles = 1 } = options
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<string[]>([])

  const validateFile = useCallback(
    async (file: File): Promise<boolean> => {
      try {
        await schema.parseAsync(file)
        return true
      } catch (error) {
        if (error instanceof ZodError) {
          setErrors((prev) => [...prev, error.errors[0]?.message || 'Invalid file'])
        }
        return false
      }
    },
    [schema]
  )

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = Array.from(e.target.files || [])
      setErrors([])

      if (fileList.length > maxFiles) {
        setErrors([`Maximum ${maxFiles} file(s) allowed`])
        return
      }

      const validFiles: File[] = []
      for (const file of fileList) {
        const isValid = await validateFile(file)
        if (isValid) {
          validFiles.push(file)
        }
      }

      setFiles(validFiles)
    },
    [maxFiles, validateFile]
  )

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setErrors((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clearFiles = useCallback(() => {
    setFiles([])
    setErrors([])
  }, [])

  return {
    files,
    errors,
    handleFileChange,
    removeFile,
    clearFiles,
    hasErrors: errors.length > 0,
  }
}