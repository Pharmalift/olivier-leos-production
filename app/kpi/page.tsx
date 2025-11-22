'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { User, Order, OrderLine } from '@/types/database.types'
import AppLayout from '@/components/AppLayout'
import { useRouter } from 'next/navigation'
import { TrendingUp, ShoppingCart, Package, Users, BarChart3, Calendar } from 'lucide-react'

interface PharmacyKPI {
  pharmacy_id: string
  pharmacy_name: string
  pharmacy_city: string
  total_orders: number
  total_revenue: number
  average_basket: number
  last_order_date: string | null
}

interface ProductKPI {
  product_id: string
  product_name: string
  product_sku: string
  total_quantity: number
  total_revenue: number
  order_count: number
}

interface CommercialKPI {
  commercial_id: string
  commercial_name: string
  total_orders: number
  total_revenue: number
  active_pharmacies: number
  average_basket: number
}

export default function KPIPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('all')

  const [pharmacyKPIs, setPharmacyKPIs] = useState<PharmacyKPI[]>([])
  const [productKPIs, setProductKPIs] = useState<ProductKPI[]>([])
  const [commercialKPIs, setCommercialKPIs] = useState<CommercialKPI[]>([])

  const [sortPharmacy, setSortPharmacy] = useState<'revenue' | 'orders' | 'basket'>('revenue')
  const [sortProduct, setSortProduct] = useState<'quantity' | 'revenue'>('revenue')
  const [sortCommercial, setSortCommercial] = useState<'revenue' | 'orders'>('revenue')

  useEffect(() => {
    loadData()
  }, [dateFilter])

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

      if (!userData) return

      // Rediriger si pas admin
      if (userData.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setUser(userData)

      // Charger toutes les commandes avec leurs lignes
      let ordersQuery = supabase
        .from('orders')
        .select('*, order_lines(*)')
        .neq('status', 'annulée')

      // Filtrer par date si nécessaire
      if (dateFilter !== 'all') {
        const now = new Date()
        let startDate = new Date()

        if (dateFilter === 'month') {
          startDate.setMonth(now.getMonth() - 1)
        } else if (dateFilter === 'quarter') {
          startDate.setMonth(now.getMonth() - 3)
        } else if (dateFilter === 'year') {
          startDate.setFullYear(now.getFullYear() - 1)
        }

        ordersQuery = ordersQuery.gte('order_date', startDate.toISOString())
      }

      const { data: orders } = await ordersQuery

      if (!orders) return

      // Calculer KPI par pharmacie
      await calculatePharmacyKPIs(orders)

      // Calculer KPI par produit
      calculateProductKPIs(orders)

      // Calculer KPI par commercial
      await calculateCommercialKPIs(orders)

    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  async function calculatePharmacyKPIs(orders: any[]) {
    const pharmacyMap = new Map<string, {
      total_orders: number
      total_revenue: number
      last_order_date: string | null
    }>()

    orders.forEach(order => {
      if (!order.pharmacy_id) return

      const existing = pharmacyMap.get(order.pharmacy_id) || {
        total_orders: 0,
        total_revenue: 0,
        last_order_date: null
      }

      existing.total_orders++
      existing.total_revenue += order.total_amount || 0

      if (!existing.last_order_date || order.order_date > existing.last_order_date) {
        existing.last_order_date = order.order_date
      }

      pharmacyMap.set(order.pharmacy_id, existing)
    })

    // Charger les noms des pharmacies
    const pharmacyIds = Array.from(pharmacyMap.keys())
    const { data: pharmacies } = await supabase
      .from('pharmacies')
      .select('id, name, city')
      .in('id', pharmacyIds)

    const kpis: PharmacyKPI[] = (pharmacies || []).map(pharmacy => {
      const stats = pharmacyMap.get(pharmacy.id)!
      return {
        pharmacy_id: pharmacy.id,
        pharmacy_name: pharmacy.name,
        pharmacy_city: pharmacy.city,
        total_orders: stats.total_orders,
        total_revenue: stats.total_revenue,
        average_basket: stats.total_revenue / stats.total_orders,
        last_order_date: stats.last_order_date
      }
    })

    setPharmacyKPIs(kpis)
  }

  function calculateProductKPIs(orders: any[]) {
    const productMap = new Map<string, {
      product_name: string
      product_sku: string
      total_quantity: number
      total_revenue: number
      order_count: number
    }>()

    orders.forEach(order => {
      (order.order_lines || []).forEach((line: OrderLine) => {
        if (!line.product_id) return

        const existing = productMap.get(line.product_id) || {
          product_name: line.product_name,
          product_sku: line.product_sku,
          total_quantity: 0,
          total_revenue: 0,
          order_count: 0
        }

        existing.total_quantity += line.quantity
        existing.total_revenue += line.line_total_ht
        existing.order_count++

        productMap.set(line.product_id, existing)
      })
    })

    const kpis: ProductKPI[] = Array.from(productMap.entries()).map(([id, stats]) => ({
      product_id: id,
      product_name: stats.product_name,
      product_sku: stats.product_sku,
      total_quantity: stats.total_quantity,
      total_revenue: stats.total_revenue,
      order_count: stats.order_count
    }))

    setProductKPIs(kpis)
  }

  async function calculateCommercialKPIs(orders: any[]) {
    const commercialMap = new Map<string, {
      total_orders: number
      total_revenue: number
      pharmacy_ids: Set<string>
    }>()

    orders.forEach(order => {
      if (!order.commercial_id) return

      const existing = commercialMap.get(order.commercial_id) || {
        total_orders: 0,
        total_revenue: 0,
        pharmacy_ids: new Set<string>()
      }

      existing.total_orders++
      existing.total_revenue += order.total_amount || 0
      if (order.pharmacy_id) {
        existing.pharmacy_ids.add(order.pharmacy_id)
      }

      commercialMap.set(order.commercial_id, existing)
    })

    // Charger les noms des commerciaux
    const commercialIds = Array.from(commercialMap.keys())
    const { data: commercials } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', commercialIds)

    const kpis: CommercialKPI[] = (commercials || []).map(commercial => {
      const stats = commercialMap.get(commercial.id)!
      return {
        commercial_id: commercial.id,
        commercial_name: commercial.full_name,
        total_orders: stats.total_orders,
        total_revenue: stats.total_revenue,
        active_pharmacies: stats.pharmacy_ids.size,
        average_basket: stats.total_revenue / stats.total_orders
      }
    })

    setCommercialKPIs(kpis)
  }

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>
  }

  // Tri des données
  const sortedPharmacies = [...pharmacyKPIs].sort((a, b) => {
    if (sortPharmacy === 'revenue') return b.total_revenue - a.total_revenue
    if (sortPharmacy === 'orders') return b.total_orders - a.total_orders
    return b.average_basket - a.average_basket
  })

  const sortedProducts = [...productKPIs].sort((a, b) => {
    if (sortProduct === 'quantity') return b.total_quantity - a.total_quantity
    return b.total_revenue - a.total_revenue
  })

  const sortedCommercials = [...commercialKPIs].sort((a, b) => {
    if (sortCommercial === 'revenue') return b.total_revenue - a.total_revenue
    return b.total_orders - a.total_orders
  })

  // Statistiques globales
  const totalRevenue = pharmacyKPIs.reduce((sum, p) => sum + p.total_revenue, 0)
  const totalOrders = pharmacyKPIs.reduce((sum, p) => sum + p.total_orders, 0)
  const globalAvgBasket = totalOrders > 0 ? totalRevenue / totalOrders : 0

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#6B8E23]">Tableau de bord KPI</h1>
            <p className="text-gray-600 mt-2">Analyse des performances par pharmacie, produit et commercial</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent"
            >
              <option value="all">Tout</option>
              <option value="month">Dernier mois</option>
              <option value="quarter">Dernier trimestre</option>
              <option value="year">Dernière année</option>
            </select>
          </div>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-sm text-gray-600">Chiffre d'affaires total</div>
            </div>
            <div className="text-3xl font-bold text-[#6B8E23]">{totalRevenue.toFixed(2)} €</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-sm text-gray-600">Nombre de commandes</div>
            </div>
            <div className="text-3xl font-bold text-blue-600">{totalOrders}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-sm text-gray-600">Panier moyen</div>
            </div>
            <div className="text-3xl font-bold text-purple-600">{globalAvgBasket.toFixed(2)} €</div>
          </div>
        </div>

        {/* KPI par Pharmacie */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#6B8E23] bg-opacity-10 rounded-lg">
                <Package className="w-5 h-5 text-[#6B8E23]" />
              </div>
              <h3 className="font-semibold text-gray-900">KPI par Pharmacie</h3>
            </div>
            <select
              value={sortPharmacy}
              onChange={(e) => setSortPharmacy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="revenue">Trier par CA</option>
              <option value="orders">Trier par commandes</option>
              <option value="basket">Trier par panier moyen</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pharmacie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ville</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commandes</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">CA Total</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Panier Moyen</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernière commande</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedPharmacies.map((pharmacy) => (
                  <tr key={pharmacy.pharmacy_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{pharmacy.pharmacy_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{pharmacy.pharmacy_city}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm text-gray-900">{pharmacy.total_orders}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-semibold text-[#6B8E23]">{pharmacy.total_revenue.toFixed(2)} €</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm text-gray-900">{pharmacy.average_basket.toFixed(2)} €</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {pharmacy.last_order_date ? new Date(pharmacy.last_order_date).toLocaleDateString('fr-FR') : '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* KPI par Produit */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">KPI par Produit</h3>
            </div>
            <select
              value={sortProduct}
              onChange={(e) => setSortProduct(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="revenue">Trier par CA</option>
              <option value="quantity">Trier par quantité</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantité vendue</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">CA Total</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nb commandes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedProducts.map((product) => (
                  <tr key={product.product_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{product.product_sku}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-semibold text-blue-600">{product.total_quantity}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-semibold text-[#6B8E23]">{product.total_revenue.toFixed(2)} €</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm text-gray-900">{product.order_count}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* KPI par Commercial */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">KPI par Commercial</h3>
            </div>
            <select
              value={sortCommercial}
              onChange={(e) => setSortCommercial(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="revenue">Trier par CA</option>
              <option value="orders">Trier par commandes</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commercial</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commandes</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">CA Total</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Panier Moyen</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pharmacies actives</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedCommercials.map((commercial) => (
                  <tr key={commercial.commercial_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{commercial.commercial_name}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm text-gray-900">{commercial.total_orders}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-semibold text-[#6B8E23]">{commercial.total_revenue.toFixed(2)} €</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm text-gray-900">{commercial.average_basket.toFixed(2)} €</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm text-gray-900">{commercial.active_pharmacies}</div>
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
