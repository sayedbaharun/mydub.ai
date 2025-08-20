import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const isProd = import.meta.env.PROD
const verbose = import.meta.env.VITE_SUPABASE_DEBUG === 'true' || import.meta.env.VITE_VERBOSE_DEBUG === 'true'

// Optional environment check logs (only when explicitly enabled)
if (!isProd && verbose) {
  console.log('Supabase environment check:', {
    VITE_SUPABASE_URL: !!import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    MODE: import.meta.env.MODE,
  })
}

// In production, require proper env vars and do not fall back
if (isProd && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error(
    'Supabase configuration missing in production. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  )
}

// In development, allow fallbacks for convenience
const url = supabaseUrl || (import.meta.env.DEV ? 'https://pltutlpmamxozailzffm.supabase.co' : '')
const key =
  supabaseAnonKey ||
  (import.meta.env.DEV
    ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsdHV0bHBtYW14b3phaWx6ZmZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMDk4NTYsImV4cCI6MjA2NTU4NTg1Nn0.4RIRul4zGoHhw54MKLNQXjbgonNHxJUfJYrkjiDAAJ8'
    : '')

if (!isProd && (!supabaseUrl || !supabaseAnonKey) && verbose) {
  console.warn('Using development fallback Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to override.')
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'mydub-auth-token',
    storage: window.localStorage,
    flowType: 'pkce',
    debug: !isProd && verbose,
  },
})

// Export types for better TypeScript support
export type SupabaseClient = typeof supabase
