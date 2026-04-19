'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store/cartStore'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, MapPin, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function CheckoutPage() {
  const router = useRouter()
  const supabase = createClient()
  const { items, getTotalAmount, clearCart } = useCartStore()
  const [address, setAddress] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [orderId, setOrderId] = useState('')

  const total = getTotalAmount()
  const deliveryFee = total > 299 ? 0 : 29

  const handlePlaceOrder = async () => {
    if (!address || !name) return
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Create order
      const { data: order, error: orderError } = await supabase.from('orders').insert({
        user_id: user.id,
        user_role: 'customer',
        total_amount: total + deliveryFee,
        status: 'pending',
        delivery_location_lat: 28.6139,
        delivery_location_lng: 77.2090,
      }).select().single()

      if (orderError || !order) throw orderError

      // Create order items
      const orderItems = items.map((i) => ({
        order_id: order.id,
        product_id: i.product.id,
        quantity: i.quantity,
        price: i.custom_price ?? i.product.price_customer,
      }))
      await supabase.from('order_items').insert(orderItems)

      clearCart()
      setOrderId(order.id)
      setDone(true)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce-soft">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Order Placed! 🎉</h2>
        <p className="text-gray-500 mb-2 text-sm">Your order is being confirmed. </p>
        <p className="text-xs text-gray-400 mb-6 font-mono">#{orderId.slice(0, 8)}</p>
        <div className="flex gap-3">
          <Link href="/orders" className="btn-primary">Track Order</Link>
          <Link href="/" className="btn-secondary">Continue Shopping</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/cart" className="btn-icon"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="font-black text-lg text-gray-900">Checkout</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 pb-32 space-y-4">
        {/* Delivery Address */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-brand-700" />
            <h3 className="font-bold text-gray-900">Delivery Details</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="input" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile number" className="input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Delivery Address *</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House no, Street, Area, City, Pincode"
                rows={3}
                className="input resize-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="card p-4">
          <h3 className="font-bold text-gray-900 mb-3">Order Summary</h3>
          {items.map(({ product, quantity, custom_price }) => (
            <div key={product.id} className="flex justify-between text-sm text-gray-600 mb-2">
              <span className="truncate flex-1 mr-2">{product.name} × {quantity}</span>
              <span className="font-semibold flex-shrink-0">{formatCurrency((custom_price ?? product.price_customer) * quantity)}</span>
            </div>
          ))}
          <div className="h-px bg-gray-100 my-3" />
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Delivery</span>
            <span className="font-semibold text-green-600">{deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}</span>
          </div>
          <div className="flex justify-between font-black text-gray-900">
            <span>Total</span>
            <span className="text-brand-700">{formatCurrency(total + deliveryFee)}</span>
          </div>
        </div>

        {/* COD */}
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">💵</div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Cash on Delivery</p>
            <p className="text-xs text-gray-500">Pay {formatCurrency(total + deliveryFee)} when your order arrives</p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={handlePlaceOrder}
            disabled={loading || !address || !name}
            className="btn-primary w-full text-base py-4 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Placing Order...' : `Place Order — ${formatCurrency(total + deliveryFee)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
