import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DistributorDashboard from '@/components/distributor/DistributorDashboard'

export default async function DistributorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (profile?.role !== 'distributor') redirect('/')

  const { data: orderStats } = await supabase
    .from('orders')
    .select('total_amount, status')
    .eq('user_id', user.id)

  const { data: products } = await supabase.from('products').select('*')
  const { data: pricing } = await supabase
    .from('distributor_pricing')
    .select('*, products(*)')
    .eq('distributor_id', user.id)

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('*, order_items(*, products(*))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const totalOrders = orderStats?.length || 0
  const totalRevenue = orderStats?.reduce((s, o) => s + o.total_amount, 0) || 0
  const totalSavings = (pricing || []).reduce((sum, p) => {
    const retail = p.products?.price_customer || 0
    return sum + Math.max(0, retail - p.custom_price)
  }, 0)

  return (
    <DistributorDashboard
      profile={profile}
      products={products || []}
      pricing={pricing || []}
      recentOrders={recentOrders || []}
      stats={{ totalOrders, totalRevenue, totalSavings }}
    />
  )
}
