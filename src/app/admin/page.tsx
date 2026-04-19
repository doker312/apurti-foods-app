import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminDashboard from '@/components/admin/AdminDashboard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/login')

  const [
    { data: orders },
    { data: users },
    { data: products },
    { data: deliveryPartners },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('*, users(id, name, email, phone, role), order_items(id, quantity, price, products(id, name, category))')
      .order('created_at', { ascending: false }),
    supabase.from('users').select('*').order('created_at', { ascending: false }),
    supabase.from('products').select('*').order('name'),
    supabase.from('users').select('*').eq('role', 'delivery'),
  ])

  const delivered = (orders || []).filter((o) => o.status === 'delivered')
  const revenue = delivered.reduce((s, o) => s + o.total_amount, 0)
  const activeDeliveries = (orders || []).filter((o) => ['accepted', 'picked', 'out_for_delivery'].includes(o.status)).length

  return (
    <AdminDashboard
      adminProfile={profile}
      orders={orders || []}
      users={users || []}
      products={products || []}
      deliveryPartners={deliveryPartners || []}
      stats={{
        totalOrders: orders?.length || 0,
        revenue,
        activeUsers: users?.length || 0,
        activeDeliveries,
      }}
    />
  )
}
