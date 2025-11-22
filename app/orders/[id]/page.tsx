'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Order, OrderLine, User, Pharmacy } from '@/types/database.types'
import AppLayout from '@/components/AppLayout'
import { ArrowLeft, Package, MapPin, User as UserIcon, Calendar, FileText } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'

interface OrderWithDetails extends Order {
  pharmacy: Pharmacy
  commercial: User
  order_lines: (OrderLine & { product: { name: string } })[]
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadData()
  }, [orderId])

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

        // Charger la commande
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single()

        if (orderError) {
          console.error('Erreur chargement commande:', orderError)
          return
        }

        if (orderData) {
          // Charger la pharmacie
          const { data: pharmacy } = await supabase
            .from('pharmacies')
            .select('*')
            .eq('id', orderData.pharmacy_id)
            .single()

          // Charger le commercial
          const { data: commercial } = await supabase
            .from('users')
            .select('*')
            .eq('id', orderData.commercial_id)
            .single()

          // Charger les lignes de commande
          const { data: orderLines } = await supabase
            .from('order_lines')
            .select('*')
            .eq('order_id', orderData.id)

          // Pour chaque ligne, charger le nom du produit
          const linesWithProducts = await Promise.all(
            (orderLines || []).map(async (line) => {
              const { data: product } = await supabase
                .from('products')
                .select('name')
                .eq('id', line.product_id)
                .single()

              return {
                ...line,
                product: product || { name: line.product_name }
              }
            })
          )

          setOrder({
            ...orderData,
            pharmacy: pharmacy!,
            commercial: commercial!,
            order_lines: linesWithProducts
          } as OrderWithDetails)
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(newStatus: string) {
    if (!order || !user) return

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id)

      if (error) throw error

      // Recharger les données
      await loadData()
      alert('Statut mis à jour avec succès !')
    } catch (error: any) {
      console.error('Erreur:', error)
      alert('Erreur lors de la mise à jour du statut : ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  if (loading || !user || !order) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>
  }

  const totalHT = order.order_lines.reduce((sum, line) => sum + line.line_total_ht, 0)
  const totalTTC = order.order_lines.reduce((sum, line) => sum + line.line_total_ttc, 0)
  const totalTVA = totalTTC - totalHT

  const canChangeStatus = user.role === 'admin'

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/orders')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[#6B8E23]">
                Commande {order.order_number}
              </h1>
              <p className="text-gray-600 mt-1">
                Créée le {new Date(order.order_date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Statut */}
          <div className="flex items-center gap-4">
            <span className={`px-4 py-2 inline-flex text-sm font-semibold rounded-full ${
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

            {canChangeStatus && order.status !== 'annulée' && (
              <select
                value={order.status}
                onChange={(e) => updateStatus(e.target.value)}
                disabled={updating}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent disabled:opacity-50"
              >
                <option value="en_attente">En attente</option>
                <option value="validée">Validée</option>
                <option value="expédiée">Expédiée</option>
                <option value="livrée">Livrée</option>
                <option value="annulée">Annulée</option>
              </select>
            )}
          </div>
        </div>

        {/* Informations principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pharmacie */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#6B8E23] bg-opacity-10 rounded-lg">
                <MapPin className="w-5 h-5 text-[#6B8E23]" />
              </div>
              <h3 className="font-semibold text-gray-900">Pharmacie</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-gray-900">{order.pharmacy.name}</p>
              <p className="text-gray-600">{order.pharmacy.address}</p>
              <p className="text-gray-600">
                {order.pharmacy.postal_code} {order.pharmacy.city}
              </p>
              {order.pharmacy.phone && (
                <p className="text-gray-600">{order.pharmacy.phone}</p>
              )}
              {order.pharmacy.email && (
                <p className="text-gray-600">{order.pharmacy.email}</p>
              )}
            </div>
          </div>

          {/* Commercial */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#6B8E23] bg-opacity-10 rounded-lg">
                <UserIcon className="w-5 h-5 text-[#6B8E23]" />
              </div>
              <h3 className="font-semibold text-gray-900">Commercial</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-gray-900">{order.commercial.full_name}</p>
              <p className="text-gray-600">{order.commercial.email}</p>
              {order.commercial.sector && (
                <p className="text-gray-600">Secteur : {order.commercial.sector}</p>
              )}
            </div>
          </div>

          {/* Totaux */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#6B8E23] bg-opacity-10 rounded-lg">
                <Package className="w-5 h-5 text-[#6B8E23]" />
              </div>
              <h3 className="font-semibold text-gray-900">Montants</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total HT :</span>
                <span className="font-medium text-gray-900">{totalHT.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">TVA :</span>
                <span className="font-medium text-gray-900">{totalTVA.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold text-gray-900">Total TTC :</span>
                <span className="font-bold text-[#6B8E23] text-lg">{totalTTC.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#6B8E23] bg-opacity-10 rounded-lg">
                <FileText className="w-5 h-5 text-[#6B8E23]" />
              </div>
              <h3 className="font-semibold text-gray-900">Notes</h3>
            </div>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.notes}</p>
          </div>
        )}

        {/* Produits commandés */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="font-semibold text-gray-900">
              Produits commandés ({order.order_lines.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Référence
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantité
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix unitaire HT
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix unitaire TTC
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total HT
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total TTC
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.order_lines.map((line) => (
                  <tr key={line.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{line.product_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{line.product_sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">{line.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">{line.unit_price_ht.toFixed(2)} €</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">{line.unit_price_ttc.toFixed(2)} €</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">{line.line_total_ht.toFixed(2)} €</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-[#6B8E23]">{line.line_total_ttc.toFixed(2)} €</div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    TOTAUX :
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-gray-900">{totalHT.toFixed(2)} €</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-[#6B8E23] text-lg">{totalTTC.toFixed(2)} €</div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
