'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Pharmacy, Product, User } from '@/types/database.types'
import AppLayout from '@/components/AppLayout'
import { ChevronRight, ChevronLeft, Check, ShoppingCart, Trash2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface CartItem {
  product: Product
  quantity: number
}

function NewOrderForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)

  // Étape 1: Sélection pharmacie
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null)

  // Étape 2: Ajout produits
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // Étape 3: Notes
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

      if (userData) {
        setUser(userData)

        // Charger pharmacies
        let pharmaciesQuery = supabase
          .from('pharmacies')
          .select('*')
          .order('name', { ascending: true })

        if (userData.role === 'commercial') {
          pharmaciesQuery = pharmaciesQuery.eq('assigned_commercial_id', userData.id)
        }

        const { data: pharmaciesData } = await pharmaciesQuery
        if (pharmaciesData) {
          setPharmacies(pharmaciesData)

          // Si pharmacy ID dans URL, pré-sélectionner
          const pharmacyId = searchParams.get('pharmacy')
          if (pharmacyId) {
            const pharmacy = pharmaciesData.find(p => p.id === pharmacyId)
            if (pharmacy) {
              setSelectedPharmacy(pharmacy)
              setStep(2)
            }
          }
        }

        // Charger produits
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true })

        if (productsData) {
          setProducts(productsData)
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  function addToCart(product: Product) {
    const existing = cart.find(item => item.product.id === product.id)
    if (existing) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { product, quantity: 1 }])
    }
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.product.id !== productId))
    } else {
      setCart(cart.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      ))
    }
  }

  function removeFromCart(productId: string) {
    setCart(cart.filter(item => item.product.id !== productId))
  }

  function calculateTotal() {
    return cart.reduce((sum, item) => sum + (item.product.pcb_price * item.quantity), 0)
  }

  async function submitOrder() {
    if (!selectedPharmacy || !user || cart.length === 0) return

    setSubmitting(true)
    try {
      // Debug: Vérifier le contenu du panier AVANT l'envoi
      console.log('🛒 Panier avant soumission:', cart)
      cart.forEach((item, index) => {
        console.log(`  Produit ${index + 1}:`, {
          name: item.product.name,
          sku: item.product.sku,
          pcb_price: item.product.pcb_price,
          quantity: item.quantity
        })
      })

      // Générer numéro de commande
      const orderNumber = `CMD-${Date.now()}`

      // Créer la commande
      const totalHT = calculateTotal()
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          pharmacy_id: selectedPharmacy.id,
          commercial_id: user.id,
          order_date: new Date().toISOString(),
          status: 'en_attente',
          total_amount: totalHT,
          notes: notes || null
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Créer les lignes de commande
      const orderLines = cart.map(item => {
        console.log('Product in cart:', item.product)
        if (!item.product.pcb_price) {
          throw new Error(`Le produit ${item.product.name} n'a pas de prix PCB`)
        }
        const unitPriceHT = Number(item.product.pcb_price)
        const unitPriceTTC = Number(item.product.retail_price)
        const vatRate = Number(item.product.vat_rate) / 100
        const quantity = Number(item.quantity)

        const lineTotalHT = Number(unitPriceHT * quantity)
        const lineTotalTTC = Number(unitPriceTTC * quantity)

        return {
          order_id: order.id,
          product_id: item.product.id,
          product_name: item.product.name,
          product_sku: item.product.sku,
          quantity: quantity,
          unit_price_ht: unitPriceHT,
          unit_price_ttc: unitPriceTTC,
          line_total_ht: lineTotalHT,
          line_total_ttc: lineTotalTTC,
          line_total: lineTotalHT  // Pour compatibilité
        }
      })

      console.log('Order lines to insert:', orderLines)

      const { data: insertedLines, error: linesError } = await supabase
        .from('order_lines')
        .insert(orderLines)
        .select()

      console.log('Insert result:', { insertedLines, linesError })

      if (linesError) throw linesError

      // Envoyer les emails en arrière-plan (ne pas attendre)
      if (selectedPharmacy.email) {
        sendOrderEmails(order.id, orderNumber, selectedPharmacy.email).catch(error => {
          console.error('Erreur lors de l\'envoi des emails:', error)
          // Ne pas bloquer la création de la commande
        })
      }

      alert('Commande créée avec succès! Les emails de confirmation sont en cours d\'envoi.')
      router.push('/orders')
    } catch (error: any) {
      console.error('Erreur:', error)
      alert('Erreur lors de la création de la commande: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function sendOrderEmails(orderId: string, orderNumber: string, pharmacyEmail: string) {
    try {
      // Appeler l'API pour envoyer les emails
      const response = await fetch('/api/send-order-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          orderNumber,
          pharmacyEmail,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors de l\'envoi des emails')
      }

      const result = await response.json()
      console.log('Emails envoyés:', result)
    } catch (error) {
      console.error('Erreur sendOrderEmails:', error)
      throw error
    }
  }

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#6B8E23]">Nouvelle commande</h1>
          <p className="text-gray-600 mt-2">Créer une commande en 3 étapes</p>
        </div>

        {/* Indicateur d'étapes */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= s ? 'bg-[#6B8E23] text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s ? <Check className="w-6 h-6" /> : s}
                </div>
                <div className="ml-3">
                  <div className={`font-medium ${step >= s ? 'text-[#6B8E23]' : 'text-gray-500'}`}>
                    {s === 1 && 'Pharmacie'}
                    {s === 2 && 'Produits'}
                    {s === 3 && 'Récapitulatif'}
                  </div>
                </div>
                {s < 3 && <ChevronRight className="ml-auto text-gray-400" />}
              </div>
            ))}
          </div>
        </div>

        {/* Étape 1: Sélection pharmacie */}
        {step === 1 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Sélectionner une pharmacie</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pharmacies.map((pharmacy) => (
                <div
                  key={pharmacy.id}
                  onClick={() => setSelectedPharmacy(pharmacy)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedPharmacy?.id === pharmacy.id
                      ? 'border-[#6B8E23] bg-green-50'
                      : 'border-gray-200 hover:border-[#6B8E23]'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{pharmacy.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{pharmacy.city}</div>
                  <div className="text-sm text-gray-500">{pharmacy.sector}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!selectedPharmacy}
                className="flex items-center space-x-2 bg-[#6B8E23] text-white px-6 py-3 rounded-lg hover:bg-[#5a7a1d] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Suivant</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Étape 2: Ajout produits */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Ajouter des produits</h2>
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent mb-4"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="font-semibold text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-600">{product.sku}</div>
                    <div className="text-lg font-bold text-[#6B8E23] mt-2">{product.pcb_price.toFixed(2)} €</div>
                    <button
                      onClick={() => addToCart(product)}
                      className="mt-3 w-full bg-[#6B8E23] text-white py-2 rounded-lg hover:bg-[#5a7a1d] transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4 inline mr-2" />
                      Ajouter
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Panier */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Panier ({cart.length})</h2>
              {cart.length > 0 ? (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.product.name}</div>
                        <div className="text-sm text-gray-600">{item.product.pcb_price.toFixed(2)} € x {item.quantity}</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value))}
                          className="w-20 px-2 py-1 border rounded-lg text-center"
                        />
                        <div className="font-bold text-[#6B8E23] w-24 text-right">
                          {(item.product.pcb_price * item.quantity).toFixed(2)} €
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-3 flex justify-between items-center text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-[#6B8E23]">{calculateTotal().toFixed(2)} €</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Panier vide</p>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Précédent</span>
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={cart.length === 0}
                className="flex items-center space-x-2 bg-[#6B8E23] text-white px-6 py-3 rounded-lg hover:bg-[#5a7a1d] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Suivant</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Étape 3: Récapitulatif */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Récapitulatif</h2>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Pharmacie</h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">{selectedPharmacy?.name}</div>
                  <div className="text-sm text-gray-600">{selectedPharmacy?.city}</div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Produits ({cart.length})</h3>
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{item.product.name}</div>
                        <div className="text-sm text-gray-600">Quantité: {item.quantity}</div>
                      </div>
                      <div className="font-bold">{(item.product.pcb_price * item.quantity).toFixed(2)} €</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-[#6B8E23] text-white rounded-lg flex justify-between text-xl font-bold">
                  <span>Total HT:</span>
                  <span>{calculateTotal().toFixed(2)} €</span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Notes (optionnel)</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Remarques sur la commande..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Précédent</span>
              </button>
              <button
                onClick={submitOrder}
                disabled={submitting}
                className="flex items-center space-x-2 bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-5 h-5" />
                <span>{submitting ? 'Création...' : 'Valider la commande'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5DC]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#6B8E23] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#6B8E23]">Chargement...</p>
        </div>
      </div>
    }>
      <NewOrderForm />
    </Suspense>
  )
}
