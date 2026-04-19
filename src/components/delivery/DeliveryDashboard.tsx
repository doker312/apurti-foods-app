'use client'

import { useEffect, useState } from 'react'
import { Order, UserProfile } from '@/lib/types'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle, LogOut, Phone, Package, MapPin, Bell } from 'lucide-react'

interface Props {
  profile: UserProfile
  assignedOrders: Order[]
  completedOrders: Order[]
}

const NEXT_STATUS: Record<string, string> = {
  accepted: 'picked',
  picked: 'out_for_delivery',
  out_for_delivery: 'delivered',
}

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  accepted: { label: 'Mark as Picked Up', icon: '📦', color: 'bg-purple-600 hover:bg-purple-700' },
  picked: { label: 'Mark Out for Delivery', icon: '🚚', color: 'bg-orange-500 hover:bg-orange-600' },
  out_for_delivery: { label: 'Mark as Delivered ✅', icon: '🎉', color: 'bg-green-600 hover:bg-green-700' },
}

export default function DeliveryDashboard({ profile, assignedOrders: initialOrders, completedOrders: initialCompleted }: Props) {
  const [orders, setOrders] = useState(initialOrders)
  const [completed, setCompleted] = useState(initialCompleted)
  const [updating, setUpdating] = useState<string | null>(null)
  const [tab, setTab] = useState<'active' | 'completed'>('active')
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  // Realtime: Auto-receive newly assigned orders
  useEffect(() => {
    const channel = supabase
      .channel('delivery-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `assigned_delivery_id=eq.${profile.id}`,
        },
        async (payload) => {
          const newOrder = payload.new as Order
          // Fetch full order with items + user
          const { data } = await supabase
            .from('orders')
            .select('*, order_items(id, quantity, price, products(id, name, category)), users(id, name, phone)')
            .eq('id', newOrder.id)
            .single()

          if (!data) return
          if (data.status === 'delivered') {
            setOrders((prev) => prev.filter((o) => o.id !== data.id))
            setCompleted((prev) => [data, ...prev])
          } else if (['accepted', 'picked', 'out_for_delivery'].includes(data.status)) {
            setOrders((prev) => {
              const exists = prev.find((o) => o.id === data.id)
              if (exists) return prev.map((o) => o.id === data.id ? data : o)
              setNewOrderAlert(true)
              setTimeout(() => setNewOrderAlert(false), 4000)
              return [data, ...prev]
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile.id])

  const updateStatus = async (orderId: string, currentStatus: string) => {
    const nextStatus = NEXT_STATUS[currentStatus]
    if (!nextStatus) return
    setUpdating(orderId)
    try {
      const { error } = await supabase.from('orders').update({ status: nextStatus }).eq('id', orderId)
      if (error) { console.error('Update failed:', error); return }

      if (nextStatus === 'out_for_delivery' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          await supabase.from('delivery_tracking').insert({
            order_id: orderId,
            delivery_id: profile.id,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          })
        })
      }

      if (nextStatus === 'delivered') {
        const deliveredOrder = orders.find((o) => o.id === orderId)
        setOrders((prev) => prev.filter((o) => o.id !== orderId))
        if (deliveredOrder) setCompleted((prev) => [{ ...deliveredOrder, status: 'delivered' as const }, ...prev])
      } else {
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: nextStatus as Order['status'] } : o))
      }
    } finally {
      setUpdating(null)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const earnings = completed.length * 35

  return (
    <div className="min-h-screen bg-[#FEF9F4]">
      {profile.is_demo_user && (
        <div className="demo-banner">🎭 Demo Delivery Account — Raja Rider</div>
      )}

      {/* New Order Alert */}
      {newOrderAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#BA181B] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce-soft">
          <Bell className="w-4 h-4" />
          <span className="font-black text-sm">New order assigned!</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#BA181B] to-[#7b0d0f] flex items-center justify-center text-white font-black text-lg">
              {profile.name?.[0] || 'D'}
            </div>
            <div>
              <p className="font-black text-gray-900">{profile.name}</p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
                <p className="text-xs text-gray-500">Online · Delivery Partner</p>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" /> Out
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Active', value: orders.length, bg: 'bg-red-50 border-red-100', text: 'text-[#BA181B]' },
            { label: 'Delivered', value: completed.length, bg: 'bg-green-50 border-green-100', text: 'text-green-700' },
            { label: 'Earned', value: `₹${earnings}`, bg: 'bg-blue-50 border-blue-100', text: 'text-blue-700' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border rounded-2xl p-3.5 text-center`}>
              <p className={`text-xl font-black ${s.text}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-xl p-1 mb-4 shadow-sm border border-gray-100">
          {(['active', 'completed'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-black transition-all ${
                tab === t ? 'bg-[#BA181B] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'active' ? `🚚 Active (${orders.length})` : `✅ Done (${completed.length})`}
            </button>
          ))}
        </div>

        {/* Active Orders */}
        {tab === 'active' && (
          <div className="space-y-4 pb-8">
            {orders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <p className="text-5xl mb-3">🎉</p>
                <p className="font-black text-gray-700 text-lg">All clear!</p>
                <p className="text-gray-400 text-sm mt-1">Waiting for new assignments...</p>
                <p className="text-xs text-gray-300 mt-2">🟢 Realtime active</p>
              </div>
            ) : (
              orders.map((order) => {
                const cfg = STATUS_CONFIG[order.status]
                return (
                  <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className={`px-4 py-2.5 flex items-center justify-between ${
                      order.status === 'out_for_delivery' ? 'bg-orange-50' :
                      order.status === 'picked' ? 'bg-purple-50' : 'bg-blue-50'
                    }`}>
                      <p className="font-mono text-xs font-bold text-gray-500">#{order.id.slice(0, 8).toUpperCase()}</p>
                      <span className={`badge text-xs ${getStatusColor(order.status)}`}>{getStatusLabel(order.status)}</span>
                    </div>

                    <div className="p-4">
                      {order.users && (
                        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-[#BA181B] rounded-full flex items-center justify-center text-white font-black">
                              {(order.users as any).name?.[0] || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-black text-gray-900">{(order.users as any).name}</p>
                              {(order.users as any).phone && <p className="text-xs text-gray-500">{(order.users as any).phone}</p>}
                            </div>
                          </div>
                          {(order.users as any).phone && (
                            <a href={`tel:${(order.users as any).phone}`} className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                              <Phone className="w-4 h-4 text-green-600" />
                            </a>
                          )}
                        </div>
                      )}

                      <div className="space-y-1 mb-3">
                        {(order.order_items || []).map((item) => (
                          <div key={item.id} className="flex justify-between text-sm text-gray-600">
                            <span className="flex items-center gap-1.5">
                              <Package className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              {(item as any).products?.name} × {item.quantity}
                            </span>
                            <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <span className="font-black text-[#BA181B] text-lg">{formatCurrency(order.total_amount)}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {formatDate(order.created_at)}
                        </span>
                      </div>

                      {cfg && (
                        <button
                          onClick={() => updateStatus(order.id, order.status)}
                          disabled={updating === order.id}
                          className={`w-full text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 text-sm ${cfg.color}`}
                        >
                          {updating === order.id ? '⏳ Updating...' : <>{cfg.icon} {cfg.label}</>}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Completed Orders */}
        {tab === 'completed' && (
          <div className="space-y-3 pb-8">
            {completed.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <p className="text-5xl mb-3">📦</p>
                <p className="font-black text-gray-700">No deliveries yet</p>
              </div>
            ) : (
              completed.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">#{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-gray-900">{formatCurrency(order.total_amount)}</p>
                    <p className="text-xs text-green-600 font-semibold">+₹35 earned</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
