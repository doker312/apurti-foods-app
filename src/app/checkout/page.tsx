'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store/cartStore'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, MapPin, CheckCircle, Package } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/components/customer/BottomNav'

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
  const grandTotal = total + deliveryFee

  const handlePlaceOrder = async () => {
    if (!address || !name) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: order, error } = await supabase.from('orders').insert({
        user_id: user.id,
        user_role: 'customer',
        total_amount: grandTotal,
        status: 'pending',
        delivery_location_lat: 28.6139,
        delivery_location_lng: 77.2090,
      }).select().single()

      if (error || !order) throw error

      await supabase.from('order_items').insert(
        items.map((i) => ({
          order_id: order.id,
          product_id: i.product.id,
          packing: i.packing,
          quantity: i.quantity,
          price: i.custom_price ?? (i.packing === '500g' ? i.product.price_customer : (i.packing === '10Kg' ? (i.product.price_10kg || i.product.price_customer * 18) : (i.product.price_30kg || i.product.price_customer * 52))),
        }))
      )

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
      <div className="min-h-screen bg-[#FEF9F4] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mb-5 animate-bounce-soft">
          <CheckCircle className="w-14 h-14 text-green-600" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Order Placed! 🎉</h2>
        <p className="text-gray-500 text-sm mb-1">Your order is confirmed and being prepared</p>
        <p className="text-xs text-gray-400 mb-2">⚡ Expected delivery in 10–15 minutes</p>
        <p className="font-mono text-xs bg-gray-100 px-3 py-1.5 rounded-lg text-gray-500 mb-8">
          Order ID: #{orderId.slice(0, 8).toUpperCase()}
        </p>
        <div className="flex gap-3 flex-col w-full max-w-xs">
          <Link href="/orders" className="btn-primary text-center">Track My Order</Link>
          <Link href="/" className="btn-secondary text-center">Continue Shopping</Link>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FEF9F4]">
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/cart" className="btn-icon"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="font-black text-lg text-gray-900">Checkout</h1>
            <p className="text-xs text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''} · COD only</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 pb-36 space-y-4">
        {/* Delivery Address */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
              <MapPin className="w-4 h-4 text-[#BA181B]" />
            </div>
            <h3 className="font-black text-gray-900">Delivery Details</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Full Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="input" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Phone Number</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" className="input" type="tel" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Full Address *</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House no, Street, Area, City, Pincode"
                rows={3}
                className="input resize-none"
              />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-gray-500" />
            <h3 className="font-black text-gray-900 text-sm">Order Summary</h3>
          </div>
          {items.map(({ product, packing, quantity, custom_price }) => (
            <div key={`${product.id}-${packing}`} className="flex justify-between text-sm text-gray-600 mb-2">
              <span className="truncate flex-1 mr-2">{product.name} ({packing}) × {quantity}</span>
              <span className="font-semibold flex-shrink-0">{formatCurrency((custom_price ?? (packing === '500g' ? product.price_customer : (packing === '10Kg' ? (product.price_10kg || product.price_customer * 18) : (product.price_30kg || product.price_customer * 52)))) * quantity)}</span>
            </div>
          ))}
          <div className="h-px bg-gray-100 my-3" />
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>Delivery</span>
            <span className={`font-semibold ${deliveryFee === 0 ? 'text-green-600' : ''}`}>
              {deliveryFee === 0 ? 'FREE 🎉' : formatCurrency(deliveryFee)}
            </span>
          </div>
          <div className="flex justify-between font-black text-base mt-2">
            <span className="text-gray-900">Total</span>
            <span className="text-[#BA181B]">{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100 flex items-center gap-4">
          <span className="text-3xl">💵</span>
          <div>
            <p className="font-black text-gray-900">Cash on Delivery</p>
            <p className="text-xs text-gray-500 mt-0.5">Pay {formatCurrency(grandTotal)} when your order arrives</p>
          </div>
        </div>
      </div>

      {/* Place Order CTA */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 p-3 z-30">
        <div className="max-w-md mx-auto">
          <button
            onClick={handlePlaceOrder}
            disabled={loading || !address || !name}
            className="w-full bg-[#BA181B] hover:bg-[#991518] disabled:opacity-50 text-white font-black text-base rounded-xl py-4 transition-all active:scale-95 shadow-lg disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Placing Order...' : `Place Order — ${formatCurrency(grandTotal)}`}
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
