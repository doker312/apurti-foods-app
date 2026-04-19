'use client'

import { UserProfile, Order } from '@/lib/types'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, ShoppingBag, LogOut, Mail, Phone, Shield } from 'lucide-react'
import Link from 'next/link'

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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="btn-icon"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="font-black text-lg text-gray-900">My Account</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5 space-y-4">
        {/* Profile Card */}
        <div className="card p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white text-2xl font-black shadow-brand-md">
              {profile?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">{profile?.name || 'User'}</h2>
              <p className="text-sm text-gray-500 capitalize">{profile?.role || 'customer'} Account</p>
              {profile?.is_demo_user && (
                <span className="badge bg-amber-100 text-amber-700 text-[10px] mt-1">🎭 Demo</span>
              )}
            </div>
          </div>
          <div className="space-y-3 border-t border-gray-100 pt-4">
            {profile?.email && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{profile.email}</span>
              </div>
            )}
            {profile?.phone && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{profile.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Shield className="w-4 h-4 text-gray-400" />
              <span>Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—'}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/orders" className="card p-4 flex flex-col items-center gap-2 hover:shadow-card-hover transition-all">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-brand-700" />
            </div>
            <p className="text-sm font-bold text-gray-900">My Orders</p>
            <p className="text-xs text-gray-400">{recentOrders.length} total</p>
          </Link>
          <button onClick={handleLogout} className="card p-4 flex flex-col items-center gap-2 hover:shadow-card-hover transition-all text-left">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-sm font-bold text-gray-900">Sign Out</p>
            <p className="text-xs text-gray-400">Log out safely</p>
          </button>
        </div>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Recent Orders</h3>
              <Link href="/orders" className="text-xs text-brand-700 font-semibold">View all →</Link>
            </div>
            <div className="space-y-3">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-mono text-gray-400">#{o.id.slice(0, 8)}</p>
                    <p className="text-xs text-gray-500">{formatDate(o.created_at)}</p>
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

        {/* Demo info */}
        {profile?.is_demo_user && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            <p className="font-bold mb-1">🎭 Demo Account</p>
            <p className="text-xs">This is a simulated demo account. All orders and data shown are for investor preview purposes.</p>
          </div>
        )}
      </div>
    </div>
  )
}
