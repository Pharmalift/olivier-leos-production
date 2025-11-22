'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Order, OrderLine, User, Pharmacy } from '@/types/database.types'
import AppLayout from '@/components/AppLayout'
import { ArrowLeft, Package, MapPin, User as UserIcon, Calendar, FileText, Edit2, Save, X, Plus, Trash2, XCircle } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { Product } from '@/types/database.types'

interface OrderWithDetails extends Order {
  pharmacy: Pharmacy
  commercial: User
  order_lines: (OrderLine & { product: { name: string } })[]
}

interface EditableOrderLine extends OrderLine {
  product: { name: string }
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editedLines, setEditedLines] = useState<EditableOrderLine[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>('')

  useEffect(() => {
    loadData()
    loadProducts()
  }, [orderId])

  async function loadProducts() {
    try {
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (products) {
        setAllProducts(products)
      }
    } catch (error) {
      console.error('Erreur chargement produits:', error)
    }
  }

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
          const { data: orderLines, error: linesError } = await supabase
            .from('order_lines')
            .select('*')
            .eq('order_id', orderData.id)

          console.log('Order lines loaded:', orderLines, 'Error:', linesError)

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

          console.log('Lines with products:', linesWithProducts)

          const finalOrder = {
            ...orderData,
            pharmacy: pharmacy!,
            commercial: commercial!,
            order_lines: linesWithProducts
          } as OrderWithDetails

          console.log('Final order:', finalOrder)

          setOrder(finalOrder)
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

  function startEdit() {
    setEditedLines(JSON.parse(JSON.stringify(order?.order_lines || [])))
    setEditMode(true)
  }

  function cancelEdit() {
    setEditMode(false)
    setEditedLines([])
    setSelectedProductId('')
  }

  function updateLineQuantity(lineId: string, newQuantity: number) {
    setEditedLines(lines => lines.map(line => {
      if (line.id === lineId) {
        const quantity = Math.max(1, newQuantity)
        const lineTotalHT = line.unit_price_ht * quantity
        const lineTotalTTC = line.unit_price_ttc * quantity
        return {
          ...line,
          quantity,
          line_total_ht: lineTotalHT,
          line_total_ttc: lineTotalTTC,
          line_total: lineTotalHT
        }
      }
      return line
    }))
  }

  function removeLine(lineId: string) {
    setEditedLines(lines => lines.filter(line => line.id !== lineId))
  }

  async function addProduct() {
    if (!selectedProductId) return

    const product = allProducts.find(p => p.id === selectedProductId)
    if (!product) return

    const newLine: EditableOrderLine = {
      id: `temp_${Date.now()}`,
      order_id: order!.id,
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      quantity: 1,
      unit_price_ht: product.pcb_price,
      unit_price_ttc: product.retail_price,
      line_total_ht: product.pcb_price,
      line_total_ttc: product.retail_price,
      line_total: product.pcb_price,
      created_at: new Date().toISOString(),
      product: { name: product.name }
    }

    setEditedLines([...editedLines, newLine])
    setSelectedProductId('')
  }

  async function saveChanges() {
    if (!order) return

    setUpdating(true)
    try {
      // Supprimer toutes les anciennes lignes
      const { error: deleteError } = await supabase
        .from('order_lines')
        .delete()
        .eq('order_id', order.id)

      if (deleteError) throw deleteError

      // Insérer les nouvelles lignes
      const linesToInsert = editedLines.map(line => ({
        order_id: order.id,
        product_id: line.product_id,
        product_name: line.product_name,
        product_sku: line.product_sku,
        quantity: line.quantity,
        unit_price_ht: line.unit_price_ht,
        unit_price_ttc: line.unit_price_ttc,
        line_total_ht: line.line_total_ht,
        line_total_ttc: line.line_total_ttc,
        line_total: line.line_total
      }))

      const { error: insertError } = await supabase
        .from('order_lines')
        .insert(linesToInsert)

      if (insertError) throw insertError

      // Recalculer les totaux avec remise et frais de port
      const totalHT = editedLines.reduce((sum, line) => sum + line.line_total_ht, 0)
      const discountRate = order.pharmacy.discount_rate || 0
      const discountAmount = (totalHT * discountRate) / 100
      const totalAfterDiscount = totalHT - discountAmount

      // Calculer les frais de port
      const shippingAmount = totalAfterDiscount < 300 ? 9.90 : 0
      const finalTotal = totalAfterDiscount + shippingAmount

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          total_before_discount: totalHT,
          discount_rate: discountRate,
          discount_amount: discountAmount,
          shipping_amount: shippingAmount,
          total_amount: finalTotal
        })
        .eq('id', order.id)

      if (updateError) throw updateError

      // Recharger les données
      await loadData()
      setEditMode(false)
      setEditedLines([])
      alert('Commande mise à jour avec succès !')
    } catch (error: any) {
      console.error('Erreur:', error)
      alert('Erreur lors de la sauvegarde : ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  async function cancelOrder() {
    if (!order || order.status !== 'en_attente') return

    const confirmed = confirm('Êtes-vous sûr de vouloir annuler cette commande ? Cette action ne peut pas être annulée.')
    if (!confirmed) return

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'annulée' })
        .eq('id', order.id)

      if (error) throw error

      await loadData()
      alert('Commande annulée avec succès')
    } catch (error: any) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'annulation : ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  async function deleteOrder() {
    if (!order || user?.role !== 'admin') return

    const confirmed = confirm(
      `ATTENTION: Vous êtes sur le point de SUPPRIMER DÉFINITIVEMENT la commande ${order.order_number}.\n\n` +
      'Cette action est IRRÉVERSIBLE et supprimera:\n' +
      '- La commande\n' +
      '- Toutes les lignes de commande associées\n\n' +
      'Êtes-vous absolument certain de vouloir continuer ?'
    )
    if (!confirmed) return

    setUpdating(true)
    try {
      // Supprimer d'abord les lignes de commande
      const { error: linesError } = await supabase
        .from('order_lines')
        .delete()
        .eq('order_id', order.id)

      if (linesError) throw linesError

      // Supprimer la commande
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', order.id)

      if (orderError) throw orderError

      alert('Commande supprimée définitivement')
      router.push('/orders')
    } catch (error: any) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression : ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  if (loading || !user || !order) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>
  }

  console.log('Order in render:', order)
  console.log('Order lines in render:', order.order_lines)

  const displayLines = editMode ? editedLines : (order.order_lines || [])
  const totalHT = displayLines.reduce((sum, line) => sum + (line.line_total_ht || 0), 0)
  const totalTTC = displayLines.reduce((sum, line) => sum + (line.line_total_ttc || 0), 0)
  const totalTVA = totalTTC - totalHT

  const canChangeStatus = user.role === 'admin'
  const canEdit = order.status === 'en_attente'

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

          {/* Statut et Actions */}
          <div className="flex items-center gap-3">
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

            {/* Bouton Annuler (pour commandes en attente) */}
            {order.status === 'en_attente' && (
              <button
                onClick={cancelOrder}
                disabled={updating}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                title="Annuler la commande"
              >
                <XCircle className="w-4 h-4" />
                <span>Annuler</span>
              </button>
            )}

            {/* Bouton Supprimer (admin uniquement) */}
            {user.role === 'admin' && (
              <button
                onClick={deleteOrder}
                disabled={updating}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                title="Supprimer définitivement la commande"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
              </button>
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
              {order.discount_rate > 0 && (
                <div className="flex justify-between text-green-700">
                  <span className="font-medium">Remise ({order.discount_rate}%) :</span>
                  <span className="font-medium">- {(order.discount_amount || 0).toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Total HT après remise :</span>
                <span className="font-medium text-gray-900">{((order.total_amount || totalHT) - (order.shipping_amount || 0)).toFixed(2)} €</span>
              </div>
              <div className={`flex justify-between ${(order.shipping_amount || 0) === 0 ? 'text-green-700' : 'text-orange-700'}`}>
                <span className="font-medium">
                  Frais de port :
                  {(order.shipping_amount || 0) === 0 && <span className="text-xs ml-1">(Offerts)</span>}
                </span>
                <span className="font-medium">{(order.shipping_amount || 0) === 0 ? 'OFFERTS' : `${(order.shipping_amount || 0).toFixed(2)} €`}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold text-gray-900">TOTAL FINAL :</span>
                <span className="font-bold text-[#6B8E23] text-lg">{(order.total_amount || totalHT).toFixed(2)} €</span>
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
          <div className="p-6 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              Produits commandés ({displayLines.length})
            </h3>
            {canEdit && !editMode && (
              <button
                onClick={startEdit}
                className="flex items-center gap-2 px-4 py-2 bg-[#6B8E23] text-white rounded-lg hover:bg-[#556B1F] transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Modifier
              </button>
            )}
            {editMode && (
              <div className="flex gap-2">
                <button
                  onClick={saveChanges}
                  disabled={updating || displayLines.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Sauvegarder
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={updating}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Annuler
                </button>
              </div>
            )}
          </div>

          {editMode && (
            <div className="p-6 border-b bg-gray-50">
              <div className="flex gap-2">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent"
                >
                  <option value="">Sélectionner un produit à ajouter...</option>
                  {allProducts.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.retail_price.toFixed(2)} €
                    </option>
                  ))}
                </select>
                <button
                  onClick={addProduct}
                  disabled={!selectedProductId}
                  className="flex items-center gap-2 px-4 py-2 bg-[#6B8E23] text-white rounded-lg hover:bg-[#556B1F] transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>
            </div>
          )}
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
                    Total HT
                  </th>
                  {editMode && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayLines.map((line) => (
                  <tr key={line.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{line.product_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{line.product_sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {editMode ? (
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => updateLineQuantity(line.id, parseInt(e.target.value) || 1)}
                          className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{line.quantity}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">{line.unit_price_ht.toFixed(2)} €</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-[#6B8E23]">{line.line_total_ht.toFixed(2)} €</div>
                    </td>
                    {editMode && (
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => removeLine(line.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={editMode ? 4 : 4} className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    TOTAL HT :
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-gray-900">{totalHT.toFixed(2)} €</div>
                  </td>
                  {editMode && <td></td>}
                </tr>
                {order.discount_rate > 0 && (
                  <tr className="bg-green-50">
                    <td colSpan={editMode ? 4 : 4} className="px-6 py-4 text-right text-sm font-semibold text-green-700">
                      REMISE ({order.discount_rate}%) :
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-green-700">- {(order.discount_amount || 0).toFixed(2)} €</div>
                    </td>
                    {editMode && <td></td>}
                  </tr>
                )}
                <tr className="bg-gray-100">
                  <td colSpan={editMode ? 4 : 4} className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    TOTAL HT APRÈS REMISE :
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-gray-900">{((order.total_amount || totalHT) - (order.shipping_amount || 0)).toFixed(2)} €</div>
                  </td>
                  {editMode && <td></td>}
                </tr>
                <tr className={(order.shipping_amount || 0) === 0 ? 'bg-green-50' : 'bg-orange-50'}>
                  <td colSpan={editMode ? 4 : 4} className={`px-6 py-4 text-right text-sm font-semibold ${(order.shipping_amount || 0) === 0 ? 'text-green-700' : 'text-orange-700'}`}>
                    FRAIS DE PORT :
                    {(order.shipping_amount || 0) === 0 && <span className="text-xs ml-2">(Offerts dès 300€)</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`text-sm font-bold ${(order.shipping_amount || 0) === 0 ? 'text-green-700' : 'text-orange-700'}`}>
                      {(order.shipping_amount || 0) === 0 ? 'OFFERTS' : `${(order.shipping_amount || 0).toFixed(2)} €`}
                    </div>
                  </td>
                  {editMode && <td></td>}
                </tr>
                <tr className="bg-[#6B8E23]">
                  <td colSpan={editMode ? 4 : 4} className="px-6 py-4 text-right text-sm font-bold text-white">
                    TOTAL FINAL :
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-white text-lg">{(order.total_amount || totalHT).toFixed(2)} €</div>
                  </td>
                  {editMode && <td></td>}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
