'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

const DEMO_ACCOUNTS = [
  { role: 'Customer', email: 'customer@demo.apurti.com', password: 'demo123', description: 'Browse & order as a B2C customer', icon: '🛒', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { role: 'Distributor', email: 'distributor@demo.com', password: '123456', description: 'Bulk ordering with custom pricing', icon: '🏪', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { role: 'Delivery', email: 'delivery@demo.com', password: '123456', description: 'Manage & track deliveries', icon: '🚚', color: 'bg-green-50 border-green-200 text-green-700' },
  { role: 'Admin', email: 'admin@apurti.com', password: 'admin123', description: 'Full platform control', icon: '⚙️', color: 'bg-purple-50 border-purple-200 text-purple-700' },
]

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState<'customer' | 'business'>('customer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [demoLoading, setDemoLoading] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) setError(error.message)
    } catch {
      setError('Google sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); return }
      if (data.user) {
        const { data: profile } = await supabase.from('users').select('role').eq('id', data.user.id).single()
        const role = profile?.role
        if (role === 'admin') router.replace('/admin')
        else if (role === 'distributor') router.replace('/distributor')
        else if (role === 'delivery') router.replace('/delivery')
        else router.replace('/')
      }
    } catch {
      setError('Login failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (acc: typeof DEMO_ACCOUNTS[0]) => {
    setDemoLoading(acc.role)
    setError('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: acc.email,
        password: acc.password,
      })
      if (error) { setError(`Demo login failed: ${error.message}`); return }
      if (data.user) {
        const role = acc.role.toLowerCase()
        if (role === 'admin') router.replace('/admin')
        else if (role === 'distributor') router.replace('/distributor')
        else if (role === 'delivery') router.replace('/delivery')
        else router.replace('/')
      }
    } finally {
      setDemoLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950 flex">
      {/* Left Panel – Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-brand-700/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-12 w-80 h-80 rounded-full bg-brand-800/20 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <Image src="/logo.png" alt="Apurti Logo" width={64} height={64} className="rounded-2xl object-contain shadow-brand-lg" unoptimized />
            <span className="text-white text-2xl font-bold tracking-tight">Apurti Foods</span>
          </div>

          <h1 className="text-5xl font-black text-white leading-tight mb-6">
            Millets.<br />
            <span className="text-brand-400">Delivered.</span><br />
            In Minutes.
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed max-w-md">
            India's fastest millet-based food commerce platform. From farm-fresh flour to ready-to-eat snacks — now available for both retail and bulk.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-4">
          {[
            { label: '10 min', desc: 'Avg Delivery' },
            { label: '100%', desc: 'Organic' },
            { label: '₹1M+', desc: 'Monthly GMV' },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-2xl p-4 text-center">
              <p className="text-white text-2xl font-black">{s.label}</p>
              <p className="text-gray-400 text-xs mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel – Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <Image src="/logo.png" alt="Apurti Logo" width={48} height={48} className="rounded-xl object-contain" unoptimized />
            <span className="text-white text-xl font-bold">Apurti Foods</span>
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-gray-500 text-sm mb-6">Sign in to continue</p>

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              {(['customer', 'business'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {t === 'customer' ? '🛒 Customer' : '💼 Business'}
                </button>
              ))}
            </div>

            {tab === 'customer' ? (
              <div className="space-y-4">
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {loading ? 'Signing in...' : 'Continue with Google'}
                </button>
                <p className="text-center text-xs text-gray-400">Fast, secure sign-in with your Google account</p>
              </div>
            ) : (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input"
                    required
                  />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                    {error}
                  </div>
                )}
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            )}
          </div>

          {/* Demo Accounts */}
          <div className="mt-6">
            <p className="text-gray-400 text-xs text-center mb-3 font-medium uppercase tracking-wider">Try Demo Accounts</p>
            <div className="grid grid-cols-2 gap-3">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  onClick={() => handleDemoLogin(acc)}
                  disabled={demoLoading !== null}
                  className={`border rounded-xl p-3 text-left transition-all duration-200 hover:shadow-md disabled:opacity-60 ${acc.color}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{acc.icon}</span>
                    <span className="font-bold text-sm">{demoLoading === acc.role ? 'Loading...' : acc.role}</span>
                  </div>
                  <p className="text-xs opacity-80 leading-tight">{acc.description}</p>
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-gray-500 mt-3">First run? <a href="/api/seed" className="text-brand-700 font-semibold hover:underline">Seed demo data →</a></p>
          </div>
        </div>
      </div>
    </div>
  )
}
