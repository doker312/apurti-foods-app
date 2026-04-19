'use client'

import { useState } from 'react'
import { Order, UserProfile } from '@/lib/types'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Package, CheckCircle, Truck, LogOut, MapPin, Phone, Navigation } from 'lucide-react'

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

const STATUS_ACTIONS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  accepted: { label: 'Mark as Picked Up', icon: <Package className="w-4 h-4" />, color: 'bg-purple-600 hover:bg-purple-700' },
  picked: { label: 'Mark Out for Delivery', icon: <Truck className="w-4 h-4" />, color: 'bg-orange-500 hover:bg-orange-600' },
  out_for_delivery: { label: 'Mark as Delivered', icon: <CheckCircle className="w-4 h-4" />, color: 'bg-green-600 hover:bg-green-700' },
}

export default function DeliveryDashboard({ profile, assignedOrders: initialOrders, completedOrders }: Props) {
  const [orders, setOrders] = useState(initialOrders)
  const [updating, setUpdating] = useState<string | null>(null)
  const [tab, setTab] = useState<'active' | 'completed'>('active')
  const supabase = createClient()
  const router = useRouter()

  const updateStatus = async (orderId: string, currentStatus: string) => {
    const nextStatus = NEXT_STATUS[currentStatus]
    if (!nextStatus) return
    setUpdating(orderId)
    try {
      await supabase.from('orders').update({ status: nextStatus }).eq('id', orderId)
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
        setOrders((prev) => prev.filter((o) => o.id !== orderId))
      } else {
        setOrders((prev) =>
          prev.map((o) => o.id === orderId ? { ...o, status: nextStatus as Order['status'] } : o)
        )
      }
    } finally {
      setUpdating(null)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {profile.is_demo_user && (
        <div className="demo-banner">🎭 Demo Delivery Account</div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-700 flex items-center justify-center text-white font-black">
              {profile.name?.[0] || 'D'}
            </div>
            <div>
              <p className="font-black text-gray-900">{profile.name}</p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                <p className="text-xs text-gray-500">Online · Delivery Partner</p>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-icon text-gray-500">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Active', value: orders.length, color: 'text-brand-700 bg-brand-50' },
            { label: 'Delivered', value: completedOrders.length, color: 'text-green-700 bg-green-50' },
            { label: 'Earnings', value: formatCurrency(completedOrders.length * 35), color: 'text-blue-700 bg-blue-50' },
          ].map((s) => (
            <div key={s.label} className="card p-3 text-center">
              <p className={`text-xl font-black ${s.color.split(' ')[0]}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
          {(['active', 'completed'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            >
              {t === 'active' ? `🚚 Active (${orders.length})` : `✅ Completed (${completedOrders.length})`}
            </button>
          ))}
        </div>

        {/* Active Orders */}
        {tab === 'active' && (
          <div className="space-y-4 animate-fade-in">
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-5xl mb-3">🎉</p>
                <p className="font-bold text-gray-700">All clear!</p>
                <p className="text-gray-400 text-sm">No active deliveries. Waiting for new assignments.</p>
              </div>
            ) : (
              orders.map((order) => {
                const action = STATUS_ACTIONS[order.status]
                return (
                  <div key={order.id} className="card p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-black text-gray-900">#{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                      </div>
                      <span className={`badge ${getStatusColor(order.status)}`}>{getStatusLabel(order.status)}</span>
                    </div>

                    {/* Customer */}
                    {order.users && (
                      <div className="bg-gray-50 rounded-xl p-3 mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-sm">
                            {order.users.name?.[0] || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{order.users.name}</p>
                            {order.users.phone && (
                              <p className="text-xs text-gray-500">{order.users.phone}</p>
                            )}
                          </div>
                        </div>
                        {order.users.phone && (
                          <a href={`tel:${order.users.phone}`} className="btn-icon">
                            <Phone className="w-4 h-4 text-brand-700" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Items */}
                    <div className="space-y-1 mb-3">
                      {(order.order_items || []).map((item) => (
                        <p key={item.id} className="text-sm text-gray-600">
                          {item.products?.name} × {item.quantity}
                        </p>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <span className="font-black text-brand-700">{formatCurrency(order.total_amount)}</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> View on Map
                      </span>
                    </div>

                    {/* Action button */}
                    {action && (
                      <button
                        onClick={() => updateStatus(order.id, order.status)}
                        disabled={updating === order.id}
                        className={`w-full text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 ${action.color}`}
                      >
                        {updating === order.id ? (
                          <span>Updating...</span>
                        ) : (
                          <>{action.icon} {action.label}</>
                        )}
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Completed Orders */}
        {tab === 'completed' && (
          <div className="space-y-3 animate-fade-in">
            {completedOrders.map((order) => (
              <div key={order.id} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">#{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                </div>
                <div className="text-right">
                  <span className="badge badge-green">Delivered</span>
                  <p className="text-sm font-black text-gray-900 mt-1">{formatCurrency(order.total_amount)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
