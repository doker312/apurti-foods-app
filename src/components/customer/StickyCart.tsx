'use client'

import Link from 'next/link'
import { useCartStore } from '@/lib/store/cartStore'
import { ShoppingCart, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useEffect, useState } from 'react'

export default function StickyCart() {
  const getTotalItems = useCartStore((s) => s.getTotalItems)
  const getTotalAmount = useCartStore((s) => s.getTotalAmount)
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const items = getTotalItems()
  const amount = getTotalAmount()

  useEffect(() => {
    setVisible(items > 0)
  }, [items])

  if (!mounted || !visible) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[min(calc(100vw-2rem),440px)] animate-slide-up">
      <Link href="/cart">
        <div className="bg-brand-700 hover:bg-brand-800 text-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-brand-lg transition-all duration-200 active:scale-95">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 bg-white text-brand-700 text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                {items}
              </span>
            </div>
            <div>
              <p className="font-black text-sm leading-none">{items} item{items !== 1 ? 's' : ''}</p>
              <p className="text-brand-200 text-xs">View your cart</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-lg">{formatCurrency(amount)}</span>
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </Link>
    </div>
  )
}
