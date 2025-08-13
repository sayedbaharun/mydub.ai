import { z } from 'zod'

// Common validation schemas
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

export const strongPasswordSchema = passwordSchema
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
  .optional()

// Validation helpers
export const validateEmail = (email: string): string | null => {
  try {
    emailSchema.parse(email)
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0].message
    }
    return 'Invalid email'
  }
}

export const validatePassword = (password: string, strong = false): string | null => {
  try {
    const schema = strong ? strongPasswordSchema : passwordSchema
    schema.parse(password)
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0].message
    }
    return 'Invalid password'
  }
}

export const validatePasswordMatch = (password: string, confirmPassword: string): string | null => {
  if (password !== confirmPassword) {
    return 'Passwords do not match'
  }
  return null
}

// Real-time validation with debouncing
export const createValidator = <T>(
  schema: z.Schema<T>,
  debounceMs = 300
) => {
  let timeoutId: NodeJS.Timeout | null = null

  return (value: T): Promise<string | null> => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        try {
          schema.parse(value)
          resolve(null)
        } catch (error) {
          if (error instanceof z.ZodError) {
            resolve(error.errors[0].message)
          } else {
            resolve('Validation error')
          }
        }
      }, debounceMs)
    })
  }
}

// Form-level validation
export const validateForm = <T extends Record<string, any>>(
  data: T,
  schema: z.Schema<T>
): Record<keyof T, string> | null => {
  try {
    schema.parse(data)
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {}
      error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message
        }
      })
      return errors as Record<keyof T, string>
    }
    return null
  }
}