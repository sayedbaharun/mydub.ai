import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Log environment variables for debugging
console.log('Environment check:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'present' : 'missing',
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
})

// Use the actual Supabase credentials
const url = supabaseUrl || 'https://pltutlpmamxozailzffm.supabase.co'
const key = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsdHV0bHBtYW14b3phaWx6ZmZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMDk4NTYsImV4cCI6MjA2NTU4NTg1Nn0.4RIRul4zGoHhw54MKLNQXjbgonNHxJUfJYrkjiDAAJ8'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Using default Supabase configuration. Make sure environment variables are properly set.'
  )
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'mydub-auth-token',
    storage: window.localStorage,
    flowType: 'pkce',
    debug: !import.meta.env.PROD,
  },
})

// Export types for better TypeScript support
export type SupabaseClient = typeof supabase
