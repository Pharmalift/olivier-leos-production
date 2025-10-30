'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Product, User } from '@/types/database.types'
import AppLayout from '@/components/AppLayout'
import { Plus, Edit, Trash2, Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminProductsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Soins Visage' as 'Soins Visage' | 'Soins Corps & Cheveux' | 'Hôtel & Spa',
    description: '',
    ean: '',
    price_ht: '',
    price_ttc: '',
    price_discounted: '',
    discount: '',
    pcb: '',
    is_recommended: false,
    is_active: true,
    image_url: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredProducts(filtered)
  }, [searchTerm, products])

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

      setUser(userData)

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (productsData) {
        setProducts(productsData)
        setFilteredProducts(productsData)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  function openModal(product?: Product) {
    if (product) {
      setEditingProduct(product)
      setFormData({
        sku: product.sku,
        name: product.name,
        category: product.category,
        description: product.description || '',
        ean: product.ean || '',
        price_ht: product.price_ht.toString(),
        price_ttc: product.price_ttc.toString(),
        price_discounted: product.price_discounted?.toString() || product.price_ttc.toString(),
        discount: product.discount?.toString() || '',
        pcb: product.pcb.toString(),
        is_recommended: product.is_recommended,
        is_active: product.is_active,
        image_url: product.image_url || '',
      })
    } else {
      setEditingProduct(null)
      setFormData({
        sku: '',
        name: '',
        category: 'Soins Visage',
        description: '',
        ean: '',
        price_ht: '',
        price_ttc: '',
        price_discounted: '',
        discount: '',
        pcb: '6',
        is_recommended: false,
        is_active: true,
        image_url: '',
      })
    }
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const productData = {
        sku: formData.sku,
        name: formData.name,
        category: formData.category,
        description: formData.description || null,
        ean: formData.ean || null,
        price_ht: parseFloat(formData.price_ht),
        price_ttc: parseFloat(formData.price_ttc),
        price_discounted: parseFloat(formData.price_discounted || formData.price_ttc),
        discount: formData.discount ? parseFloat(formData.discount) : null,
        pcb: parseInt(formData.pcb),
        is_recommended: formData.is_recommended,
        is_active: formData.is_active,
        image_url: formData.image_url || null,
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)

        if (error) throw error
        alert('Produit modifié avec succès !')
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData)

        if (error) throw error
        alert('Produit créé avec succès !')
      }

      setShowModal(false)
      loadData()
    } catch (error: any) {
      console.error('Erreur:', error)
      alert('Erreur: ' + error.message)
    }
  }

  async function toggleActive(product: Product) {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id)

      if (error) throw error
      loadData()
    } catch (error: any) {
      alert('Erreur: ' + error.message)
    }
  }

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>
  }

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#6B8E23]">Gestion des Produits</h1>
            <p className="text-gray-600 mt-2">{filteredProducts.length} produits</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center space-x-2 bg-[#6B8E23] text-white px-6 py-3 rounded-lg hover:bg-[#5a7a1d]"
          >
            <Plus className="w-5 h-5" />
            <span>Nouveau produit</span>
          </button>
        </div>

        {/* Recherche */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent"
            />
          </div>
        </div>

        {/* Liste des produits */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix HT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix TTC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PCB</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.price_ht.toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.price_ttc.toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.pcb}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActive(product)}
                        className={`px-2 py-1 text-xs rounded-full ${
                          product.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.is_active ? 'Actif' : 'Inactif'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => openModal(product)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
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
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        SKU *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23]"
                        placeholder="OL-SV-001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Catégorie *
                      </label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23]"
                      >
                        <option value="Soins Visage">Soins Visage</option>
                        <option value="Soins Corps & Cheveux">Soins Corps & Cheveux</option>
                        <option value="Hôtel & Spa">Hôtel & Spa</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom du produit *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23]"
                        placeholder="Crème Hydratante Visage 50ml"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23]"
                        placeholder="Description du produit..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        EAN
                      </label>
                      <input
                        type="text"
                        value={formData.ean}
                        onChange={(e) => setFormData({ ...formData, ean: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        PCB (unités/carton) *
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.pcb}
                        onChange={(e) => setFormData({ ...formData, pcb: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prix HT *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.price_ht}
                        onChange={(e) => setFormData({ ...formData, price_ht: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prix TTC *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.price_ttc}
                        onChange={(e) => setFormData({ ...formData, price_ttc: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prix remisé
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price_discounted}
                        onChange={(e) => setFormData({ ...formData, price_discounted: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Remise (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL de l'image
                      </label>
                      <input
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23]"
                        placeholder="https://..."
                      />
                    </div>

                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.is_recommended}
                          onChange={(e) => setFormData({ ...formData, is_recommended: e.target.checked })}
                          className="rounded border-gray-300 text-[#6B8E23] focus:ring-[#6B8E23]"
                        />
                        <span className="text-sm text-gray-700">Produit recommandé</span>
                      </label>
                    </div>

                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          className="rounded border-gray-300 text-[#6B8E23] focus:ring-[#6B8E23]"
                        />
                        <span className="text-sm text-gray-700">Produit actif</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-[#6B8E23] text-white rounded-lg hover:bg-[#5a7a1d]"
                    >
                      {editingProduct ? 'Modifier' : 'Créer'}
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
