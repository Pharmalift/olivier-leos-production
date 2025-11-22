'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Order, User } from '@/types/database.types'
import AppLayout from '@/components/AppLayout'
import { Search, Filter, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

export default function OrdersPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [filteredOrders, setFilteredOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [searchTerm, statusFilter, dateFilter, orders])

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

        // Charger les commandes
        let query = supabase
          .from('orders')
          .select('*')
          .order('order_date', { ascending: false })

        if (userData.role === 'commercial') {
          query = query.eq('commercial_id', userData.id)
        }

        const { data: ordersData, error: ordersError } = await query

        if (ordersError) {
          console.error('Erreur chargement commandes:', ordersError)
          return
        }

        if (ordersData) {
          // Charger les relations manuellement
          const ordersWithRelations = await Promise.all(
            ordersData.map(async (order) => {
              // Charger la pharmacie
              const { data: pharmacy } = await supabase
                .from('pharmacies')
                .select('name, city')
                .eq('id', order.pharmacy_id)
                .single()

              // Charger le commercial
              const { data: commercial } = await supabase
                .from('users')
                .select('full_name')
                .eq('id', order.commercial_id)
                .single()

              return {
                ...order,
                pharmacy,
                commercial
              }
            })
          )

          setOrders(ordersWithRelations)
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterOrders() {
    let filtered = orders

    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status === statusFilter)
    }

    if (dateFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(o => {
        const orderDate = new Date(o.order_date)
        if (dateFilter === 'today') {
          return orderDate.toDateString() === now.toDateString()
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return orderDate >= weekAgo
        } else if (dateFilter === 'month') {
          return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()
        }
        return true
      })
    }

    if (searchTerm) {
      filtered = filtered.filter(o =>
        o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.pharmacy?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredOrders(filtered)
  }

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>
  }

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#6B8E23]">Historique des commandes</h1>
          <p className="text-gray-600 mt-2">
            {filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Filtres */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent"
              >
                <option value="all">Tous statuts</option>
                <option value="en_attente">En attente</option>
                <option value="validée">Validée</option>
                <option value="expédiée">Expédiée</option>
                <option value="livrée">Livrée</option>
                <option value="annulée">Annulée</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent"
              >
                <option value="all">Toutes périodes</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N° Commande
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pharmacie
                  </th>
                  {user.role === 'admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commercial
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[#6B8E23] hover:underline">{order.order_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.order_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.pharmacy?.name}</div>
                      <div className="text-sm text-gray-500">{order.pharmacy?.city}</div>
                    </td>
                    {user.role === 'admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.commercial?.full_name}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {order.total_amount.toFixed(2)} €
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.status === 'livrée' ? 'bg-green-100 text-green-800' :
                        order.status === 'expédiée' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'validée' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'en_attente' ? 'bg-orange-100 text-orange-800' :
                        order.status === 'annulée' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'en_attente' ? 'En attente' :
                         order.status === 'validée' ? 'Validée' :
                         order.status === 'expédiée' ? 'Expédiée' :
                         order.status === 'livrée' ? 'Livrée' :
                         order.status === 'annulée' ? 'Annulée' :
                         order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-gray-500">Aucune commande trouvée</p>
            </div>
          )}
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600">Total commandes</div>
            <div className="text-2xl font-bold text-[#6B8E23] mt-2">{filteredOrders.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600">Montant total</div>
            <div className="text-2xl font-bold text-green-600 mt-2">
              {filteredOrders.reduce((sum, o) => sum + o.total_amount, 0).toFixed(2)} €
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600">Montant moyen</div>
            <div className="text-2xl font-bold text-blue-600 mt-2">
              {filteredOrders.length > 0
                ? (filteredOrders.reduce((sum, o) => sum + o.total_amount, 0) / filteredOrders.length).toFixed(2)
                : '0.00'} €
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-sm text-gray-600">En attente</div>
            <div className="text-2xl font-bold text-orange-600 mt-2">
              {filteredOrders.filter(o => o.status === 'en_attente').length}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
