import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yeotvzajxwejiohmlvdr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inllb3R2emFqeHdlamlvaG1sdmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1ODU2NDksImV4cCI6MjA3NzE2MTY0OX0.CdIykB2lCFct-gS-rxgknLQxFbFo_5mRKcmtSWzMnqI'

// Client Supabase avec configuration simplifiée
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
