'use client'

import { useState } from 'react'
import { UserProfile, Product, DistributorPricing, Order } from '@/lib/types'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, calculateMargin } from '@/lib/utils'
import { useCartStore } from '@/lib/store/cartStore'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Package, TrendingUp, ShoppingBag, LogOut, ChevronRight, Plus, Minus, CheckCircle, Tag } from 'lucide-react'
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
      const { data: order } = await supabase.from('orders').insert({
        user_id: user.id,
        user_role: 'distributor',
        total_amount: getTotalAmount(),
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
        setTimeout(() => { setOrderDone(false); setTab('Orders') }, 2000)
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
  const totalSavingsOnCart = items.reduce((s, i) => {
    const retail = i.product.price_customer
    const custom = i.custom_price ?? retail
    return s + (retail - custom) * i.quantity
  }, 0)

  return (
    <div className="min-h-screen bg-[#FEF9F4]">
      {profile.is_demo_user && (
        <div className="demo-banner">🎭 Demo Distributor — Ram Distributors (Simulated B2B pricing)</div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#BA181B] to-[#7b0d0f] flex items-center justify-center text-white font-black text-lg shadow-md">
              {profile.name?.[0] || 'D'}
            </div>
            <div>
              <p className="font-black text-gray-900 leading-none">{profile.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">Distributor · B2B Account</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        {/* Tab Nav */}
        <div className="max-w-2xl mx-auto px-4 flex gap-0 border-t border-gray-100">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${
                tab === t ? 'border-[#BA181B] text-[#BA181B]' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 pb-32">

        {/* ── OVERVIEW ── */}
        {tab === 'Overview' && (
          <div className="space-y-4 animate-fade-in">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Orders', value: stats.totalOrders, icon: '📦', bg: 'bg-red-50 border-red-100' },
                { label: 'Revenue', value: formatCurrency(stats.totalRevenue), icon: '💰', bg: 'bg-green-50 border-green-100' },
                { label: 'Saved', value: formatCurrency(stats.totalSavings), icon: '🏷️', bg: 'bg-blue-50 border-blue-100' },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} border rounded-2xl p-3.5 text-center`}>
                  <span className="text-2xl">{s.icon}</span>
                  <p className="text-sm font-black text-gray-900 mt-1">{s.value}</p>
                  <p className="text-[10px] text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Savings Card */}
            <div className="bg-gradient-to-br from-[#2D6A4F] to-[#1a3d2e] text-white rounded-2xl p-5">
              <p className="text-xs font-semibold opacity-75 mb-1">💰 Your Exclusive B2B Benefit</p>
              <p className="text-3xl font-black mb-1">{formatCurrency(stats.totalSavings)}</p>
              <p className="text-sm opacity-90 mb-3">Total savings vs. retail pricing</p>
              <div className="bg-white/15 rounded-xl px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm opacity-90">Avg resale margin</span>
                <span className="text-lg font-black text-green-300">18–25%</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTab('Catalog')}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center gap-2 hover:shadow-md transition-all"
              >
                <span className="text-2xl">🛒</span>
                <p className="font-black text-sm text-gray-900">Browse Catalog</p>
                <p className="text-xs text-gray-400">{products.length} products at B2B price</p>
              </button>
              <button
                onClick={() => setTab('Orders')}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center gap-2 hover:shadow-md transition-all"
              >
                <span className="text-2xl">📋</span>
                <p className="font-black text-sm text-gray-900">View Orders</p>
                <p className="text-xs text-gray-400">{recentOrders.length} total orders</p>
              </button>
            </div>

            {/* Recent Orders */}
            {recentOrders.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-gray-900">Recent Orders</h3>
                  <button onClick={() => setTab('Orders')} className="text-xs text-[#BA181B] font-bold flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></button>
                </div>
                <div className="space-y-3">
                  {recentOrders.slice(0, 3).map((o) => (
                    <div key={o.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="font-mono text-xs text-gray-400">#{o.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-sm font-black text-gray-900">{formatCurrency(o.total_amount)}</p>
                      </div>
                      <span className={`badge text-xs ${getStatusColor(o.status)}`}>{getStatusLabel(o.status)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CATALOG ── */}
        {tab === 'Catalog' && (
          <div className="space-y-3 animate-fade-in">
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <p className="text-sm font-black text-blue-800">🏷️ Your exclusive B2B pricing is active</p>
              <p className="text-xs text-blue-600 mt-0.5">All prices shown include your distributor discount</p>
            </div>

            {products.map((product) => {
              const priceInfo = getPricing(product.id)
              const customPrice = priceInfo?.custom_price ?? product.price_customer
              const margin = calculateMargin(customPrice, product.price_customer)
              const cartItem = items.find((i) => i.product.id === product.id)
              const qty = cartItem?.quantity ?? 0
              const saved = product.price_customer - customPrice

              return (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                  <div className="w-16 h-16 bg-[#FEF9F4] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <Image src={product.image_url || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100&q=80'} alt={product.name} width={56} height={56} className="object-contain" unoptimized />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-gray-900 truncate">{product.name}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{product.category}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-base font-black text-[#BA181B]">{formatCurrency(customPrice)}</p>
                      {saved > 0 && <p className="text-xs text-gray-400 line-through">{formatCurrency(product.price_customer)}</p>}
                    </div>
                    <div className="flex gap-2 mt-1">
                      {saved > 0 && <span className="text-[9px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full">Save ₹{saved}/unit</span>}
                      {margin > 0 && <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full">~{margin}% margin</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {qty === 0 ? (
                      <button onClick={() => addItem(product, customPrice)} className="flex items-center gap-1 bg-[#BA181B] text-white text-xs font-bold px-3 py-2 rounded-xl active:scale-90 transition-all shadow-md">
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 border border-red-200 bg-red-50 rounded-xl px-2 py-1">
                        <button onClick={() => removeItem(product.id)} className="w-6 h-6 bg-[#BA181B] text-white rounded-lg flex items-center justify-center active:scale-90"><Minus className="w-3 h-3" /></button>
                        <span className="text-sm font-black text-[#BA181B] w-5 text-center">{qty}</span>
                        <button onClick={() => addItem(product, customPrice)} className="w-6 h-6 bg-[#BA181B] text-white rounded-lg flex items-center justify-center active:scale-90"><Plus className="w-3 h-3" /></button>
                      </div>
                    )}
                    <p className="text-[9px] text-gray-400">Stock: {product.stock}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── ORDERS ── */}
        {tab === 'Orders' && (
          <div className="space-y-3 animate-fade-in">
            {recentOrders.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-3">📋</p>
                <p className="font-black text-gray-700 text-lg">No orders yet</p>
                <button onClick={() => setTab('Catalog')} className="btn-primary mt-4">Browse Catalog</button>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="font-mono text-xs font-bold text-gray-400">#{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-[10px] text-gray-400">{formatDate(order.created_at)}</p>
                    </div>
                    <span className={`badge ${getStatusColor(order.status)}`}>{getStatusLabel(order.status)}</span>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    {(order.order_items || []).map((item) => (
                      <div key={item.id} className="flex justify-between text-sm text-gray-600">
                        <span>{item.products?.name} × {item.quantity}</span>
                        <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                    <span className="text-xs text-gray-400">💵 Cash on Delivery</span>
                    <span className="font-black text-[#BA181B] text-base">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Bulk Order Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-xl p-4 z-40">
          <div className="max-w-2xl mx-auto">
            {totalSavingsOnCart > 0 && (
              <p className="text-xs text-green-600 font-bold text-center mb-2">
                🏷️ You save {formatCurrency(totalSavingsOnCart)} on this bulk order
              </p>
            )}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-medium">{cartCount} items in bulk order</p>
                <p className="font-black text-[#BA181B] text-lg leading-none">{formatCurrency(cartTotal)}</p>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="bg-[#BA181B] hover:bg-[#991518] text-white font-black px-6 py-3.5 rounded-xl transition-all active:scale-95 shadow-lg disabled:opacity-60 flex items-center gap-2"
              >
                {placing ? '⏳ Placing...' : orderDone ? <><CheckCircle className="w-4 h-4" /> Placed!</> : '🚀 Place Bulk Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
