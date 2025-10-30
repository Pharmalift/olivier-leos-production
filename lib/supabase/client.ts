import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yeotvzajxwejiohmlvdr.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inllb3R2emFqeHdlamlvaG1sdmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1ODU2NDksImV4cCI6MjA3NzE2MTY0OX0.CdIykB2lCFct-gS-rxgknLQxFbFo_5mRKcmtSWzMnqI'

// Client Supabase avec configuration pour persister la session
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})
