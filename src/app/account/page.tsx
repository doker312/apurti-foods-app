import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AccountClient from '@/components/customer/AccountClient'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  const { data: orders } = await supabase
    .from('orders')
    .select('id, total_amount, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return <AccountClient profile={profile} recentOrders={orders || []} />
}
