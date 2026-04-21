'use client'

import { useCartStore } from '@/lib/store/cartStore'
import { formatCurrency } from '@/lib/utils'
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Zap, Tag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import BottomNav from '@/components/customer/BottomNav'

export default function CartPage() {
  const { items, addItem, removeItem, clearCart, getTotalAmount } = useCartStore()
  const total = getTotalAmount()
  const deliveryFee = total > 299 ? 0 : 29
  const grandTotal = total + deliveryFee
  const savings = items.reduce((s, i) => {
    const saved = i.custom_price ? (i.product.price_customer - i.custom_price) * i.quantity : 0
    return s + saved
  }, 0)

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FEF9F4] flex flex-col items-center justify-center gap-4 p-6">
        <div className="w-28 h-28 bg-red-50 rounded-full flex items-center justify-center">
          <ShoppingCart className="w-12 h-12 text-[#BA181B]" />
        </div>
        <h2 className="text-xl font-black text-gray-900">Your cart is empty</h2>
        <p className="text-gray-500 text-center text-sm">Add some healthy millet products to get started!</p>
        <Link href="/" className="btn-primary">Browse Products</Link>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FEF9F4]">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="btn-icon"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="font-black text-lg text-gray-900">My Cart</h1>
            <p className="text-xs text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''} · ⚡ 10–15 min delivery</p>
          </div>
          <button onClick={clearCart} className="text-xs text-red-500 font-semibold hover:underline">Clear</button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 pb-36 space-y-3">
        {/* Delivery Banner */}
        <div className={`rounded-xl px-4 py-3 flex items-center gap-3 ${deliveryFee === 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
          <Zap className={`w-5 h-5 flex-shrink-0 ${deliveryFee === 0 ? 'text-green-600' : 'text-amber-600'}`} />
          <p className={`text-sm font-semibold ${deliveryFee === 0 ? 'text-green-800' : 'text-amber-800'}`}>
            {deliveryFee === 0 ? '🎉 You unlocked FREE delivery!' : `Add ₹${299 - total} more for FREE delivery`}
          </p>
        </div>

        {/* Cart Items */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 divide-y divide-gray-50">
          {items.map(({ product, packing, quantity, custom_price }) => (
            <div key={`${product.id}-${packing}`} className="p-4 flex items-center gap-3">
              <div className="w-16 h-16 bg-[#FEF9F4] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                <Image
                  src={product.image_url || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100&q=80'}
                  alt={product.name}
                  width={56}
                  height={56}
                  className="object-contain w-full h-full"
                  unoptimized
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900 truncate">{product.name} ({packing})</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{product.category}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm font-black text-[#BA181B]">
                    {formatCurrency((custom_price ?? product.price_customer) * quantity)}
                  </p>
                  {custom_price && custom_price < product.price_customer && (
                    <p className="text-[10px] text-gray-400 line-through">{formatCurrency(product.price_customer * quantity)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => removeItem(product.id, packing)}
                  className="w-7 h-7 rounded-lg bg-red-50 border border-red-200 text-[#BA181B] flex items-center justify-center active:scale-90 transition-all"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-black text-gray-900 w-5 text-center">{quantity}</span>
                <button
                  onClick={() => addItem(product, packing, custom_price)}
                  className="w-7 h-7 rounded-lg bg-[#BA181B] text-white flex items-center justify-center active:scale-90 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Savings */}
        {savings > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-sm font-bold text-green-800">You're saving {formatCurrency(savings)} on this order! 🎉</p>
          </div>
        )}

        {/* Bill Details */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-900 mb-3 text-sm uppercase tracking-wide">Bill Details</h3>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Item total</span>
              <span className="font-semibold">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Delivery fee</span>
              {deliveryFee === 0
                ? <span className="text-green-600 font-bold">FREE</span>
                : <span className="font-semibold">{formatCurrency(deliveryFee)}</span>
              }
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between font-black text-base">
              <span className="text-gray-900">Grand Total</span>
              <span className="text-[#BA181B]">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* COD Notice */}
        <div className="bg-white border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">💵</span>
          <div>
            <p className="text-sm font-black text-gray-900">Cash on Delivery</p>
            <p className="text-xs text-gray-500">Pay {formatCurrency(grandTotal)} when order arrives</p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 p-3 z-30">
        <div className="max-w-md mx-auto">
          <Link href="/checkout">
            <button className="w-full bg-[#BA181B] hover:bg-[#991518] text-white font-black text-base rounded-xl py-4 flex items-center justify-between px-5 transition-all active:scale-95 shadow-lg">
              <span>Proceed to Checkout</span>
              <span>{formatCurrency(grandTotal)} →</span>
            </button>
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
