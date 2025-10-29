'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Pharmacy, User, PharmacyWithCommercial } from '@/types/database.types'
import AppLayout from '@/components/AppLayout'
import { Search, Eye, ShoppingCart, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PharmaciesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [pharmacies, setPharmacies] = useState<PharmacyWithCommercial[]>([])
  const [filteredPharmacies, setFilteredPharmacies] = useState<PharmacyWithCommercial[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterPharmacies()
  }, [searchTerm, statusFilter, pharmacies])

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

      if (userData) {
        setUser(userData)

        // Si commercial, voir uniquement ses pharmacies
        let query = supabase
          .from('pharmacies')
          .select(`
            *,
            commercial:users!pharmacies_assigned_commercial_id_fkey(id, full_name, email)
          `)
          .order('name', { ascending: true })

        if (userData.role === 'commercial') {
          query = query.eq('assigned_commercial_id', userData.id)
        }

        const { data: pharmaciesData } = await query

        if (pharmaciesData) {
          setPharmacies(pharmaciesData as any)
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterPharmacies() {
    let filtered = pharmacies

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sector.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredPharmacies(filtered)
  }

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>
  }

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#6B8E23]">Pharmacies</h1>
          <p className="text-gray-600 mt-2">
            {filteredPharmacies.length} pharmacie{filteredPharmacies.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Filtres */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher une pharmacie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent"
            >
              <option value="all">Tous statuts</option>
              <option value="actif">Actif</option>
              <option value="prospect">Prospect</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ville
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Secteur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  {user.role === 'admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commercial
                    </th>
                  )}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPharmacies.map((pharmacy) => (
                  <tr key={pharmacy.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{pharmacy.name}</div>
                      {pharmacy.email && (
                        <div className="text-sm text-gray-500">{pharmacy.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                        {pharmacy.city}
                      </div>
                      <div className="text-sm text-gray-500">{pharmacy.postal_code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pharmacy.sector}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        pharmacy.status === 'actif' ? 'bg-green-100 text-green-800' :
                        pharmacy.status === 'prospect' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {pharmacy.status}
                      </span>
                    </td>
                    {user.role === 'admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(pharmacy as any).commercial?.full_name || '-'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/pharmacies/${pharmacy.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Voir détails"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        <Link
                          href={`/orders/new?pharmacy=${pharmacy.id}`}
                          className="text-[#6B8E23] hover:text-[#5a7a1d]"
                          title="Nouvelle commande"
                        >
                          <ShoppingCart className="w-5 h-5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPharmacies.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-gray-500">Aucune pharmacie trouvée</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
