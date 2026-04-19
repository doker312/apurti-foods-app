'use client'

import { Order } from '@/lib/types'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { ArrowLeft, Package, Clock, CheckCircle, Truck, MapPin } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/components/customer/BottomNav'

const STATUS_STEPS = ['pending', 'accepted', 'picked', 'out_for_delivery', 'delivered']
const STEP_ICON: Record<string, string> = {
  pending: '🕐',
  accepted: '✅',
  picked: '📦',
  out_for_delivery: '🚚',
  delivered: '🎉',
}

export default function OrdersClient({ orders }: { orders: Order[] }) {
  return (
    <div className="min-h-screen bg-[#FEF9F4]">
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="btn-icon"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="font-black text-lg text-gray-900">My Orders</h1>
            <p className="text-xs text-gray-500">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 pb-24 space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-3">📦</p>
            <p className="font-black text-gray-800 text-lg">No orders yet</p>
            <p className="text-gray-400 text-sm mb-6">Start shopping to see your orders here</p>
            <Link href="/" className="btn-primary">Start Shopping</Link>
          </div>
        ) : (
          orders.map((order) => {
            const stepIdx = STATUS_STEPS.indexOf(order.status)
            const isActive = ['pending', 'accepted', 'picked', 'out_for_delivery'].includes(order.status)
            return (
              <div key={order.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isActive ? 'border-red-100' : 'border-gray-100'}`}>
                {/* Order Header */}
                <div className={`px-4 py-3 flex items-center justify-between ${isActive ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <div>
                    <p className="font-mono text-xs font-bold text-gray-500">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-[10px] text-gray-400">{formatDate(order.created_at)}</p>
                  </div>
                  <span className={`badge text-xs font-bold ${getStatusColor(order.status)}`}>
                    {STEP_ICON[order.status]} {getStatusLabel(order.status)}
                  </span>
                </div>

                <div className="p-4">
                  {/* Items */}
                  <div className="space-y-1.5 mb-3">
                    {(order.order_items || []).slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600 truncate flex-1 mr-2">{item.products?.name} × {item.quantity}</span>
                        <span className="font-semibold text-gray-900 flex-shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    {(order.order_items || []).length > 3 && (
                      <p className="text-xs text-gray-400">+{(order.order_items || []).length - 3} more items</p>
                    )}
                  </div>

                  {/* Progress */}
                  {order.status !== 'cancelled' && (
                    <div className="mb-3">
                      <div className="flex gap-1 mb-2">
                        {STATUS_STEPS.map((step, i) => (
                          <div
                            key={step}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              i <= stepIdx ? 'bg-[#BA181B]' : 'bg-gray-100'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 font-medium">
                        {order.status === 'delivered' ? '✅ Delivered successfully' :
                         order.status === 'out_for_delivery' ? '🚚 On the way to you' :
                         order.status === 'picked' ? '📦 Picked up by delivery partner' :
                         order.status === 'accepted' ? '✅ Order accepted, preparing' :
                         '🕐 Waiting for confirmation'}
                      </p>
                    </div>
                  )}

                  {/* Total */}
                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <span>💵</span> Cash on Delivery
                    </span>
                    <span className="font-black text-[#BA181B] text-base">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
      <BottomNav />
    </div>
  )
}
