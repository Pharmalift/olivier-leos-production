'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { User } from '@/types/database.types'
import AppLayout from '@/components/AppLayout'
import { Users as UsersIcon, ShoppingCart, TrendingUp, Package, Download, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [changingRole, setChangingRole] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalCommercials: 0,
    totalAdmins: 0,
    totalPharmacies: 0,
    ordersThisMonth: 0,
    revenueThisMonth: 0
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

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
        alert('Accès non autorisé - réservé aux administrateurs')
        router.push('/')
        return
      }

      setUser(userData)

      // Charger tous les utilisateurs
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (users) {
        setAllUsers(users)
      }

      // Stats globales
      const { data: orders } = await supabase
        .from('orders')
        .select('*')

      const { data: pharmacies } = await supabase
        .from('pharmacies')
        .select('*')

      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()

      const ordersThisMonth = orders?.filter(order => {
        const orderDate = new Date(order.order_date)
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
      }) || []

      setStats({
        totalOrders: orders?.length || 0,
        totalRevenue: orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0,
        totalUsers: users?.length || 0,
        totalCommercials: users?.filter(u => u.role === 'commercial').length || 0,
        totalAdmins: users?.filter(u => u.role === 'admin').length || 0,
        totalPharmacies: pharmacies?.length || 0,
        ordersThisMonth: ordersThisMonth.length,
        revenueThisMonth: ordersThisMonth.reduce((sum, o) => sum + o.total_amount, 0)
      })

      // Dernières commandes
      const { data: recentOrdersData } = await supabase
        .from('orders')
        .select(`
          *,
          pharmacy:pharmacies(name, city),
          commercial:users!orders_commercial_id_fkey(full_name)
        `)
        .order('order_date', { ascending: false })
        .limit(10)

      if (recentOrdersData) {
        setRecentOrders(recentOrdersData)
      }

      // Charger stats par utilisateur
      if (users) {
        const usersWithStats = await Promise.all(
          users.map(async (u) => {
            const { data: userOrders } = await supabase
              .from('orders')
              .select('*')
              .eq('commercial_id', u.id)

            const ordersThisMonth = userOrders?.filter(order => {
              const orderDate = new Date(order.order_date)
              return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
            }) || []

            return {
              ...u,
              totalOrders: userOrders?.length || 0,
              totalRevenue: userOrders?.reduce((sum, o) => sum + o.total_amount, 0) || 0,
              ordersThisMonth: ordersThisMonth.length,
              revenueThisMonth: ordersThisMonth.reduce((sum, o) => sum + o.total_amount, 0)
            }
          })
        )

        setAllUsers(usersWithStats)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  async function handleChangeRole(userId: string, currentRole: string) {
    const newRole = currentRole === 'admin' ? 'commercial' : 'admin'

    const confirmMessage = `Êtes-vous sûr de vouloir changer le rôle de cet utilisateur en "${newRole}" ?`
    if (!confirm(confirmMessage)) return

    setChangingRole(userId)

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      alert(`Rôle changé en "${newRole}" avec succès`)
      await loadData() // Recharger les données
    } catch (error: any) {
      console.error('Erreur changement rôle:', error)
      alert('Erreur lors du changement de rôle: ' + error.message)
    } finally {
      setChangingRole(null)
    }
  }

  async function exportToExcel() {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *,
          pharmacy:pharmacies(name, city, postal_code),
          commercial:users!orders_commercial_id_fkey(full_name, email)
        `)
        .order('order_date', { ascending: false })

      if (!orders) return

      // Créer CSV
      const headers = [
        'N° Commande',
        'Date',
        'Pharmacie',
        'Code Postal',
        'Ville',
        'Commercial',
        'Email Commercial',
        'Montant HT',
        'Statut',
        'Notes'
      ]

      const rows = orders.map(o => [
        o.order_number,
        new Date(o.order_date).toLocaleDateString('fr-FR'),
        o.pharmacy?.name || '',
        o.pharmacy?.postal_code || '',
        o.pharmacy?.city || '',
        o.commercial?.full_name || '',
        o.commercial?.email || '',
        o.total_amount.toFixed(2),
        o.status,
        o.notes || ''
      ])

      const csv = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
      ].join('\n')

      // Ajouter BOM pour Excel
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `commandes_olivier_leos_${new Date().toISOString().split('T')[0]}.csv`
      link.click()

      alert('Export CSV réussi !')
    } catch (error) {
      console.error('Erreur export:', error)
      alert('Erreur lors de l\'export')
    }
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5F5DC]">
        <div className="text-xl text-gray-600">Chargement...</div>
      </div>
    )
  }

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-[#6B8E23]">Administration</h1>
            <p className="text-gray-600 mt-2">Gestion globale et statistiques</p>
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors shadow-md"
          >
            <Download className="w-5 h-5" />
            <span>Exporter CSV</span>
          </button>
        </div>

        {/* Stats globales du mois */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#6B8E23]">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Statistiques du mois en cours</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 font-medium">CA du mois</div>
              <div className="text-3xl font-bold text-green-600 mt-2">
                {stats.revenueThisMonth.toFixed(2)} €
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 font-medium">Commandes ce mois</div>
              <div className="text-3xl font-bold text-blue-600 mt-2">
                {stats.ordersThisMonth}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 font-medium">Commerciaux actifs</div>
              <div className="text-3xl font-bold text-purple-600 mt-2">
                {stats.totalCommercials}
              </div>
            </div>
          </div>
        </div>

        {/* Stats globales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Commandes totales</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalOrders}</p>
              </div>
              <ShoppingCart className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">CA total</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {stats.totalRevenue.toFixed(0)} €
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Utilisateurs</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalUsers}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalCommercials} commerciaux, {stats.totalAdmins} admins
                </p>
              </div>
              <UsersIcon className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pharmacies</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.totalPharmacies}</p>
              </div>
              <Package className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Gestion des utilisateurs */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">👥 Gestion des utilisateurs</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Secteur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commandes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CA généré</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.full_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{u.sector || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        u.role === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role === 'admin' ? '👑 Admin' : '💼 Commercial'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {u.totalOrders || 0}
                      <span className="text-xs text-gray-500 ml-1">
                        ({u.ordersThisMonth || 0} ce mois)
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">
                      {(u.totalRevenue || 0).toFixed(2)} €
                      <div className="text-xs text-gray-500">
                        {(u.revenueThisMonth || 0).toFixed(2)} € ce mois
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleChangeRole(u.id, u.role)}
                        disabled={changingRole === u.id || u.id === user.id}
                        className={`flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                          u.id === user.id
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-[#6B8E23] text-white hover:bg-[#5a7a1d]'
                        }`}
                        title={u.id === user.id ? 'Vous ne pouvez pas changer votre propre rôle' : ''}
                      >
                        {changingRole === u.id ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3" />
                            <span>
                              {u.role === 'admin' ? 'Commercial' : 'Admin'}
                            </span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dernières commandes */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📦 Dernières commandes</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Commande</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pharmacie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commercial</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.order_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(order.order_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.pharmacy?.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{order.commercial?.full_name}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {order.total_amount.toFixed(2)} €
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'livrée' ? 'bg-green-100 text-green-800' :
                        order.status === 'expédiée' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'validée' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
