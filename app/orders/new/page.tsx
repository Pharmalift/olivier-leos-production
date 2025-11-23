'use client'

import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Pharmacy, Product, User } from '@/types/database.types'
import AppLayout from '@/components/AppLayout'
import { ChevronRight, ChevronLeft, Check, ShoppingCart, Trash2, Plus, Minus, AlertCircle, Package } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface CartItem {
  product: Product
  quantity: number
}

// Données d'implantation type (SKU mis à jour selon la base de données)
const IMPLANTATION_DEFAULTS: Record<string, number> = {
  'HN100OL22': 6,  // Huile Nettoyante Démaquillante 100ml
  'TV100OL21': 6,  // Brume Tonique Rafraîchissante 100ml
  'SV030OL21': 6,  // Sérum Perlé Sublimateur 30ml
  'CV050OL21': 6,  // Crème Confort Globale 50ml
  'EV075OL25': 6,  // Exfoliant Moussant Pureté 75ml
  'MV075OL25': 6,  // Masque Hydratant Eclat 75ml
  'BR005OL20': 12, // Beurre Réconfort multiusages 5g
  'HS100OL20': 6,  // Huile Sèche Sublime 100ml
  'SS080OL25': 12, // Savon Parfumé Olivier Verveine 80g
  'SM290OL20': 6,  // Savon Essentiel pour les mains 290ml
  'SM500OL21': 6,  // Ecorecharge Savon Essentiel 500ml
  'SH290OL23': 6   // Shampoing Doux 290ml
}

function NewOrderForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)

  // Étape 1: Sélection pharmacie et type de commande
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null)
  const [orderType, setOrderType] = useState<'implantation' | 'reassort'>('reassort')

  // Étape 2: Ajout produits
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

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

  function proceedToStep2() {
    if (!selectedPharmacy) return

    // Si commande d'implantation, pré-remplir le panier
    if (orderType === 'implantation') {
      const implantationCart: CartItem[] = []
      products.forEach(product => {
        const defaultQty = IMPLANTATION_DEFAULTS[product.sku]
        if (defaultQty) {
          implantationCart.push({ product, quantity: defaultQty })
        }
      })
      setCart(implantationCart)
    } else {
      setCart([])
    }

    setStep(2)
  }

  function addToCart(product: Product) {
    const existing = cart.find(item => item.product.id === product.id)
    if (existing) {
      updateQuantity(product.id, existing.quantity + 1)
    } else {
      setCart([...cart, { product, quantity: product.minimum_order_quantity }])
    }
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.product.id !== productId))
      // Remove validation error when removing product
      const newErrors = { ...validationErrors }
      delete newErrors[productId]
      setValidationErrors(newErrors)
    } else {
      setCart(cart.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      ))
      // Validate minimum
      const product = cart.find(item => item.product.id === productId)?.product
      if (product && quantity > 0 && quantity < product.minimum_order_quantity) {
        setValidationErrors({
          ...validationErrors,
          [productId]: `⚠️ Quantité insuffisante - Minimum : ${product.minimum_order_quantity} unités`
        })
      } else {
        const newErrors = { ...validationErrors }
        delete newErrors[productId]
        setValidationErrors(newErrors)
      }
    }
  }

  function removeFromCart(productId: string) {
    setCart(cart.filter(item => item.product.id !== productId))
    const newErrors = { ...validationErrors }
    delete newErrors[productId]
    setValidationErrors(newErrors)
  }

  function calculateDiscountedPrice(price: number, discountRate: number): number {
    return price * (1 - discountRate / 100)
  }

  function calculateTotal() {
    if (!selectedPharmacy) return 0
    const totalHT = cart.reduce((sum, item) => sum + (item.product.pcb_price * item.quantity), 0)
    return calculateDiscountedPrice(totalHT, selectedPharmacy.discount_rate)
  }

  function validateCart(): boolean {
    const errors: Record<string, string> = {}
    let hasErrors = false

    cart.forEach(item => {
      if (item.quantity > 0 && item.quantity < item.product.minimum_order_quantity) {
        errors[item.product.id] = `⚠️ Quantité insuffisante - Minimum : ${item.product.minimum_order_quantity} unités`
        hasErrors = true
      }
    })

    setValidationErrors(errors)

    if (hasErrors) {
      alert('Certains produits ne respectent pas les quantités minimales de commande. Veuillez corriger avant de continuer.')
    }

    return !hasErrors
  }

  function proceedToStep3() {
    if (validateCart()) {
      setStep(3)
    }
  }

  async function submitOrder() {
    if (!selectedPharmacy || !user || cart.length === 0) return
    if (!validateCart()) return

    setSubmitting(true)
    try {
      // Générer numéro de commande
      const orderNumber = `CMD-${Date.now()}`

      // Calculer les totaux
      const totalHT = cart.reduce((sum, item) => sum + (item.product.pcb_price * item.quantity), 0)
      const discountRate = selectedPharmacy.discount_rate || 0
      const discountAmount = (totalHT * discountRate) / 100
      const totalAfterDiscount = totalHT - discountAmount

      // Calculer les frais de port
      const shippingAmount = totalAfterDiscount < 300 ? 9.90 : 0
      const finalTotal = totalAfterDiscount + shippingAmount

      // Créer la commande
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          pharmacy_id: selectedPharmacy.id,
          commercial_id: user.id,
          order_date: new Date().toISOString(),
          status: 'en_attente',
          order_type: orderType,
          total_before_discount: totalHT,
          discount_rate: discountRate,
          discount_amount: discountAmount,
          shipping_amount: shippingAmount,
          total_amount: finalTotal,
          notes: notes || null
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Créer les lignes de commande
      const orderLines = cart.map(item => {
        const unitPriceHT = Number(item.product.pcb_price)  // Prix BRUT (sans remise)
        const unitPriceTTC = Number(item.product.retail_price)
        const quantity = Number(item.quantity)

        const lineTotalHT = unitPriceHT * quantity  // Total BRUT (sans remise)
        const lineTotalTTC = unitPriceTTC * quantity

        return {
          order_id: order.id,
          product_id: item.product.id,
          product_name: item.product.name,
          product_sku: item.product.sku,
          product_ean: item.product.ean,  // Code-barres EAN
          quantity: quantity,
          unit_price_ht: unitPriceHT,  // Prix unitaire BRUT
          unit_price_ttc: unitPriceTTC,
          line_total_ht: lineTotalHT,  // Total ligne BRUT
          line_total_ttc: lineTotalTTC,
          line_total: lineTotalHT
        }
      })

      const { error: linesError } = await supabase
        .from('order_lines')
        .insert(orderLines)

      if (linesError) throw linesError

      // Envoyer les emails en arrière-plan (non-bloquant)
      if (selectedPharmacy.email) {
        sendOrderEmails(order.id, orderNumber, selectedPharmacy.email).catch(error => {
          console.error('⚠️ Erreur lors de l\'envoi des emails (non-bloquant):', error)
          // L'erreur est loggée mais n'empêche pas la création de la commande
        })
      }

      alert('✅ Commande créée avec succès!\n\n📧 Les emails de confirmation sont en cours d\'envoi.')
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

  const cartProductIds = new Set(cart.map(item => item.product.id))

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
                    {s === 1 && 'Pharmacie & Type'}
                    {s === 2 && 'Produits'}
                    {s === 3 && 'Récapitulatif'}
                  </div>
                </div>
                {s < 3 && <ChevronRight className="ml-auto text-gray-400" />}
              </div>
            ))}
          </div>
        </div>

        {/* Étape 1: Sélection pharmacie et type de commande */}
        {step === 1 && (
          <div className="space-y-6">
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
                    <div className="text-sm font-medium text-[#6B8E23] mt-2">
                      Remise: {pharmacy.discount_rate}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedPharmacy && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Type de commande</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    onClick={() => setOrderType('implantation')}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-colors ${
                      orderType === 'implantation'
                        ? 'border-[#6B8E23] bg-green-50'
                        : 'border-gray-200 hover:border-[#6B8E23]'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Package className="w-6 h-6 text-[#6B8E23]" />
                      <div className="font-semibold text-lg text-gray-900">Commande d'implantation</div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p className="mb-2">Première commande pour une nouvelle pharmacie</p>
                      <p className="font-medium text-[#6B8E23]">✓ Gamme pré-remplie automatiquement</p>
                      <p className="font-medium text-gray-700 mt-2">Montant indicatif: ~1 263 € HT</p>
                    </div>
                  </div>

                  <div
                    onClick={() => setOrderType('reassort')}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-colors ${
                      orderType === 'reassort'
                        ? 'border-[#6B8E23] bg-green-50'
                        : 'border-gray-200 hover:border-[#6B8E23]'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <ShoppingCart className="w-6 h-6 text-[#6B8E23]" />
                      <div className="font-semibold text-lg text-gray-900">Commande de réassort</div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p className="mb-2">Commande libre pour réapprovisionner</p>
                      <p className="font-medium text-[#6B8E23]">✓ Sélection manuelle des produits</p>
                      <p className="font-medium text-gray-700 mt-2">Minimums de commande à respecter</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={proceedToStep2}
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
        {step === 2 && selectedPharmacy && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {orderType === 'implantation' ? 'Gamme d\'implantation' : 'Ajouter des produits'}
                </h2>
                {orderType === 'implantation' && (
                  <span className="text-sm text-gray-600">
                    Vous pouvez modifier les quantités ou ajouter d'autres produits
                  </span>
                )}
              </div>

              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent mb-4"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => {
                  const isInCart = cartProductIds.has(product.id)
                  const discountedPrice = calculateDiscountedPrice(product.pcb_price, selectedPharmacy.discount_rate)

                  return (
                    <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="font-semibold text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-600">{product.sku}</div>

                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Prix HT brut:</span>
                          <span className="text-sm line-through text-gray-400">{product.pcb_price.toFixed(2)} €</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-green-700 font-medium">Remisé (-{selectedPharmacy.discount_rate}%):</span>
                          <span className="text-lg font-bold text-[#6B8E23]">{discountedPrice.toFixed(2)} €</span>
                        </div>
                      </div>

                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                          Minimum: {product.minimum_order_quantity} unités
                        </span>
                      </div>

                      <button
                        onClick={() => addToCart(product)}
                        disabled={isInCart}
                        className={`mt-3 w-full py-2 rounded-lg transition-colors ${
                          isInCart
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-[#6B8E23] text-white hover:bg-[#5a7a1d]'
                        }`}
                      >
                        {isInCart ? (
                          <>
                            <Check className="w-4 h-4 inline mr-2" />
                            Dans le panier
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4 inline mr-2" />
                            Ajouter
                          </>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Panier */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Panier ({cart.length} produit{cart.length > 1 ? 's' : ''})</h2>
              {cart.length > 0 ? (
                <div className="space-y-3">
                  {cart.map((item) => {
                    const discountedPrice = calculateDiscountedPrice(item.product.pcb_price, selectedPharmacy.discount_rate)
                    const hasError = validationErrors[item.product.id]

                    return (
                      <div key={item.product.id} className={`p-3 border rounded-lg ${hasError ? 'border-red-300 bg-red-50' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{item.product.name}</div>
                            <div className="text-sm text-gray-600">
                              {discountedPrice.toFixed(2)} € x {item.quantity} = {(discountedPrice * item.quantity).toFixed(2)} €
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Minimum: {item.product.minimum_order_quantity} unités
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center border rounded-lg">
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="p-2 hover:bg-gray-100 rounded-l-lg"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 text-center border-x"
                              />
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="p-2 hover:bg-gray-100 rounded-r-lg"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="font-bold text-[#6B8E23] w-24 text-right">
                              {(discountedPrice * item.quantity).toFixed(2)} €
                            </div>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        {hasError && (
                          <div className="mt-2 text-sm text-red-700 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {hasError}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-lg">
                      <span className="font-medium">Total HT (avec remise {selectedPharmacy.discount_rate}%):</span>
                      <span className="font-bold text-[#6B8E23]">{calculateTotal().toFixed(2)} €</span>
                    </div>
                    <div className={`flex justify-between text-sm ${
                      calculateTotal() >= 300 ? 'text-green-700' : 'text-orange-700'
                    }`}>
                      <span>Frais de port:</span>
                      <span className="font-medium">
                        {calculateTotal() >= 300 ? 'OFFERTS' : '9.90 €'}
                      </span>
                    </div>
                    {calculateTotal() < 300 && (
                      <div className="text-xs text-gray-600 text-right">
                        Plus que {(300 - calculateTotal()).toFixed(2)} € pour la livraison offerte
                      </div>
                    )}
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
                onClick={proceedToStep3}
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
        {step === 3 && selectedPharmacy && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Récapitulatif</h2>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Type de commande</h3>
                <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                  {orderType === 'implantation' ? (
                    <>
                      <Package className="w-5 h-5 text-[#6B8E23]" />
                      <span className="font-medium">Commande d'implantation</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 text-[#6B8E23]" />
                      <span className="font-medium">Commande de réassort</span>
                    </>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Pharmacie</h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">{selectedPharmacy.name}</div>
                  <div className="text-sm text-gray-600">{selectedPharmacy.city}</div>
                  <div className="text-sm text-[#6B8E23] font-medium mt-1">
                    Taux de remise: {selectedPharmacy.discount_rate}%
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Produits ({cart.length})</h3>
                <div className="space-y-2">
                  {cart.map((item) => {
                    const discountedPrice = calculateDiscountedPrice(item.product.pcb_price, selectedPharmacy.discount_rate)
                    return (
                      <div key={item.product.id} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-sm text-gray-600">
                            {discountedPrice.toFixed(2)} € x {item.quantity}
                          </div>
                        </div>
                        <div className="font-bold">{(discountedPrice * item.quantity).toFixed(2)} €</div>
                      </div>
                    )
                  })}
                </div>

                {/* Calcul des totaux */}
                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg flex justify-between text-lg">
                    <span className="font-medium">Total HT (après remise {selectedPharmacy.discount_rate}%):</span>
                    <span className="font-bold">{calculateTotal().toFixed(2)} €</span>
                  </div>

                  <div className={`p-3 rounded-lg flex justify-between text-lg ${
                    calculateTotal() < 300
                      ? 'bg-orange-50 text-orange-700'
                      : 'bg-green-50 text-green-700'
                  }`}>
                    <span className="font-medium">
                      Frais de port:
                      {calculateTotal() >= 300 && (
                        <span className="text-sm ml-2">(Offerts dès 300€)</span>
                      )}
                    </span>
                    <span className="font-bold">
                      {calculateTotal() < 300 ? '9.90 €' : 'OFFERTS'}
                    </span>
                  </div>

                  <div className="p-4 bg-[#6B8E23] text-white rounded-lg flex justify-between text-xl font-bold">
                    <span>TOTAL FINAL:</span>
                    <span>
                      {(calculateTotal() + (calculateTotal() < 300 ? 9.90 : 0)).toFixed(2)} €
                    </span>
                  </div>
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
