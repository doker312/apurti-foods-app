import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CustomerHomePage from '@/components/customer/CustomerHomePage'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
    profile = data
  }
  const { data: products } = await supabase.from('products').select('*').order('name')

  return (
    <CustomerHomePage
      profile={profile}
      products={products || []}
    />
  )
}
