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
  ean: string | null
  name: string
  category: 'Soins Visage' | 'Soins Corps & Cheveux' | 'Hôtel & Spa'
  description: string | null
  pcb_price: number
  retail_price: number
  vat_rate: number
  stock_quantity: number
  is_active: boolean
  image_url: string | null
  minimum_order_quantity: number
  created_at: string
  updated_at: string
}

export interface Pharmacy {
  id: string
  name: string
  contact_name: string | null
  address: string
  postal_code: string
  city: string
  phone: string | null
  email: string | null
  sector: string
  status: 'actif' | 'inactif' | 'prospect'
  assigned_commercial_id: string | null
  first_contact_date: string | null
  discount_rate: number
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
  pharmacy_id: string | null
  commercial_id: string | null
  order_date: string
  status: 'en_attente' | 'validée' | 'expédiée' | 'livrée' | 'annulée'
  order_type: 'implantation' | 'reassort'
  total_amount: number
  total_before_discount: number
  discount_rate: number
  discount_amount: number
  shipping_amount: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderLine {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  product_sku: string
  product_ean: string | null
  quantity: number
  unit_price_ht: number
  unit_price_ttc: number
  line_total_ht: number
  line_total_ttc: number
  line_total: number
  created_at: string
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
