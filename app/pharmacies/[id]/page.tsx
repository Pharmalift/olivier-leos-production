'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Pharmacy, User, Order, PharmacyNote } from '@/types/database.types'
import AppLayout from '@/components/AppLayout'
import { MapPin, Phone, Mail, Calendar, FileText, ShoppingCart, Edit } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function PharmacyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [params.id])

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
      }

      // Charger la pharmacie
      const { data: pharmacyData } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('id', params.id)
        .single()

      if (pharmacyData) {
        setPharmacy(pharmacyData)
      }

      // Charger les commandes
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('pharmacy_id', params.id)
        .order('order_date', { ascending: false })

      if (ordersData) {
        setOrders(ordersData)
      }

      // Charger les notes
      const { data: notesData } = await supabase
        .from('pharmacy_notes')
        .select(`
          *,
          user:users(full_name)
        `)
        .eq('pharmacy_id', params.id)
        .order('created_at', { ascending: false })

      if (notesData) {
        setNotes(notesData)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!newNote.trim() || !user) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('pharmacy_notes')
        .insert({
          pharmacy_id: params.id as string,
          user_id: user.id,
          note_text: newNote.trim()
        })

      if (error) throw error

      setNewNote('')
      await loadData()
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la note:', error)
      alert('Erreur lors de l\'ajout de la note')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !user || !pharmacy) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>
  }

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-[#6B8E23]">{pharmacy.name}</h1>
            <p className="text-gray-600 mt-2">Fiche complète de la pharmacie</p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/pharmacies/${pharmacy.id}/edit`}
              className="flex items-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Edit className="w-5 h-5" />
              <span>Modifier</span>
            </Link>
            <Link
              href={`/orders/new?pharmacy=${pharmacy.id}`}
              className="flex items-center space-x-2 bg-[#6B8E23] text-white px-6 py-3 rounded-lg hover:bg-[#5a7a1d] transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Nouvelle commande</span>
            </Link>
          </div>
        </div>

        {/* Informations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Coordonnées</h2>
            <div className="space-y-3">
              {pharmacy.contact_name && (
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <span className="text-gray-600">Contact: </span>
                    <span className="text-gray-900 font-medium">{pharmacy.contact_name}</span>
                  </div>
                </div>
              )}
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <div className="text-gray-900">{pharmacy.address}</div>
                  <div className="text-gray-600">{pharmacy.postal_code} {pharmacy.city}</div>
                </div>
              </div>
              {pharmacy.phone && (
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  <div className="text-gray-900">{pharmacy.phone}</div>
                </div>
              )}
              {pharmacy.email && (
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  <div className="text-gray-900">{pharmacy.email}</div>
                </div>
              )}
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <span className="text-gray-600">Secteur: </span>
                  <span className="text-gray-900 font-medium">{pharmacy.sector}</span>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <span className="text-gray-600">Statut: </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    pharmacy.status === 'actif' ? 'bg-green-100 text-green-800' :
                    pharmacy.status === 'prospect' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {pharmacy.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <span className="text-gray-600">Remise: </span>
                  <span className="text-green-700 font-bold">{pharmacy.discount_rate}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Statistiques</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700">Commandes totales</span>
                <span className="text-2xl font-bold text-blue-600">{orders.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">CA total</span>
                <span className="text-2xl font-bold text-green-600">
                  {orders.reduce((sum, o) => sum + o.total_amount, 0).toFixed(2)} €
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Historique commandes */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Historique des commandes</h2>
          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Commande</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.order_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(order.order_date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{order.total_amount.toFixed(2)} €</td>
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
          ) : (
            <p className="text-gray-500 text-center py-4">Aucune commande</p>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Notes de visite</h2>

          <form onSubmit={handleAddNote} className="mb-6">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Ajouter une note..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent resize-none"
              rows={3}
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting || !newNote.trim()}
                className="bg-[#6B8E23] text-white px-6 py-2 rounded-lg hover:bg-[#5a7a1d] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Ajout...' : 'Ajouter la note'}
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="border-l-4 border-[#6B8E23] pl-4 py-2">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-gray-900">{note.user.full_name}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(note.created_at).toLocaleString('fr-FR')}
                  </span>
                </div>
                <p className="text-gray-700">{note.note_text}</p>
              </div>
            ))}
            {notes.length === 0 && (
              <p className="text-gray-500 text-center py-4">Aucune note</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
