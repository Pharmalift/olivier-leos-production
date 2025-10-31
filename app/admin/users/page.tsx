'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { User } from '@/types/database.types'
import AppLayout from '@/components/AppLayout'
import { Plus, Edit, Trash2, Search, X, UserPlus, Shield, Briefcase } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminUsersPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'commercial' as 'commercial' | 'admin',
    sector: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const filtered = users.filter(u =>
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.sector && u.sector.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredUsers(filtered)
  }, [searchTerm, users])

  async function loadData() {
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

      if (!userData || userData.role !== 'admin') {
        router.push('/')
        return
      }

      setCurrentUser(userData)

      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersData) {
        setUsers(usersData)
        setFilteredUsers(usersData)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  function openModal(user?: User) {
    if (user) {
      setEditingUser(user)
      setFormData({
        email: user.email,
        password: '',
        full_name: user.full_name,
        role: user.role,
        sector: user.sector || '',
      })
    } else {
      setEditingUser(null)
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'commercial',
        sector: '',
      })
    }
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (editingUser) {
        // Modification d'un utilisateur existant
        const { error } = await supabase
          .from('users')
          .update({
            full_name: formData.full_name,
            role: formData.role,
            sector: formData.sector || null,
          })
          .eq('id', editingUser.id)

        if (error) throw error
        alert('Utilisateur modifié avec succès !')
      } else {
        // Création d'un nouvel utilisateur
        // 1. Créer l'utilisateur dans auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name,
            }
          }
        })

        if (authError) throw authError
        if (!authData.user) throw new Error('Erreur lors de la création du compte')

        // 2. Créer l'entrée dans la table users
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: formData.email,
            full_name: formData.full_name,
            role: formData.role,
            sector: formData.sector || null,
          })

        if (userError) throw userError
        alert('Utilisateur créé avec succès ! Un email de confirmation a été envoyé.')
      }

      setShowModal(false)
      loadData()
    } catch (error: any) {
      console.error('Erreur:', error)
      alert('Erreur: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteUser(user: User) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.full_name} ?`)) {
      return
    }

    try {
      // Note: La suppression d'un utilisateur dans Supabase Auth nécessite des privilèges admin
      // Pour l'instant, on supprime juste de la table users
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id)

      if (error) throw error

      alert('Utilisateur supprimé avec succès')
      loadData()
    } catch (error: any) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression: ' + error.message)
    }
  }

  if (loading || !currentUser) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>
  }

  return (
    <AppLayout user={currentUser}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#6B8E23]">Gestion des Utilisateurs</h1>
            <p className="text-gray-600 mt-2">{filteredUsers.length} utilisateurs</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center space-x-2 bg-[#6B8E23] text-white px-6 py-3 rounded-lg hover:bg-[#5a7a1d]"
          >
            <UserPlus className="w-5 h-5" />
            <span>Nouvel utilisateur</span>
          </button>
        </div>

        {/* Recherche */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total utilisateurs</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{users.length}</p>
              </div>
              <Shield className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Commerciaux</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {users.filter(u => u.role === 'commercial').length}
                </p>
              </div>
              <Briefcase className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Administrateurs</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
              <Shield className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Liste des utilisateurs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Secteur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Créé le</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-[#6B8E23] rounded-full flex items-center justify-center text-white font-semibold">
                          {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? 'Administrateur' : 'Commercial'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.sector || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => openModal(user)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Modifier"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      {user.id !== currentUser.id && (
                        <button
                          onClick={() => deleteUser(user)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal d'ajout/modification */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23]"
                      placeholder="Jean Dupont"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!!editingUser}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23] disabled:bg-gray-100"
                      placeholder="jean.dupont@exemple.fr"
                    />
                    {editingUser && (
                      <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
                    )}
                  </div>

                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mot de passe *
                      </label>
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23]"
                        placeholder="Minimum 6 caractères"
                        minLength={6}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rôle *
                    </label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23]"
                    >
                      <option value="commercial">Commercial</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Secteur
                    </label>
                    <input
                      type="text"
                      value={formData.sector}
                      onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23]"
                      placeholder="Paris Centre, Lyon, etc."
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      disabled={submitting}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 bg-[#6B8E23] text-white rounded-lg hover:bg-[#5a7a1d] disabled:opacity-50"
                    >
                      {submitting ? 'Enregistrement...' : editingUser ? 'Modifier' : 'Créer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
