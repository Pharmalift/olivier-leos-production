import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()

  // Récupérer les tokens depuis les cookies personnalisés
  const accessToken = cookieStore.get('sb-access-token')?.value
  const refreshToken = cookieStore.get('sb-refresh-token')?.value

  console.log('🔍 [Server] Checking tokens in cookies:', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken
  })

  // Utiliser createClient de supabase-js qui est compatible avec l'Edge Runtime
  const client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: {
          getItem: (key: string) => {
            // Mapper nos cookies personnalisés vers les clés Supabase
            if (key === 'sb-access-token') return accessToken ?? null
            if (key === 'sb-refresh-token') return refreshToken ?? null
            return cookieStore.get(key)?.value ?? null
          },
          setItem: (key: string, value: string) => {
            try {
              cookieStore.set(key, value, {
                path: '/',
                httpOnly: true,
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
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true,
      },
      global: {
        headers: accessToken ? {
          Authorization: `Bearer ${accessToken}`
        } : {}
      }
    }
  )

  return client
}
