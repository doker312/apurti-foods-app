'use client'

import { Order } from '@/lib/types'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { ArrowLeft, Package, Clock, CheckCircle, Truck } from 'lucide-react'
import Link from 'next/link'

const STATUS_STEPS = ['pending', 'accepted', 'picked', 'out_for_delivery', 'delivered']
const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  accepted: <CheckCircle className="w-4 h-4" />,
  picked: <Package className="w-4 h-4" />,
  out_for_delivery: <Truck className="w-4 h-4" />,
  delivered: <CheckCircle className="w-4 h-4" />,
}

export default function OrdersClient({ orders }: { orders: Order[] }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="btn-icon"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="font-black text-lg text-gray-900">My Orders</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">📦</p>
            <p className="font-bold text-gray-700">No orders yet</p>
            <p className="text-gray-400 text-sm mb-4">Start shopping to see your orders here</p>
            <Link href="/" className="btn-primary">Shop Now</Link>
          </div>
        ) : (
          orders.map((order) => {
            const stepIdx = STATUS_STEPS.indexOf(order.status)
            return (
              <div key={order.id} className="card p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-400">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                  </div>
                  <span className={`badge text-xs ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-1.5 mb-3">
                  {(order.order_items || []).map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 truncate flex-1 mr-2">
                        {item.products?.name} × {item.quantity}
                      </span>
                      <span className="font-semibold text-gray-900 flex-shrink-0">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Progress Bar */}
                {order.status !== 'cancelled' && (
                  <div className="mb-3">
                    <div className="flex gap-1">
                      {STATUS_STEPS.map((step, i) => (
                        <div
                          key={step}
                          className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                            i <= stepIdx ? 'bg-brand-700' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0 ${
                        order.status === 'delivered' ? 'bg-green-500' : 'bg-brand-700'
                      }`}>
                        {STATUS_ICONS[order.status]}
                      </span>
                      <span className="text-sm font-semibold text-gray-700">{getStatusLabel(order.status)}</span>
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                  <span className="text-xs text-gray-500">💵 Cash on Delivery</span>
                  <span className="font-black text-brand-700">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
