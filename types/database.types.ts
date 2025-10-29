export interface User {
  id: string
  email: string
  full_name: string
  role: 'commercial' | 'admin'
  sector: string | null
  created_at: string
}

export interface Product {
  id: string
  sku: string
  name: string
  category: 'Soins Visage' | 'Soins Corps & Cheveux' | 'Hôtel & Spa'
  description: string | null
  pcb_price: number
  retail_price: number
  vat_rate: number
  stock_quantity: number
  is_active: boolean
}

export interface Pharmacy {
  id: string
  name: string
  address: string
  postal_code: string
  city: string
  phone: string | null
  email: string | null
  sector: string
  status: 'actif' | 'inactif' | 'prospect'
  assigned_commercial_id: string | null
  first_contact_date: string | null
  created_at?: string
}

export interface PharmacyNote {
  id: string
  pharmacy_id: string
  user_id: string
  note_text: string
  created_at: string
}

export interface Order {
  id: string
  order_number: string
  pharmacy_id: string
  commercial_id: string
  order_date: string
  status: 'en_attente' | 'validée' | 'expédiée' | 'livrée' | 'annulée'
  total_amount: number
  notes: string | null
}

export interface OrderLine {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  line_total: number
}

// Types avec relations pour les requêtes
export interface OrderWithRelations extends Order {
  pharmacy: Pharmacy
  commercial: User
  order_lines: (OrderLine & { product: Product })[]
}

export interface PharmacyWithCommercial extends Pharmacy {
  commercial?: User
}

export interface PharmacyNoteWithUser extends PharmacyNote {
  user: User
}
