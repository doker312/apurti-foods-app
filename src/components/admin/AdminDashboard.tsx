'use client'

import { useState, useEffect } from 'react'
import { Order, UserProfile, Product } from '@/lib/types'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingBag, Users, Truck,
  LogOut, Settings, TrendingUp, Plus, Trash2,
  Edit3, Check, X, Search, RefreshCw
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'

interface Props {
  adminProfile: UserProfile
  orders: Order[]
  users: UserProfile[]
  products: Product[]
  deliveryPartners: UserProfile[]
  stats: { totalOrders: number; revenue: number; activeUsers: number; activeDeliveries: number }
}

type AdminTab = 'dashboard' | 'orders' | 'products' | 'users' | 'pricing'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'pricing', label: 'Pricing', icon: Settings },
]

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  accepted: '#3B82F6',
  picked: '#8B5CF6',
  out_for_delivery: '#F97316',
  delivered: '#10B981',
  cancelled: '#EF4444',
}

export default function AdminDashboard({ adminProfile, orders: initialOrders, users, products: initialProducts, deliveryPartners, stats }: Props) {
  const [tab, setTab] = useState<AdminTab>('dashboard')
  const [liveOrders, setLiveOrders] = useState(initialOrders)
  const [liveProducts, setLiveProducts] = useState(initialProducts)
  const [orderFilter, setOrderFilter] = useState<string>('all')
  const [assigningOrder, setAssigningOrder] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [editProduct, setEditProduct] = useState<Partial<Product> | null>(null)
  const [productLoading, setProductLoading] = useState(false)
  const [newOrderCount, setNewOrderCount] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const supabase = createClient()
  const router = useRouter()

  // Function to fetch all fresh orders
  const fetchOrders = async (silent = true) => {
    if (!silent) setRefreshing(true)
    const { data } = await supabase
      .from('orders')
      .select('*, users(id, name, email, role, phone), order_items(id, quantity, price, products(id, name, category))')
      .order('created_at', { ascending: false })
    if (data) {
      setLiveOrders(data)
      setLastUpdated(new Date())
    }
    if (!silent) setRefreshing(false)
  }

  // Realtime + polling hybrid (polling is the reliable fallback)
  useEffect(() => {
    // Fetch immediately on mount
    fetchOrders()

    // Poll every 7 seconds — guarantees admin always sees new orders
    const interval = setInterval(() => fetchOrders(), 7000)

    // Realtime as an optimistic layer on top
    const channel = supabase
      .channel(`admin-realtime-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          // Try follow-up query first
          const { data } = await supabase
            .from('orders')
            .select('*, users(id, name, email, role, phone), order_items(id, quantity, price, products(id, name, category))')
            .eq('id', payload.new.id)
            .single()

          const newOrder = data || payload.new
          setLiveOrders((prev) => {
            if (prev.find((o) => o.id === newOrder.id)) return prev
            return [newOrder, ...prev]
          })
          setNewOrderCount((n) => n + 1)
          setTimeout(() => setNewOrderCount((n) => Math.max(0, n - 1)), 6000)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          setLiveOrders((prev) =>
            prev.map((o) => o.id === payload.new.id ? { ...o, ...payload.new } : o)
          )
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const assignDelivery = async (orderId: string, deliveryId: string) => {
    setAssigningOrder(orderId)
    const { error } = await supabase.from('orders').update({ assigned_delivery_id: deliveryId, status: 'accepted' }).eq('id', orderId)
    if (!error) {
      setLiveOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, assigned_delivery_id: deliveryId, status: 'accepted' as const } : o))
    }
    setAssigningOrder(null)
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdatingStatus(orderId)
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
    if (!error) {
      setLiveOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: status as any } : o))
    }
    setUpdatingStatus(null)
  }

  const saveProduct = async () => {
    if (!editProduct) return
    setProductLoading(true)
    if (editProduct.id) {
      const { data } = await supabase.from('products').update(editProduct).eq('id', editProduct.id).select().single()
      if (data) setLiveProducts((prev) => prev.map((p) => p.id === data.id ? data : p))
    } else {
      const { data } = await supabase.from('products').insert({ ...editProduct }).select().single()
      if (data) setLiveProducts((prev) => [...prev, data])
    }
    setEditProduct(null)
    setProductLoading(false)
  }

  const deleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id)
    setLiveProducts((prev) => prev.filter((p) => p.id !== id))
  }

  // Chart data (all using liveOrders)
  const orders = liveOrders
  const products = liveProducts

  const statusCounts = ['pending', 'accepted', 'picked', 'out_for_delivery', 'delivered', 'cancelled'].map((s) => ({
    name: getStatusLabel(s),
    value: orders.filter((o) => o.status === s).length,
    color: STATUS_COLORS[s],
  })).filter((d) => d.value > 0)

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    const dayOrders = orders.filter((o) => o.created_at.startsWith(dateStr))
    return {
      day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      orders: dayOrders.length,
      revenue: dayOrders.reduce((s, o) => s + o.total_amount, 0),
    }
  })

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = orderFilter === 'all' || o.status === orderFilter
    const matchesSearch = !search || o.id.includes(search) || (o.users as any)?.name?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const liveStats = {
    totalOrders: orders.length,
    revenue: orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total_amount, 0),
    activeUsers: stats.activeUsers,
    activeDeliveries: orders.filter(o => ['accepted','picked','out_for_delivery'].includes(o.status)).length,
  }

  return (
    <div className="min-h-screen bg-[#FEF9F4] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-950 text-white flex flex-col fixed h-full z-20 hidden lg:flex">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-700 flex items-center justify-center text-white font-black text-lg">A</div>
            <div>
              <p className="font-black text-white leading-none">Apurti Foods</p>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id as AdminTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  tab === item.id ? 'bg-brand-700 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Profile */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-white font-bold text-sm">
              {adminProfile.name?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{adminProfile.name}</p>
              <p className="text-xs text-gray-400">Super Admin</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-gray-400 hover:text-white text-sm px-2 py-2 rounded-lg hover:bg-gray-800 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Top bar */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-6 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-gray-900 capitalize">{tab}</h1>
              <p className="text-xs text-gray-400">
                Auto-refresh · Last updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {newOrderCount > 0 && (
                <span className="bg-[#BA181B] text-white text-xs font-black px-3 py-1.5 rounded-full animate-pulse">
                  🔔 +{newOrderCount} new order{newOrderCount > 1 ? 's' : ''}
                </span>
              )}
              <button
                onClick={() => fetchOrders(false)}
                disabled={refreshing}
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              {adminProfile.is_demo_user && (
                <span className="badge bg-amber-100 text-amber-700 text-xs">🎭 Demo</span>
              )}
            </div>
          </div>
          {/* Mobile nav */}
          <div className="lg:hidden flex overflow-x-auto gap-1 px-4 pb-3">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id as AdminTab)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    tab === item.id ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              )
            })}
          </div>
        </header>

        <div className="p-6">
          {/* Dashboard Tab */}
          {tab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Orders', value: liveStats.totalOrders, sub: 'Live count', icon: <ShoppingBag className="w-5 h-5" />, color: 'bg-brand-50 text-brand-700' },
                  { label: 'Revenue', value: formatCurrency(liveStats.revenue), sub: 'From delivered orders', icon: <TrendingUp className="w-5 h-5" />, color: 'bg-green-50 text-green-700' },
                  { label: 'Active Users', value: liveStats.activeUsers, sub: 'Registered accounts', icon: <Users className="w-5 h-5" />, color: 'bg-blue-50 text-blue-700' },
                  { label: 'Active Deliveries', value: liveStats.activeDeliveries, sub: 'In progress now', icon: <Truck className="w-5 h-5" />, color: 'bg-purple-50 text-purple-700' },
                ].map((s) => (
                  <div key={s.label} className="card p-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
                    <p className="text-2xl font-black text-gray-900">{s.value}</p>
                    <p className="text-sm font-semibold text-gray-700 mt-0.5">{s.label}</p>
                    <p className="text-xs text-gray-400">{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Status Donut */}
                <div className="card p-5">
                  <h3 className="section-title mb-4">Orders by Status</h3>
                  {statusCounts.length > 0 ? (
                    <div className="flex items-center gap-4">
                      <ResponsiveContainer width="60%" height={180}>
                        <PieChart>
                          <Pie data={statusCounts} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                            {statusCounts.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val) => [`${val} orders`, '']} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2">
                        {statusCounts.map((s) => (
                          <div key={s.name} className="flex items-center gap-2 text-xs">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                            <span className="text-gray-600">{s.name}</span>
                            <span className="font-bold text-gray-900 ml-auto">{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : <p className="text-gray-400 text-sm text-center py-8">No order data</p>}
                </div>

                {/* Revenue Line Chart */}
                <div className="card p-5">
                  <h3 className="section-title mb-4">Orders — Last 7 Days</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={last7Days}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="orders" stroke="#BA181B" strokeWidth={2.5} dot={{ fill: '#BA181B', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="card p-5">
                <h3 className="section-title mb-4">Recent Orders</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['Order ID', 'Customer', 'Amount', 'Status', 'Date'].map((h) => (
                          <th key={h} className="text-left text-xs font-semibold text-gray-500 pb-3 pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {orders.slice(0, 8).map((o) => (
                        <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 pr-4 font-mono text-xs text-gray-500">#{o.id.slice(0, 8)}</td>
                          <td className="py-3 pr-4 font-semibold text-gray-900">{(o.users as any)?.name || `${o.user_role} user`}</td>
                          <td className="py-3 pr-4 font-black text-brand-700">{formatCurrency(o.total_amount)}</td>
                          <td className="py-3 pr-4">
                            <span className={`badge text-xs ${getStatusColor(o.status)}`}>{getStatusLabel(o.status)}</span>
                          </td>
                          <td className="py-3 text-xs text-gray-400">{formatDate(o.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {tab === 'orders' && (
            <div className="space-y-5 animate-fade-in">
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-48 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by ID or customer name…"
                    className="input pl-9"
                  />
                </div>
                <select
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                  className="input w-auto"
                >
                  <option value="all">All Statuses</option>
                  {['pending', 'accepted', 'picked', 'out_for_delivery', 'delivered', 'cancelled'].map((s) => (
                    <option key={s} value={s}>{getStatusLabel(s)}</option>
                  ))}
                </select>
              </div>

              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Order', 'Customer', 'Items', 'Amount', 'Status', 'Assign Delivery', 'Actions'].map((h) => (
                          <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-mono text-xs text-gray-500">#{o.id.slice(0, 8)}</p>
                            <p className="text-[10px] text-gray-400">{formatDate(o.created_at)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">{(o.users as any)?.name || `${o.user_role} user`}</p>
                            <span className={`text-[10px] font-bold uppercase ${o.user_role === 'distributor' ? 'text-blue-600' : 'text-gray-400'}`}>{o.user_role}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{o.order_items?.length || 0} items</td>
                          <td className="px-4 py-3 font-black text-brand-700">{formatCurrency(o.total_amount)}</td>
                          <td className="px-4 py-3">
                            <span className={`badge text-xs ${getStatusColor(o.status)}`}>{getStatusLabel(o.status)}</span>
                          </td>
                          <td className="px-4 py-3">
                            {o.status === 'pending' && (
                              <select
                                onChange={(e) => e.target.value && assignDelivery(o.id, e.target.value)}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
                                defaultValue=""
                                disabled={assigningOrder === o.id}
                              >
                                <option value="">Assign Partner</option>
                                {deliveryPartners.map((d) => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                              </select>
                            )}
                            {o.assigned_delivery_id && (
                              <p className="text-xs text-green-600 font-semibold">
                                ✓ {deliveryPartners.find((d) => d.id === o.assigned_delivery_id)?.name || 'Assigned'}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={o.status}
                              onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
                              disabled={updatingStatus === o.id}
                            >
                              {['pending', 'accepted', 'picked', 'out_for_delivery', 'delivered', 'cancelled'].map((s) => (
                                <option key={s} value={s}>{getStatusLabel(s)}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {tab === 'products' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex justify-end">
                <button
                  onClick={() => setEditProduct({ name: '', description: '', price_customer: 0, stock: 0, category: 'Snacks', image_url: '' })}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </div>

              {editProduct && (
                <div className="card p-5">
                  <h3 className="section-title mb-4">{editProduct.id ? 'Edit Product' : 'New Product'}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Product Name</label>
                      <input value={editProduct.name || ''} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} className="input" placeholder="e.g. Foxtail Millet Flour" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                      <textarea rows={2} value={editProduct.description || ''} onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })} className="input resize-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Price (₹)</label>
                      <input type="number" value={editProduct.price_customer || ''} onChange={(e) => setEditProduct({ ...editProduct, price_customer: +e.target.value })} className="input" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Stock</label>
                      <input type="number" value={editProduct.stock || ''} onChange={(e) => setEditProduct({ ...editProduct, stock: +e.target.value })} className="input" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                      <select value={editProduct.category || 'Snacks'} onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })} className="input">
                        {['Snacks', 'Flour', 'Ready-to-eat', 'Grains', 'Beverages'].map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Image URL</label>
                      <input value={editProduct.image_url || ''} onChange={(e) => setEditProduct({ ...editProduct, image_url: e.target.value })} className="input" placeholder="https://..." />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={saveProduct} disabled={productLoading} className="btn-primary flex items-center gap-2">
                      <Check className="w-4 h-4" /> {productLoading ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => setEditProduct(null)} className="btn-secondary flex items-center gap-2">
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Product', 'Category', 'Price', 'Stock', 'Actions'].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-400 line-clamp-1">{p.description}</p>
                        </td>
                        <td className="px-4 py-3"><span className="badge badge-gray">{p.category}</span></td>
                        <td className="px-4 py-3 font-black text-brand-700">{formatCurrency(p.price_customer)}</td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${p.stock <= 5 ? 'text-red-600' : 'text-green-600'}`}>{p.stock}</span>
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          <button onClick={() => setEditProduct(p)} className="btn-icon hover:bg-blue-50 text-blue-600"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => deleteProduct(p.id)} className="btn-icon hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {tab === 'users' && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                {(['customer', 'distributor', 'delivery', 'admin'] as const).map((role) => {
                  const count = users.filter((u) => u.role === role).length
                  const colors: Record<string, string> = { customer: 'text-orange-700 bg-orange-50', distributor: 'text-blue-700 bg-blue-50', delivery: 'text-green-700 bg-green-50', admin: 'text-purple-700 bg-purple-50' }
                  return (
                    <div key={role} className="card p-4 text-center">
                      <p className={`text-2xl font-black ${colors[role].split(' ')[0]}`}>{count}</p>
                      <p className="text-sm font-semibold text-gray-700 capitalize">{role}s</p>
                    </div>
                  )
                })}
              </div>

              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['User', 'Email', 'Role', 'Joined', 'Demo'].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-900">{u.name}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`badge text-xs ${
                            u.role === 'admin' ? 'bg-purple-50 text-purple-700' :
                            u.role === 'distributor' ? 'bg-blue-50 text-blue-700' :
                            u.role === 'delivery' ? 'bg-green-50 text-green-700' :
                            'bg-orange-50 text-orange-700'
                          }`}>{u.role}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{formatDate(u.created_at)}</td>
                        <td className="px-4 py-3">
                          {u.is_demo_user && <span className="badge badge-yellow text-[10px]">Demo</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Distributor Pricing Tab */}
          {tab === 'pricing' && (
            <div className="animate-fade-in">
              <div className="card p-5">
                <h3 className="section-title mb-2">Distributor Pricing Management</h3>
                <p className="text-sm text-gray-500 mb-5">Set custom prices and offers for each distributor. These override the default customer price.</p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                  <p className="font-bold mb-1">💡 How Custom Pricing Works</p>
                  <p>Use the Supabase dashboard → Table Editor → distributor_pricing to set custom prices per distributor-product combination. Changes reflect immediately in the distributor's catalog.</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <a href="https://dmhujjpsrwnzjllidhzr.supabase.co/project/default/editor" target="_blank" rel="noreferrer" className="btn-primary text-center text-sm py-3">
                    Open Supabase Editor ↗
                  </a>
                  <a href="https://dmhujjpsrwnzjllidhzr.supabase.co" target="_blank" rel="noreferrer" className="btn-secondary text-center text-sm py-3">
                    Supabase Dashboard ↗
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
