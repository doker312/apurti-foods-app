import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CustomerHomePage from '@/components/customer/CustomerHomePage'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  const { data: products } = await supabase.from('products').select('*').order('name')

  return (
    <CustomerHomePage
      profile={profile}
      products={products || []}
    />
  )
}
