'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { LogIn } from 'lucide-react'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Vérifier si redirection depuis signup avec succès (côté client)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('success') === 'inscription') {
        setSuccess('Compte créé avec succès ! Vous pouvez maintenant vous connecter.')
      }
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      // Vérifier que la session est bien établie
      if (!data.session) {
        throw new Error('Session non établie')
      }

      // Attendre un peu pour que la session soit bien sauvegardée
      await new Promise(resolve => setTimeout(resolve, 100))

      // Rediriger vers le dashboard
      window.location.href = '/'
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la connexion')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5DC] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#6B8E23] rounded-full flex items-center justify-center">
              <span className="text-white text-3xl">🫒</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-[#6B8E23]">
            L'Olivier de Leos
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Connexion commerciaux
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {success && (
            <div className="rounded-md bg-green-50 border border-green-200 p-4">
              <div className="text-sm text-green-800">{success}</div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-[#6B8E23] focus:border-[#6B8E23] focus:z-10 sm:text-sm"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-[#6B8E23] focus:border-[#6B8E23] focus:z-10 sm:text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#6B8E23] hover:bg-[#5a7a1d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6B8E23] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <LogIn className="w-5 h-5" />
              <span>{loading ? 'Connexion en cours...' : 'Se connecter'}</span>
            </button>
          </div>

          <div className="text-sm text-center">
            <Link href="/signup" className="font-medium text-[#6B8E23] hover:text-[#5a7a1d]">
              Pas de compte ? Créer un compte
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
