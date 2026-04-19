'use client'

import { useCartStore } from '@/lib/store/cartStore'
import { formatCurrency } from '@/lib/utils'
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, MapPin, Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function CartPage() {
  const { items, addItem, removeItem, updateQuantity, clearCart, getTotalAmount } = useCartStore()
  const router = useRouter()
  const total = getTotalAmount()
  const deliveryFee = total > 299 ? 0 : 29
  const grandTotal = total + deliveryFee

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-6">
        <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center">
          <ShoppingCart className="w-10 h-10 text-brand-700" />
        </div>
        <h2 className="text-xl font-black text-gray-900">Your cart is empty</h2>
        <p className="text-gray-500 text-center">Add some healthy millet products to get started!</p>
        <Link href="/" className="btn-primary">Browse Products</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="btn-icon"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="font-black text-lg text-gray-900">My Cart</h1>
          <span className="text-gray-400 text-sm">({items.length} items)</span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 pb-32">
        {/* Delivery Banner */}
        <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-700 rounded-full flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-brand-800">Fast Delivery Available</p>
            {deliveryFee === 0 ? (
              <p className="text-xs text-brand-600">🎉 You're eligible for FREE delivery!</p>
            ) : (
              <p className="text-xs text-brand-600">Add ₹{299 - total} more for FREE delivery</p>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="space-y-3 mb-4">
          {items.map(({ product, quantity, custom_price }) => (
            <div key={product.id} className="card p-4 flex items-center gap-3">
              <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Image
                  src={product.image_url || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100&q=80'}
                  alt={product.name}
                  width={56}
                  height={56}
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900 truncate">{product.name}</p>
                <p className="text-xs text-gray-500">{product.category}</p>
                <p className="text-sm font-black text-brand-700 mt-1">
                  {formatCurrency((custom_price ?? product.price_customer) * quantity)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => removeItem(product.id)}
                  className="w-7 h-7 rounded-lg bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center hover:bg-brand-100 active:scale-90 transition-all"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-black text-gray-900 w-4 text-center">{quantity}</span>
                <button
                  onClick={() => addItem(product, custom_price)}
                  className="w-7 h-7 rounded-lg bg-brand-700 text-white flex items-center justify-center hover:bg-brand-800 active:scale-90 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bill Details */}
        <div className="card p-4 mb-4">
          <h3 className="font-bold text-gray-900 mb-3">Bill Details</h3>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Item total</span>
              <span className="font-semibold">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Delivery fee</span>
              {deliveryFee === 0 ? (
                <span className="text-green-600 font-bold">FREE</span>
              ) : (
                <span className="font-semibold">{formatCurrency(deliveryFee)}</span>
              )}
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between font-black text-base text-gray-900">
              <span>Grand Total</span>
              <span className="text-brand-700">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* COD Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
          <span className="text-lg">💵</span>
          <div>
            <p className="text-sm font-bold text-amber-800">Cash on Delivery</p>
            <p className="text-xs text-amber-700">Pay when your order arrives at your door</p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-md mx-auto">
          <Link href="/checkout">
            <button className="btn-primary w-full text-base flex items-center justify-between px-5 py-4">
              <span>Proceed to Checkout</span>
              <span className="font-black">{formatCurrency(grandTotal)} →</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
