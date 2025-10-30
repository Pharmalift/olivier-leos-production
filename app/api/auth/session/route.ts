import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { access_token, refresh_token } = await request.json()

    console.log('🍪 API /api/auth/session appelée')
    console.log('📦 Tokens reçus:', {
      hasAccessToken: !!access_token,
      hasRefreshToken: !!refresh_token
    })

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { error: 'Tokens manquants' },
        { status: 400 }
      )
    }

    const cookieStore = cookies()

    // Définir les cookies avec les tokens de session
    // Ces noms de cookies correspondent à ceux utilisés par Supabase
    cookieStore.set('sb-access-token', access_token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    })

    cookieStore.set('sb-refresh-token', refresh_token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    })

    console.log('✅ Cookies de session définis avec succès')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde de la session:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
