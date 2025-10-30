'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { User } from '@/types/database.types'
import AppLayout from '@/components/AppLayout'
import { ArrowLeft, Save } from 'lucide-react'

export default function NewPharmacyPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    postal_code: '',
    city: '',
    phone: '',
    email: '',
    sector: '',
    status: 'prospect' as 'actif' | 'inactif' | 'prospect',
  })

  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userData) {
        setUser(userData)
        // Pré-remplir le secteur avec celui du commercial
        if (userData.role === 'commercial' && userData.sector) {
          setFormData(prev => ({ ...prev, sector: userData.sector }))
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('pharmacies')
        .insert({
          ...formData,
          assigned_commercial_id: user.role === 'commercial' ? user.id : null,
          first_contact_date: new Date().toISOString(),
        })

      if (error) throw error

      alert('Pharmacie créée avec succès !')
      router.push('/pharmacies')
    } catch (error: any) {
      console.error('Erreur:', error)
      alert('Erreur lors de la création de la pharmacie: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>
  }

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#6B8E23]">Nouvelle Pharmacie</h1>
            <p className="text-gray-600 mt-2">Ajouter une pharmacie à votre portefeuille</p>
          </div>
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nom */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la pharmacie *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent"
                placeholder="Pharmacie Centrale"
              />
            </div>

            {/* Adresse */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent"
                placeholder="12 rue de la République"
              />
            </div>

            {/* Code postal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code postal *
              </label>
              <input
                type="text"
                required
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent"
                placeholder="75001"
              />
            </div>

            {/* Ville */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent"
                placeholder="Paris"
              />
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent"
                placeholder="01 23 45 67 89"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent"
                placeholder="pharmacie@exemple.fr"
              />
            </div>

            {/* Secteur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secteur *
              </label>
              <input
                type="text"
                required
                value={formData.sector}
                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent"
                placeholder="Paris Centre"
                disabled={user.role === 'commercial'}
              />
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut *
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent"
              >
                <option value="prospect">Prospect</option>
                <option value="actif">Client actif</option>
                <option value="inactif">Inactif</option>
              </select>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 bg-[#6B8E23] text-white px-6 py-2 rounded-lg hover:bg-[#5a7a1d] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              <span>{submitting ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
