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

// Use placeholder values in development/demo mode when env vars are missing
const url = supabaseUrl || 'https://placeholder.supabase.co'
const key =
  supabaseAnonKey ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MjYyODUwMjQsImV4cCI6MTk0MTg2MTAyNH0.placeholder'

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
    'The app is running in demo mode. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables for full functionality.'
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
