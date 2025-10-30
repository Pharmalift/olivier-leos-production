import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Routes publiques qui ne nécessitent pas d'authentification
  const publicRoutes = ['/login', '/signup', '/api/test-email']
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  // Laisser passer les routes publiques sans vérification
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Pour toutes les autres routes, on laisse Next.js gérer l'auth côté serveur
  // Le middleware ne fait que bloquer l'accès direct sans ralentir les performances

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (auth routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
