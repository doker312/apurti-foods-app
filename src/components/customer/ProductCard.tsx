'use client'

import { useCartStore } from '@/lib/store/cartStore'
import { Product } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { Leaf, Zap, Plus, Minus, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

interface ProductCardProps {
  product: Product
  customPrice?: number
  showMargin?: boolean
}

export default function ProductCard({ product, customPrice, showMargin }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const removeItem = useCartStore((s) => s.removeItem)
  const items = useCartStore((s) => s.items)
  const [adding, setAdding] = useState(false)
  const [packing, setPacking] = useState<'500g'|'10Kg'|'30Kg'>('500g')

  const cartItem = items.find((i) => i.product.id === product.id && i.packing === packing)
  const qty = cartItem?.quantity ?? 0
  
  const originalPrice = packing === '500g' ? product.price_customer : (packing === '10Kg' ? (product.price_10kg || product.price_customer * 18) : (product.price_30kg || product.price_customer * 52))
  const price = customPrice ?? originalPrice
  const savings = customPrice ? originalPrice - customPrice : 0
  const marginPct = customPrice ? Math.round(((originalPrice - customPrice) / originalPrice) * 100) : 0
  const isLowStock = product.stock <= 5

  const handleAdd = async () => {
    setAdding(true)
    addItem(product, packing, customPrice)
    setTimeout(() => setAdding(false), 300)
  }

  return (
    <div className={`card group relative flex flex-col h-full transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 ${adding ? 'scale-95' : ''}`}>
      {/* Image */}
      <div className="product-img-container h-40 flex items-center justify-center p-3">
        <Image
          src={product.image_url || `https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80`}
          alt={product.name}
          width={120}
          height={120}
          className="object-contain h-full w-full drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
          unoptimized
        />
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className="badge badge-green text-[9px] px-1.5 py-0.5"><Leaf className="w-2.5 h-2.5" /> Organic</span>
          {isLowStock && (
            <span className="badge bg-red-100 text-red-700 text-[9px] px-1.5 py-0.5 animate-pulse-red">Only {product.stock} left!</span>
          )}
        </div>
        {showMargin && marginPct > 0 && (
          <div className="absolute top-2 right-2 bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-lg">
            {marginPct}% margin
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">{product.category}</p>
        <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{product.name}</h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-auto">{product.description}</p>

        <div className="mt-3 space-y-2">
          {/* Packing Selector */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {(['500g', '10Kg', '30Kg'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPacking(p)}
                className={`flex-1 text-[10px] font-bold py-1 rounded-md transition-all ${packing === p ? 'bg-white shadow-sm text-brand-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-base font-black text-gray-900">{formatCurrency(price)}</p>
              {savings > 0 && (
                <p className="text-[10px] text-gray-400 line-through">{formatCurrency(originalPrice)}</p>
              )}
            </div>

          {/* Add to Cart */}
          {qty === 0 ? (
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all active:scale-90 shadow-brand-sm"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-1 py-0.5">
              <button
                onClick={() => removeItem(product.id, packing)}
                className="w-6 h-6 rounded-lg bg-brand-700 text-white flex items-center justify-center hover:bg-brand-800 active:scale-90 transition-all"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-sm font-black text-brand-700 w-4 text-center">{qty}</span>
              <button
                onClick={() => addItem(product, packing, customPrice)}
                className="w-6 h-6 rounded-lg bg-brand-700 text-white flex items-center justify-center hover:bg-brand-800 active:scale-90 transition-all"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        </div>

        {savings > 0 && qty > 0 && (
          <p className="text-[10px] text-green-600 font-semibold mt-1.5">
            💰 You save {formatCurrency(savings * qty)} on this
          </p>
        )}
      </div>
    </div>
  )
}
