'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { UserPlus } from 'lucide-react'
import Link from 'next/link'

const SECTEURS = [
  'Var',
  'Alpes-Maritimes',
  'Bouches-du-Rhône',
  'Vaucluse',
  'Alpes-de-Haute-Provence',
  'Hautes-Alpes'
]

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [sector, setSector] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const validateForm = () => {
    if (!email || !password || !confirmPassword || !fullName || !sector) {
      setError('Tous les champs sont obligatoires')
      return false
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Adresse email invalide')
      return false
    }

    // Validation mot de passe
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return false
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return false
    }

    return true
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // 1. Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Erreur lors de la création du compte')
      }

      // 2. Créer l'entrée dans la table users avec le même UUID
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: email,
          full_name: fullName,
          role: 'commercial',
          sector: sector
        })

      if (userError) {
        // Si erreur lors de l'insertion dans users, supprimer l'utilisateur Auth
        console.error('Erreur lors de la création du profil utilisateur:', userError)
        throw new Error('Erreur lors de la création du profil. Veuillez réessayer.')
      }

      // Succès - Déconnecter l'utilisateur et rediriger vers login
      await supabase.auth.signOut()

      // Rediriger avec message de succès
      router.push('/login?success=inscription')
    } catch (error: any) {
      console.error('Erreur inscription:', error)
      setError(error.message || 'Erreur lors de l\'inscription. Veuillez réessayer.')
    } finally {
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
            Créer un compte commercial
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Nom complet *
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-[#6B8E23] focus:border-[#6B8E23] sm:text-sm"
                placeholder="Jean Dupont"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Adresse email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-[#6B8E23] focus:border-[#6B8E23] sm:text-sm"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-1">
                Secteur *
              </label>
              <select
                id="sector"
                name="sector"
                required
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-[#6B8E23] focus:border-[#6B8E23] sm:text-sm"
              >
                <option value="">Sélectionnez un secteur</option>
                {SECTEURS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-[#6B8E23] focus:border-[#6B8E23] sm:text-sm"
                placeholder="Min. 8 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le mot de passe *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-[#6B8E23] focus:border-[#6B8E23] sm:text-sm"
                placeholder="Confirmez votre mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#6B8E23] hover:bg-[#5a7a1d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6B8E23] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              <span>{loading ? 'Création du compte...' : 'Créer mon compte'}</span>
            </button>
          </div>

          <div className="text-sm text-center">
            <Link href="/login" className="font-medium text-[#6B8E23] hover:text-[#5a7a1d]">
              Déjà un compte ? Connectez-vous
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
