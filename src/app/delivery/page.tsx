import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DeliveryDashboard from '@/components/delivery/DeliveryDashboard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DeliveryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (profile?.role !== 'delivery') redirect('/login')

  const { data: assignedOrders } = await supabase
    .from('orders')
    .select('*, order_items(*, products(*)), users(*)')
    .eq('assigned_delivery_id', user.id)
    .in('status', ['accepted', 'picked', 'out_for_delivery'])
    .order('created_at', { ascending: false })

  const { data: completedOrders } = await supabase
    .from('orders')
    .select('*, order_items(*, products(*))')
    .eq('assigned_delivery_id', user.id)
    .eq('status', 'delivered')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <DeliveryDashboard
      profile={profile}
      assignedOrders={assignedOrders || []}
      completedOrders={completedOrders || []}
    />
  )
}
