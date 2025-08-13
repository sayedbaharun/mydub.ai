import OpenAI from 'openai'
import { EnvSecurity } from './security/env-encryption'

// Initialize OpenAI client with security layer
// Note: In production, consider using Edge Functions to keep API key server-side
const apiKeys = EnvSecurity.getAPIKeys()
export const openai = new OpenAI({
  apiKey: apiKeys.openai || 'demo-key',
  dangerouslyAllowBrowser: true // Required for client-side usage
})

// Check if OpenAI is properly configured
export const isOpenAIConfigured = () => {
  const keys = EnvSecurity.getAPIKeys()
  return keys.openai && keys.openai !== 'demo-key'
}

// Helper to safely use OpenAI with fallback
export const safeOpenAICall = async <T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> => {
  if (!isOpenAIConfigured()) {
        return fallback
  }
  
  try {
    return await operation()
  } catch (error) {
    // Log error without exposing sensitive information
    if (error instanceof Error) {
      const sanitizedError = error.message.replace(/sk-[A-Za-z0-9]+/g, '[API_KEY_HIDDEN]')
      console.error('OpenAI API error:', sanitizedError)
    } else {
      console.error('OpenAI API error: Unknown error')
    }
    return fallback
  }
}