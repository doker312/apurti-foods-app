'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingBag, User } from 'lucide-react'
import { useCartStore } from '@/lib/store/cartStore'
import { useEffect, useState } from 'react'

const NAV = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/account', label: 'Account', icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()
  const getTotalItems = useCartStore((s) => s.getTotalItems)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    setCartCount(getTotalItems())
  })

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-lg safe-area-pb">
      <div className="max-w-md mx-auto flex">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`nav-item flex-1 ${active ? 'active' : ''}`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${active ? 'text-brand-700' : 'text-gray-400'}`} />
                {href === '/orders' && cartCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-brand-700 text-white text-[9px] font-black rounded-full w-3.5 h-3.5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold ${active ? 'text-brand-700' : 'text-gray-400'}`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
