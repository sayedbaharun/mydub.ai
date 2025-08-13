/**
 * Example: Protected API Route with Validation
 * Shows how to use the middleware in a Next.js API route
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { apiValidators } from '@/shared/lib/api/middleware'
import { SecureSupabaseClient } from '@/shared/lib/security/supabase-security'
import { supabase } from '@/shared/lib/supabase'
import { contentModerationService } from '@/shared/services/content-moderation.service'

// Since Next.js doesn't use Express middleware directly,
// we need to adapt our middleware for Next.js

/**
 * Validation wrapper for Next.js API routes
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (req: NextApiRequest & { validated: T }, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Validate request body
      const validated = await schema.parseAsync(req.body)

      // Add validated data to request
      ;(req as any).validated = validated

      // Call handler
      await handler(req as any, res)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        })
      }

       resetTime: number }>()

export function withRateLimit(max: number = 10, windowMs: number = 60 * 1000) {
  return (handler: any) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
      const key = `${req.url}:${ip}`
      const now = Date.now()

      const limit = rateLimitMap.get(key)

      if (!limit || now > limit.resetTime) {
        rateLimitMap.set(key, {
          count: 1,
          resetTime: now + windowMs,
        })
      } else {
        limit.count++

        if (limit.count > max) {
          return res.status(429).json({
            error: 'Too many requests',
            retryAfter: Math.ceil((limit.resetTime - now) / 1000),
          })
        }
      }

      await handler(req, res)
    }
  }
}

/**
 * Security headers for Next.js
 */
export function withSecurityHeaders(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-XSS-Protection', '1; mode=block')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

    await handler(req, res)
  }
}

/**
 * Example: Create content endpoint with full validation
 */
export default withSecurityHeaders(
  withRateLimit(
    10,
    60 * 1000
  )(
    withValidation(apiValidators.content.create, async (req, res) => {
      try {
        const { validated } = req
        const userId = req.headers['x-user-id'] as string // In real app, get from session

        if (!userId) {
          return res.status(401).json({ error: 'Authentication required' })
        }

        // Step 1: Content moderation
        const moderationResult = await contentModerationService.moderateContent(
          validated.content,
          userId,
          'content'
        )

        if (moderationResult.action === 'blocked') {
          return res.status(400).json({
            error: 'Content rejected',
            reason: moderationResult.reason,
          })
        }

        // Step 2: Use secure Supabase client
        const secureClient = new SecureSupabaseClient(supabase)

        // Sanitize data before saving
        const sanitizedData = secureClient.sanitizeData({
          ...validated,
          user_id: userId,
          moderation_status: moderationResult.action,
          created_at: new Date().toISOString(),
        })

        // Step 3: Save to database
        const { data, error } = await supabase
          .from('content')
          .insert(sanitizedData)
          .select()
          .single()

        if (error) {
          console.error('Database error:', error)
          return res.status(500).json({ error: 'Failed to create content' })
        }

        // Step 4: Log security event
        await secureClient.logSecurityEvent('data_access', userId, {
          action: 'create_content',
          contentId: data.id,
          category: validated.category,
        })

        res.status(201).json({
          success: true,
          data,
          moderation: {
            status: moderationResult.action,
            warnings:
              moderationResult.action === 'warning' ? moderationResult.violations : undefined,
          },
        })
      } catch (error) {
        console.error('Content creation error:', error)
        res.status(500).json({ error: 'Internal server error' })
      }
    })
  )
)

/**
 * Example: Search endpoint with validation
 */
export const searchHandler = withSecurityHeaders(
  withRateLimit(
    30,
    60 * 1000
  )(async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Validate query parameters
      const validated = await apiValidators.search.global.parseAsync(req.query)

      // Perform search with sanitized query
      const results = await performSearch(validated)

      res.status(200).json({
        success: true,
        data: results,
        pagination: {
          page: validated.page,
          limit: validated.limit,
          total: results.total,
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid search parameters',
          errors: error.errors,
        })
      }

      res.status(500).json({ error: 'Search failed' })
    }
  })
)

// Mock search function
async function performSearch(params: any) {
  // Implement actual search logic
  return {
    results: [],
    total: 0,
  }
}
