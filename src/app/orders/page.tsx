import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OrdersClient from '@/components/customer/OrdersClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id, quantity, price,
        products ( id, name, category, image_url )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <OrdersClient orders={orders || []} userId={user.id} />
}
