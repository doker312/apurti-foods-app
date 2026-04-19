'use client'

import { useState, useMemo } from 'react'
import { Product, UserProfile } from '@/lib/types'
import CustomerNav from './CustomerNav'
import ProductCard from './ProductCard'
import StickyCart from './StickyCart'
import { Zap, Shield, Leaf, ChevronRight, Star, Clock } from 'lucide-react'

const CATEGORIES = ['All', 'Snacks', 'Flour', 'Ready-to-eat', 'Grains', 'Beverages']

const HERO_BANNERS = [
  {
    bg: 'from-brand-700 to-brand-900',
    tag: '⚡ 10-Min Delivery',
    title: 'Farm-Fresh Millets',
    sub: 'Straight from organic farms to your doorstep',
    cta: 'Shop Now',
    pill: 'New Arrivals',
  },
  {
    bg: 'from-green-700 to-green-900',
    tag: '🌾 100% Organic',
    title: 'Sorghum & Ragi Deals',
    sub: 'Up to 30% off on select bulk orders',
    cta: 'Grab Deals',
    pill: 'Limited Time',
  },
]

interface Props {
  profile: UserProfile | null
  products: Product[]
}

export default function CustomerHomePage({ profile, products }: Props) {
  const [activeCategory, setActiveCategory] = useState('All')
  const [heroBanner, setHeroBanner] = useState(0)

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return products
    return products.filter((p) => p.category === activeCategory)
  }, [products, activeCategory])

  const banner = HERO_BANNERS[heroBanner]

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNav isDemoUser={profile?.is_demo_user} />

      {/* Hero Banner */}
      <div className={`bg-gradient-to-br ${banner.bg} text-white mx-3 mt-3 rounded-2xl p-5 relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white" />
          <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white" />
        </div>
        <div className="relative">
          <span className="badge bg-white/20 text-white text-[10px] mb-2">{banner.pill}</span>
          <p className="text-sm font-semibold opacity-90 mb-1">{banner.tag}</p>
          <h2 className="text-2xl font-black leading-tight mb-1">{banner.title}</h2>
          <p className="text-sm opacity-80 mb-4">{banner.sub}</p>
          <button className="bg-white text-brand-700 font-black text-sm px-5 py-2.5 rounded-xl hover:bg-gray-100 transition active:scale-95 shadow-md">
            {banner.cta} →
          </button>
        </div>
        {/* Banner dots */}
        <div className="absolute bottom-3 right-3 flex gap-1.5">
          {HERO_BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroBanner(i)}
              className={`w-2 h-2 rounded-full transition-colors ${i === heroBanner ? 'bg-white' : 'bg-white/40'}`}
            />
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-3 gap-2 mx-3 mt-3">
        {[
          { icon: <Zap className="w-4 h-4 text-brand-700" />, text: '10 Min', sub: 'Delivery' },
          { icon: <Leaf className="w-4 h-4 text-green-600" />, text: '100%', sub: 'Organic' },
          { icon: <Shield className="w-4 h-4 text-blue-600" />, text: 'FSSAI', sub: 'Certified' },
        ].map((b) => (
          <div key={b.text} className="card p-2.5 flex flex-col items-center text-center">
            {b.icon}
            <p className="text-sm font-black text-gray-900 mt-1">{b.text}</p>
            <p className="text-[10px] text-gray-500">{b.sub}</p>
          </div>
        ))}
      </div>

      {/* Category Filter */}
      <div className="px-3 mt-5">
        <h2 className="section-title mb-3">Shop by Category</h2>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-3 px-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-brand-700 text-white shadow-brand-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="px-3 mt-4 pb-32">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">
            {activeCategory === 'All' ? 'All Products' : activeCategory}
            <span className="text-brand-700"> ({filtered.length})</span>
          </h2>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" /> Fast Delivery
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🌾</p>
            <p className="text-gray-500 font-medium">No products in this category yet</p>
            <button onClick={() => setActiveCategory('All')} className="btn-ghost mt-2">Show All</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      <StickyCart />
    </div>
  )
}
