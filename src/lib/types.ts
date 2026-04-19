export type UserRole = 'customer' | 'distributor' | 'delivery' | 'admin'

export interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  is_demo_user: boolean
  created_at: string
}

export interface Product {
  id: string
  name: string
  description: string
  image_url: string
  price_customer: number
  stock: number
  category: string
  created_at?: string
}

export interface DistributorPricing {
  id: string
  distributor_id: string
  product_id: string
  custom_price: number
  custom_offer: number
  products?: Product
}

export type OrderStatus = 'pending' | 'accepted' | 'picked' | 'out_for_delivery' | 'delivered' | 'cancelled'

export interface Order {
  id: string
  user_id: string
  user_role: UserRole
  total_amount: number
  status: OrderStatus
  assigned_delivery_id?: string
  delivery_location_lat?: number
  delivery_location_lng?: number
  created_at: string
  order_items?: OrderItem[]
  users?: UserProfile
  delivery_partner?: UserProfile
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  products?: Product
}

export interface DeliveryTracking {
  id: string
  order_id: string
  delivery_id: string
  lat: number
  lng: number
  updated_at: string
}

export interface DistributorRequest {
  id: string
  name: string
  phone: string
  city: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface CartItem {
  product: Product
  quantity: number
  custom_price?: number
}
