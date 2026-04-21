'use client'

import { useState, useMemo } from 'react'
import { Product, UserProfile } from '@/lib/types'
import CustomerNav from './CustomerNav'
import ProductCard from './ProductCard'
import StickyCart from './StickyCart'
import BottomNav from './BottomNav'
import { Zap, Shield, Leaf, Clock, ChevronRight, Star, Settings, Truck, Building2, User } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  { id: 'All', label: '🌾 All', color: '' },
  { id: 'Snacks', label: '🍿 Snacks', color: '' },
  { id: 'Flour', label: '🌾 Flour', color: '' },
  { id: 'Ready-to-eat', label: '🍱 Ready-to-eat', color: '' },
  { id: 'Grains', label: '🌱 Grains', color: '' },
  { id: 'Beverages', label: '🥛 Beverages', color: '' },
]

const HERO_BANNERS = [
  {
    bg: 'from-[#BA181B] to-[#7b0d0f]',
    pill: '⚡ 10-Min Delivery',
    title: 'Farm-Fresh Millets',
    sub: 'Straight from certified organic farms',
    cta: 'Shop Now',
    emoji: '🌾',
  },
  {
    bg: 'from-[#2D6A4F] to-[#1a3d2e]',
    pill: '🌿 100% Organic',
    title: 'Ragi & Jowar Deals',
    sub: 'Up to 30% off — limited time only',
    cta: 'Grab Deals',
    emoji: '🥗',
  },
  {
    bg: 'from-[#8B4513] to-[#5c2d0a]',
    pill: '💰 Best Value',
    title: 'Bulk Millet Packs',
    sub: 'Save more when you buy more',
    cta: 'Buy Bulk',
    emoji: '📦',
  },
]

interface Props {
  profile: UserProfile | null
  products: Product[]
}

export default function CustomerHomePage({ profile, products }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [activeCategory, setActiveCategory] = useState('All')
  const [heroBanner, setHeroBanner] = useState(0)
  const [loginLoading, setLoginLoading] = useState<string | null>(null)

  const handleQuickLogin = async (role: string, email: string, pass: string, path: string) => {
    setLoginLoading(role)
    const { data } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (data?.user) {
      router.push(path)
      router.refresh()
    }
    setLoginLoading(null)
  }

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return products
    return products.filter((p) => p.category === activeCategory)
  }, [products, activeCategory])

  const banner = HERO_BANNERS[heroBanner]

  return (
    <div className="min-h-screen bg-[#FEF9F4]">
      <CustomerNav isDemoUser={profile?.is_demo_user} />

      {/* Hero Banner */}
      <div className={`bg-gradient-to-br ${banner.bg} text-white mx-3 mt-3 rounded-2xl p-5 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 text-8xl opacity-10 select-none leading-none">{banner.emoji}</div>
        <div className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full bg-white/10" />
        <div className="relative">
          <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full mb-3">{banner.pill}</span>
          <h2 className="text-2xl font-black leading-tight mb-1">{banner.title}</h2>
          <p className="text-sm opacity-80 mb-4">{banner.sub}</p>
          <button className="bg-white text-[#BA181B] font-black text-sm px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-all active:scale-95 shadow-md">
            {banner.cta} →
          </button>
        </div>
        <div className="absolute bottom-3 right-4 flex gap-1.5">
          {HERO_BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroBanner(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === heroBanner ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`}
            />
          ))}
        </div>
      </div>

      {!profile && (
        <div className="mx-3 mt-4 bg-[#F5E6D3] border border-[#E6D5B8] rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-black text-[#8B5A2B] mb-3 text-center uppercase tracking-widest">Platform Access</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { role: 'Customer', icon: User, email: 'customer@apurti.com', pass: 'Customer2026!', path: '/' },
              { role: 'Distributor', icon: Building2, email: 'wholesale@apurti.com', pass: 'Distributor2026!', path: '/distributor' },
              { role: 'Delivery', icon: Truck, email: 'driver@apurti.com', pass: 'Delivery2026!', path: '/delivery' },
              { role: 'Admin', icon: Settings, email: 'admin@apurti.com', pass: 'ApurtiAdmin2026!', path: '/admin' },
            ].map(l => (
              <button 
                key={l.role}
                onClick={() => handleQuickLogin(l.role, l.email, l.pass, l.path)}
                disabled={loginLoading !== null}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/60 hover:bg-white active:scale-95 transition border border-[#E6D5B8] disabled:opacity-50"
              >
                <l.icon className="w-5 h-5 text-[#8B5A2B] mb-1" />
                <span className="text-xs font-bold text-[#8B5A2B]">{loginLoading === l.role ? '...' : l.role}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trust Badges */}
      <div className="grid grid-cols-3 gap-2 mx-3 mt-3">
        {[
          { icon: '⚡', text: '10 Min', sub: 'Delivery', color: 'bg-red-50 border-red-100' },
          { icon: '🌿', text: '100%', sub: 'Organic', color: 'bg-green-50 border-green-100' },
          { icon: '✅', text: 'FSSAI', sub: 'Certified', color: 'bg-blue-50 border-blue-100' },
        ].map((b) => (
          <div key={b.text} className={`${b.color} border rounded-xl p-2.5 flex flex-col items-center text-center`}>
            <span className="text-xl">{b.icon}</span>
            <p className="text-sm font-black text-gray-900 mt-1 leading-none">{b.text}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{b.sub}</p>
          </div>
        ))}
      </div>

      {/* Offers Strip */}
      <div className="mx-3 mt-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
        <span className="text-2xl">🎁</span>
        <div className="flex-1">
          <p className="text-sm font-black text-amber-800">FREE delivery above ₹299</p>
          <p className="text-xs text-amber-600">Today only — shop millet essentials</p>
        </div>
        <Link href="/orders" className="text-xs font-bold text-amber-700 flex-shrink-0">Orders →</Link>
      </div>

      {/* Category Filter */}
      <div className="px-3 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black text-gray-900">Shop by Category</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                activeCategory === cat.id
                  ? 'bg-[#BA181B] text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-red-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="px-3 mt-4 pb-36">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black text-gray-900">
            {activeCategory === 'All' ? 'All Products' : activeCategory}
            <span className="text-[#BA181B] font-black"> ({filtered.length})</span>
          </h2>
          <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
            <Clock className="w-3 h-3" /> 10 min
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">🌾</p>
            <p className="text-gray-500 font-semibold">No products in this category</p>
            <button onClick={() => setActiveCategory('All')} className="btn-ghost mt-3 text-sm">
              Show All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Footer note */}
        <div className="text-center mt-8 text-xs text-gray-400">
          <p>🌾 Sourced from certified organic millet farms across India</p>
          <p className="mt-1">FSSAI License No. 12719016000253</p>
        </div>
      </div>

      <StickyCart />
      <BottomNav />
    </div>
  )
}
