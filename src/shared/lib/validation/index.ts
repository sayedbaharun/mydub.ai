/**
 * Validation utilities exports
 */

// Export all schemas and types
export * from './schemas'

// Export hooks
export * from './hooks'

// Export components
export * from './components'

// Export sanitizers separately for easy access
export { sanitizers } from './schemas'

// Re-export commonly used schemas for convenience
export {
  emailSchema,
  passwordSchema,
  uaePhoneSchema,
  usernameSchema,
  urlSchema,
  safeTextSchema,
  loginSchema,
  signupSchema,
  profileSchema,
  contactFormSchema,
  searchQuerySchema,
  paginationSchema,
  uuidSchema,
} from './schemas'