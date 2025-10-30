import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()

  // Utiliser createClient de supabase-js qui est compatible avec l'Edge Runtime
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: {
          getItem: (key: string) => {
            return cookieStore.get(key)?.value ?? null
          },
          setItem: (key: string, value: string) => {
            try {
              cookieStore.set(key, value, {
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
              })
            } catch (error) {
              // Ignore errors from Server Components
            }
          },
          removeItem: (key: string) => {
            try {
              cookieStore.delete(key)
            } catch (error) {
              // Ignore errors from Server Components
            }
          },
        },
        flowType: 'pkce',
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true,
      },
    }
  )
}
