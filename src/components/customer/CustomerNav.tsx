'use client'

import Link from 'next/link'
import { ShoppingCart, Bell, User, Search } from 'lucide-react'
import { useCartStore } from '@/lib/store/cartStore'
import { useEffect, useState } from 'react'

interface CustomerNavProps {
  isDemoUser?: boolean
}

export default function CustomerNav({ isDemoUser }: CustomerNavProps) {
  const getTotalItems = useCartStore((s) => s.getTotalItems)
  const [cartCount, setCartCount] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setCartCount(getTotalItems())
  }, [getTotalItems])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {isDemoUser && (
        <div className="demo-banner">
          🎭 Demo Mode — Simulated data for investor preview
        </div>
      )}
      <nav className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center text-white font-black text-sm">A</div>
            <div>
              <p className="font-black text-sm text-gray-900 leading-none">Apurti</p>
              <p className="text-[10px] text-gray-500 leading-none">Foods</p>
            </div>
          </Link>

          {/* Search */}
          <Link href="/?search=true" className="flex-1 flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5 hover:bg-gray-200 transition-colors">
            <Search className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 text-sm">Search millets, snacks…</span>
          </Link>

          {/* Cart */}
          <Link href="/cart" className="relative btn-icon">
            <ShoppingCart className="w-5 h-5 text-gray-700" />
            {cartCount > 0 && (
              <span className="cart-count">{cartCount > 9 ? '9+' : cartCount}</span>
            )}
          </Link>

          {/* Account */}
          <Link href="/account" className="btn-icon">
            <User className="w-5 h-5 text-gray-700" />
          </Link>
        </div>
      </nav>
    </>
  )
}
