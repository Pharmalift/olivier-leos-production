import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppLayout from '@/components/AppLayout'
import { TrendingUp, ShoppingCart, Euro, Package } from 'lucide-react'

export default async function Dashboard() {
  const supabase = createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  // Récupérer les infos utilisateur depuis la table users
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (!user) {
    redirect('/login')
  }

  // Récupérer les statistiques du commercial
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_lines(*)')
    .eq('commercial_id', user.id)

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const ordersThisMonth = orders?.filter(order => {
    const orderDate = new Date(order.order_date)
    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
  }) || []

  const totalOrders = orders?.length || 0
  const totalOrdersThisMonth = ordersThisMonth.length
  const totalRevenueThisMonth = ordersThisMonth.reduce((sum, order) => sum + order.total_amount, 0)
  const totalItemsThisMonth = ordersThisMonth.reduce((sum, order) =>
    sum + (order.order_lines?.reduce((lineSum: number, line: any) => lineSum + line.quantity, 0) || 0), 0
  )

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#6B8E23]">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Bienvenue {user.full_name} - Vue d'ensemble de votre activité
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#6B8E23]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Commandes totales</p>
                <p className="text-3xl font-bold text-[#6B8E23] mt-2">{totalOrders}</p>
              </div>
              <ShoppingCart className="w-12 h-12 text-[#6B8E23] opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Commandes ce mois</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{totalOrdersThisMonth}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">CA du mois</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {totalRevenueThisMonth.toFixed(2)} €
                </p>
              </div>
              <Euro className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Produits vendus</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{totalItemsThisMonth}</p>
              </div>
              <Package className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Actions rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/orders/new"
              className="flex items-center justify-center p-4 bg-[#6B8E23] text-white rounded-lg hover:bg-[#5a7a1d] transition-colors"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Nouvelle commande
            </a>
            <a
              href="/pharmacies"
              className="flex items-center justify-center p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Package className="w-5 h-5 mr-2" />
              Voir pharmacies
            </a>
            <a
              href="/products"
              className="flex items-center justify-center p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Package className="w-5 h-5 mr-2" />
              Catalogue produits
            </a>
          </div>
        </div>

        {/* Dernières commandes */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Dernières commandes</h2>
          {orders && orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      N° Commande
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.order_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.order_date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.total_amount.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
          ) : (
            <p className="text-gray-500 text-center py-4">Aucune commande pour le moment</p>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
