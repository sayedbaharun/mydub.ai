/**
 * Common validation schemas using Zod
 * Provides reusable validation patterns for the application
 */

import { z } from 'zod'

// Regular expressions for validation
const patterns = {
  // UAE phone number format
  uaePhone: /^(\+971|00971|971|0)?5[0-9]{8}$/,
  // International phone with country code
  internationalPhone: /^\+[1-9]\d{1,14}$/,
  // Strong password: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  // URL safe string (no special chars except dash and underscore)
  urlSafe: /^[a-zA-Z0-9_-]+$/,
  // Basic HTML tag detection for XSS prevention
  htmlTags: /<[^>]*>/,
  // SQL injection patterns
  sqlInjection: /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript|onload|onerror|onclick)\b)/i,
}

// Custom error messages
const errorMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  password: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  url: 'Please enter a valid URL',
  min: (min: number) => `Must be at least ${min} characters`,
  max: (max: number) => `Must not exceed ${max} characters`,
  username: 'Username can only contain letters, numbers, dash, and underscore',
  noHtml: 'HTML tags are not allowed',
  noSql: 'Invalid characters detected',
}

// Basic sanitization helpers
export const sanitizers = {
  // Remove HTML tags
  stripHtml: (str: string) => str.replace(/<[^>]*>/g, ''),
  
  // Escape HTML entities
  escapeHtml: (str: string) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }
    return str.replace(/[&<>"']/g, (m) => map[m])
  },
  
  // Remove potential SQL injection characters
  escapeSql: (str: string) => str.replace(/['";\\]/g, ''),
  
  // Trim and normalize whitespace
  normalizeWhitespace: (str: string) => str.trim().replace(/\s+/g, ' '),
  
  // Convert to URL-safe string
  toUrlSafe: (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
}

// Email validation with sanitization
export const emailSchema = z
  .string({ required_error: errorMessages.required })
  .trim()
  .toLowerCase()
  .email(errorMessages.email)
  .max(255, errorMessages.max(255))
  .transform((val) => sanitizers.normalizeWhitespace(val))

// Password validation
export const passwordSchema = z
  .string({ required_error: errorMessages.required })
  .min(8, errorMessages.min(8))
  .max(128, errorMessages.max(128))
  .regex(patterns.strongPassword, errorMessages.password)

// Phone number validation (UAE format)
export const uaePhoneSchema = z
  .string({ required_error: errorMessages.required })
  .transform((val) => val.replace(/\s+/g, '').replace(/^0/, ''))
  .pipe(z.string().regex(patterns.uaePhone, errorMessages.phone))

// International phone number
export const internationalPhoneSchema = z
  .string({ required_error: errorMessages.required })
  .transform((val) => val.replace(/\s+/g, ''))
  .pipe(z.string().regex(patterns.internationalPhone, errorMessages.phone))

// Username validation
export const usernameSchema = z
  .string({ required_error: errorMessages.required })
  .min(3, errorMessages.min(3))
  .max(30, errorMessages.max(30))
  .regex(patterns.urlSafe, errorMessages.username)
  .transform((val) => val.toLowerCase())

// URL validation
export const urlSchema = z
  .string({ required_error: errorMessages.required })
  .url(errorMessages.url)
  .max(2048, errorMessages.max(2048))
  .refine((url) => {
    try {
      const parsed = new URL(url)
      return ['http:', 'https:'].includes(parsed.protocol)
    } catch {
      return false
    }
  }, 'Only HTTP(S) URLs are allowed')

// Safe text input (no HTML, no SQL injection)
export const safeTextSchema = z
  .string({ required_error: errorMessages.required })
  .transform((val) => sanitizers.normalizeWhitespace(val))
  .refine((val) => !patterns.htmlTags.test(val), errorMessages.noHtml)
  .refine((val) => !patterns.sqlInjection.test(val), errorMessages.noSql)
  .transform((val) => sanitizers.escapeHtml(val))

// Rich text input (allows some HTML but sanitized)
export const richTextSchema = z
  .string({ required_error: errorMessages.required })
  .transform((val) => {
    // In production, use a proper HTML sanitizer like DOMPurify
    // For now, we'll do basic sanitization
    return val
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .trim()
  })

// Date validation
export const dateSchema = z
  .string({ required_error: errorMessages.required })
  .or(z.date())
  .transform((val) => {
    if (typeof val === 'string') {
      const date = new Date(val)
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date')
      }
      return date
    }
    return val
  })

// File validation schemas
export const imageFileSchema = z
  .instanceof(File, { message: 'Please select a file' })
  .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
  .refine(
    (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
    'Only JPEG, PNG, and WebP images are allowed'
  )

export const documentFileSchema = z
  .instanceof(File, { message: 'Please select a file' })
  .refine((file) => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
  .refine(
    (file) => [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ].includes(file.type),
    'Only PDF, Word documents, and text files are allowed'
  )

// Common form schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
})

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  fullName: safeTextSchema.min(2, errorMessages.min(2)).max(100, errorMessages.max(100)),
  acceptTerms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const profileSchema = z.object({
  fullName: safeTextSchema.min(2).max(100),
  username: usernameSchema.optional(),
  bio: safeTextSchema.max(500).optional(),
  website: urlSchema.optional().or(z.literal('')),
  phone: uaePhoneSchema.optional().or(z.literal('')),
  avatar: imageFileSchema.optional(),
})

export const contactFormSchema = z.object({
  name: safeTextSchema.min(2).max(100),
  email: emailSchema,
  subject: safeTextSchema.min(5).max(200),
  message: safeTextSchema.min(10).max(2000),
  category: z.enum(['general', 'support', 'feedback', 'complaint']),
})

// Search query validation
export const searchQuerySchema = z
  .string()
  .min(1, 'Search query is required')
  .max(200, errorMessages.max(200))
  .transform((val) => sanitizers.normalizeWhitespace(val))
  .refine((val) => !patterns.sqlInjection.test(val), errorMessages.noSql)
  .transform((val) => sanitizers.escapeSql(val))

// Pagination validation
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['asc', 'desc']).optional(),
  sortBy: z.string().regex(/^[a-zA-Z_]+$/).optional(),
})

// ID validation (UUID v4)
export const uuidSchema = z
  .string()
  .uuid('Invalid ID format')

// Array validation with limits
export const tagArraySchema = z
  .array(safeTextSchema.max(50))
  .max(10, 'Maximum 10 tags allowed')
  .optional()

// Composite schemas for API requests
export const createPostSchema = z.object({
  title: safeTextSchema.min(5).max(200),
  content: richTextSchema.min(10).max(10000),
  tags: tagArraySchema,
  category: z.enum(['news', 'tourism', 'government', 'events']),
  published: z.boolean().default(false),
})

export const updateUserPreferencesSchema = z.object({
  language: z.enum(['en', 'ar', 'hi', 'ur']),
  theme: z.enum(['light', 'dark', 'system']),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean(),
  }),
  privacy: z.object({
    showProfile: z.boolean(),
    allowMessages: z.boolean(),
    shareData: z.boolean(),
  }),
})

// Export type inference helpers
export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type ContactFormInput = z.infer<typeof contactFormSchema>
export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdateUserPreferencesInput = z.infer<typeof updateUserPreferencesSchema>