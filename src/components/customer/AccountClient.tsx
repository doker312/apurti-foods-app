'use client'

import { UserProfile, Order } from '@/lib/types'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShoppingBag, LogOut, Mail, Shield, ChevronRight, Package } from 'lucide-react'
import Link from 'next/link'
import BottomNav from './BottomNav'

interface Props {
  profile: UserProfile | null
  recentOrders: Pick<Order, 'id' | 'total_amount' | 'status' | 'created_at'>[]
}

export default function AccountClient({ profile, recentOrders }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#FEF9F4]">
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="btn-icon"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="font-black text-lg text-gray-900">My Account</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5 pb-24 space-y-4">
        {/* Demo Banner */}
        {profile?.is_demo_user && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-sm font-bold text-amber-800">🎭 Demo Account</p>
            <p className="text-xs text-amber-700">Simulated data for investor preview</p>
          </div>
        )}

        {/* Profile Hero Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-br from-[#BA181B] to-[#7b0d0f] px-5 pt-6 pb-10">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-3xl font-black shadow-lg mb-3">
              {profile?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <h2 className="text-xl font-black text-white">{profile?.name || 'User'}</h2>
            <p className="text-sm text-white/70 capitalize">{profile?.role || 'customer'}</p>
          </div>
          <div className="px-5 py-4 -mt-4 bg-white rounded-t-2xl space-y-3">
            {profile?.email && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="truncate">{profile.email}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Shield className="w-4 h-4 text-gray-400" />
              <span>Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          <Link href="/orders" className="flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-5 h-5 text-[#BA181B]" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-sm">My Orders</p>
              <p className="text-xs text-gray-400">{recentOrders.length} orders total</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-4 hover:bg-red-50 transition-colors text-left">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-red-600 text-sm">Sign Out</p>
              <p className="text-xs text-gray-400">Log out from Apurti Foods</p>
            </div>
          </button>
        </div>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-gray-900 text-sm">Recent Orders</h3>
              <Link href="/orders" className="text-xs text-[#BA181B] font-bold">View all →</Link>
            </div>
            <div className="space-y-3">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs font-mono text-gray-500">#{o.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-[10px] text-gray-400">{formatDate(o.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`badge text-[10px] ${getStatusColor(o.status)}`}>{getStatusLabel(o.status)}</span>
                    <p className="text-sm font-black text-gray-900 mt-0.5">{formatCurrency(o.total_amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* App Info */}
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-2xl bg-[#BA181B] flex items-center justify-center text-white font-black text-xl mx-auto mb-2">A</div>
          <p className="text-sm font-bold text-gray-700">Apurti Foods</p>
          <p className="text-xs text-gray-400">Healthy millets, delivered fast</p>
          <p className="text-[10px] text-gray-300 mt-1">v1.0.0 · FSSAI Certified</p>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
