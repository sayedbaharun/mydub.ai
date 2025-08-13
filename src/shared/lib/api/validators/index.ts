/**
 * API Endpoint Validators
 * Pre-configured validators for common API endpoints
 */

import { z } from 'zod'
import {
  emailSchema,
  passwordSchema,
  safeTextSchema,
  uaePhoneSchema,
  paginationSchema,
  uuidSchema,
  searchQuerySchema,
} from '@/shared/lib/validation/schemas'

// Auth endpoint validators
export const authValidators = {
  login: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
    remember: z.boolean().optional(),
  }),

  signup: z.object({
    email: emailSchema,
    password: passwordSchema,
    fullName: safeTextSchema.min(2).max(100),
    acceptTerms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
  }),

  forgotPassword: z.object({
    email: emailSchema,
  }),

  resetPassword: z.object({
    token: z.string().min(32),
    password: passwordSchema,
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
  }),

  verifyEmail: z.object({
    token: z.string().min(32),
  }),
}

// User endpoint validators
export const userValidators = {
  updateProfile: z.object({
    fullName: safeTextSchema.min(2).max(100).optional(),
    bio: safeTextSchema.max(500).optional(),
    website: z.string().url().optional().or(z.literal('')),
    phone: uaePhoneSchema.optional().or(z.literal('')),
    language: z.enum(['en', 'ar', 'hi', 'ur']).optional(),
  }),

  updatePreferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    notifications: z
      .object({
        email: z.boolean(),
        push: z.boolean(),
        sms: z.boolean(),
      })
      .optional(),
    privacy: z
      .object({
        showProfile: z.boolean(),
        allowMessages: z.boolean(),
        shareData: z.boolean(),
      })
      .optional(),
  }),

  deleteAccount: z.object({
    password: z.string().min(1),
    reason: safeTextSchema.max(500).optional(),
  }),
}

// Content endpoint validators
export const contentValidators = {
  create: z.object({
    title: safeTextSchema.min(5).max(200),
    content: safeTextSchema.min(10).max(10000),
    category: z.enum(['news', 'tourism', 'government', 'events']),
    tags: z.array(safeTextSchema.max(50)).max(10).optional(),
    published: z.boolean().default(false),
    metadata: z.record(z.any()).optional(),
  }),

  update: z.object({
    title: safeTextSchema.min(5).max(200).optional(),
    content: safeTextSchema.min(10).max(10000).optional(),
    category: z.enum(['news', 'tourism', 'government', 'events']).optional(),
    tags: z.array(safeTextSchema.max(50)).max(10).optional(),
    published: z.boolean().optional(),
    metadata: z.record(z.any()).optional(),
  }),

  list: z.object({
    ...paginationSchema.shape,
    category: z.enum(['news', 'tourism', 'government', 'events']).optional(),
    search: searchQuerySchema.optional(),
    tags: z.array(z.string()).optional(),
    published: z.boolean().optional(),
    authorId: uuidSchema.optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }),

  moderate: z.object({
    action: z.enum(['approve', 'reject', 'flag']),
    reason: safeTextSchema.max(500).optional(),
    notes: safeTextSchema.max(1000).optional(),
  }),
}

// Search endpoint validators
export const searchValidators = {
  global: z.object({
    query: searchQuerySchema,
    type: z.enum(['all', 'news', 'tourism', 'government', 'events']).optional(),
    ...paginationSchema.shape,
    filters: z
      .object({
        dateFrom: z.string().datetime().optional(),
        dateTo: z.string().datetime().optional(),
        language: z.enum(['en', 'ar', 'hi', 'ur']).optional(),
        location: z.string().optional(),
      })
      .optional(),
  }),

  suggestions: z.object({
    query: z.string().min(2).max(50),
    type: z.enum(['all', 'news', 'tourism', 'government', 'events']).optional(),
    limit: z.number().min(1).max(10).default(5),
  }),
}

// Comment endpoint validators
export const commentValidators = {
  create: z.object({
    content: safeTextSchema.min(1).max(1000),
    parentId: uuidSchema.optional(),
  }),

  update: z.object({
    content: safeTextSchema.min(1).max(1000),
  }),

  report: z.object({
    reason: z.enum(['spam', 'inappropriate', 'harassment', 'misinformation', 'other']),
    details: safeTextSchema.max(500).optional(),
  }),
}

// File upload validators
export const fileValidators = {
  image: z.object({
    filename: z.string().regex(/^[a-zA-Z0-9_\-.]+$/),
    mimetype: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    size: z.number().max(5 * 1024 * 1024), // 5MB
  }),

  document: z.object({
    filename: z.string().regex(/^[a-zA-Z0-9_\-.]+$/),
    mimetype: z.enum([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]),
    size: z.number().max(10 * 1024 * 1024), // 10MB
  }),

  avatar: z.object({
    filename: z.string().regex(/^[a-zA-Z0-9_\-.]+$/),
    mimetype: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    size: z.number().max(2 * 1024 * 1024), // 2MB
  }),
}

// Analytics endpoint validators
export const analyticsValidators = {
  track: z.object({
    event: z.string().min(1).max(100),
    properties: z.record(z.any()).optional(),
    timestamp: z.string().datetime().optional(),
  }),

  pageView: z.object({
    url: z.string().url(),
    title: z.string().optional(),
    referrer: z.string().url().optional(),
    duration: z.number().positive().optional(),
  }),
}

// Admin endpoint validators
export const adminValidators = {
  updateUserRole: z.object({
    userId: uuidSchema,
    role: z.enum(['user', 'curator', 'editor', 'admin']),
    reason: safeTextSchema.max(500),
  }),

  banUser: z.object({
    userId: uuidSchema,
    reason: safeTextSchema.min(10).max(500),
    duration: z.number().positive().optional(), // Hours
    permanent: z.boolean().default(false),
  }),

  systemConfig: z.object({
    maintenance: z.boolean().optional(),
    features: z.record(z.boolean()).optional(),
    rateLimits: z.record(z.number()).optional(),
    announcement: safeTextSchema.max(500).optional(),
  }),
}

// Export combined validators for easy access
export const apiValidators = {
  auth: authValidators,
  user: userValidators,
  content: contentValidators,
  search: searchValidators,
  comment: commentValidators,
  file: fileValidators,
  analytics: analyticsValidators,
  admin: adminValidators,
}

// Type exports
export type LoginRequest = z.infer<typeof authValidators.login>
export type SignupRequest = z.infer<typeof authValidators.signup>
export type UpdateProfileRequest = z.infer<typeof userValidators.updateProfile>
export type CreateContentRequest = z.infer<typeof contentValidators.create>
export type SearchRequest = z.infer<typeof searchValidators.global>
