'use client'

import { useState } from 'react'
import { UserProfile, Product, DistributorPricing, Order } from '@/lib/types'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, calculateMargin } from '@/lib/utils'
import { useCartStore } from '@/lib/store/cartStore'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Package, TrendingUp, Truck, Plus, Minus, ShoppingBag, LogOut, ChevronRight } from 'lucide-react'
import Image from 'next/image'

interface Props {
  profile: UserProfile
  products: Product[]
  pricing: DistributorPricing[]
  recentOrders: Order[]
  stats: { totalOrders: number; totalRevenue: number; totalSavings: number }
}

const TABS = ['Overview', 'Catalog', 'Orders']

export default function DistributorDashboard({ profile, products, pricing, recentOrders, stats }: Props) {
  const [tab, setTab] = useState('Overview')
  const { items, addItem, removeItem, getTotalItems, getTotalAmount, clearCart } = useCartStore()
  const [placing, setPlacing] = useState(false)
  const [orderDone, setOrderDone] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const getPricing = (productId: string) => pricing.find((p) => p.product_id === productId)

  const handlePlaceOrder = async () => {
    if (items.length === 0) return
    setPlacing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const total = getTotalAmount()
      const { data: order } = await supabase.from('orders').insert({
        user_id: user.id,
        user_role: 'distributor',
        total_amount: total,
        status: 'pending',
      }).select().single()
      if (order) {
        await supabase.from('order_items').insert(
          items.map((i) => ({
            order_id: order.id,
            product_id: i.product.id,
            quantity: i.quantity,
            price: i.custom_price ?? i.product.price_customer,
          }))
        )
        clearCart()
        setOrderDone(true)
        setTimeout(() => { setOrderDone(false); setTab('Orders') }, 2500)
      }
    } finally {
      setPlacing(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const cartCount = getTotalItems()
  const cartTotal = getTotalAmount()

  return (
    <div className="min-h-screen bg-gray-50">
      {profile.is_demo_user && (
        <div className="demo-banner">
          🎭 Demo Distributor Account — Simulated pricing & orders
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-700 flex items-center justify-center text-white font-black">
              {profile.name?.[0] || 'D'}
            </div>
            <div>
              <p className="font-black text-gray-900">{profile.name}</p>
              <p className="text-xs text-gray-500">Distributor Account</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-icon text-gray-500">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
                  tab === t ? 'border-brand-700 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 pb-32">
        {/* Overview Tab */}
        {tab === 'Overview' && (
          <div className="space-y-5 animate-fade-in">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Orders', value: stats.totalOrders, icon: <Package className="w-4 h-4" />, color: 'text-brand-700 bg-brand-50' },
                { label: 'Revenue', value: formatCurrency(stats.totalRevenue), icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-700 bg-green-50' },
                { label: 'Saved', value: formatCurrency(stats.totalSavings), icon: <ShoppingBag className="w-4 h-4" />, color: 'text-blue-700 bg-blue-50' },
              ].map((s) => (
                <div key={s.label} className="card p-3 text-center">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2 ${s.color}`}>
                    {s.icon}
                  </div>
                  <p className="text-base font-black text-gray-900">{s.value}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Savings Banner */}
            <div className="rounded-2xl bg-gradient-to-br from-green-700 to-emerald-900 text-white p-5">
              <p className="text-sm font-semibold opacity-80 mb-1">💰 Your Exclusive Benefit</p>
              <p className="text-2xl font-black mb-1">{formatCurrency(stats.totalSavings)}</p>
              <p className="text-sm opacity-90">Total savings on custom distributor pricing</p>
              <div className="mt-3 bg-white/10 rounded-xl px-4 py-2 text-sm">
                Avg resale margin of <span className="font-black text-green-300">18–25%</span> across your catalog
              </div>
            </div>

            {/* Recent Orders */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="section-title">Recent Orders</h3>
                <button onClick={() => setTab('Orders')} className="text-brand-700 text-xs font-semibold flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-3">
                {recentOrders.slice(0, 3).map((o) => (
                  <div key={o.id} className="card p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">#{o.id.slice(0, 8)}</p>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(o.total_amount)}</p>
                      <p className="text-[10px] text-gray-400">{formatDate(o.created_at)}</p>
                    </div>
                    <span className={`badge ${getStatusColor(o.status)}`}>{getStatusLabel(o.status)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Catalog Tab */}
        {tab === 'Catalog' && (
          <div className="animate-fade-in space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <p className="text-sm font-bold text-blue-800">Your custom B2B pricing is active</p>
              <p className="text-xs text-blue-600">Prices shown include your exclusive distributor discounts</p>
            </div>
            {products.map((product) => {
              const priceInfo = getPricing(product.id)
              const customPrice = priceInfo?.custom_price ?? product.price_customer
              const margin = calculateMargin(customPrice, product.price_customer)
              const cartItem = items.find((i) => i.product.id === product.id)
              const qty = cartItem?.quantity ?? 0

              return (
                <div key={product.id} className="card p-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Image src={product.image_url || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100&q=80'} alt={product.name} width={52} height={52} className="object-contain" unoptimized />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">{product.name}</p>
                    <p className="text-[10px] text-gray-400">{product.category}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-base font-black text-brand-700">{formatCurrency(customPrice)}</p>
                      {customPrice < product.price_customer && (
                        <p className="text-xs text-gray-400 line-through">{formatCurrency(product.price_customer)}</p>
                      )}
                    </div>
                    {margin > 0 && (
                      <p className="text-[10px] text-green-600 font-bold">~{margin}% resale margin</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {qty === 0 ? (
                      <button onClick={() => addItem(product, customPrice)} className="flex items-center gap-1 bg-brand-700 text-white text-xs font-bold px-3 py-2 rounded-xl active:scale-90 transition-all">
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 border border-brand-200 rounded-xl px-2 py-1">
                        <button onClick={() => removeItem(product.id)} className="w-6 h-6 bg-brand-700 text-white rounded-lg flex items-center justify-center active:scale-90"><Minus className="w-3 h-3" /></button>
                        <span className="text-sm font-black text-brand-700 w-5 text-center">{qty}</span>
                        <button onClick={() => addItem(product, customPrice)} className="w-6 h-6 bg-brand-700 text-white rounded-lg flex items-center justify-center active:scale-90"><Plus className="w-3 h-3" /></button>
                      </div>
                    )}
                    <p className="text-[10px] text-gray-400">Stock: {product.stock}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Orders Tab */}
        {tab === 'Orders' && (
          <div className="animate-fade-in space-y-3">
            {recentOrders.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">📦</p>
                <p className="font-bold text-gray-700">No orders yet</p>
                <button onClick={() => setTab('Catalog')} className="btn-primary mt-4">Browse Catalog</button>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="card p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs text-gray-400">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                    </div>
                    <span className={`badge ${getStatusColor(order.status)}`}>{getStatusLabel(order.status)}</span>
                  </div>
                  {(order.order_items || []).map((item) => (
                    <div key={item.id} className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>{item.products?.name} × {item.quantity}</span>
                      <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between">
                    <span className="text-xs text-gray-500">💵 COD</span>
                    <span className="font-black text-brand-700">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Sticky Bulk Cart */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg p-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-gray-500">{cartCount} items in bulk order</p>
              <p className="font-black text-brand-700">{formatCurrency(cartTotal)}</p>
            </div>
            <button onClick={handlePlaceOrder} disabled={placing} className="btn-primary px-6">
              {placing ? 'Placing...' : orderDone ? '✅ Placed!' : 'Place Bulk Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
