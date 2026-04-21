'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function registerDistributor(prevState: any, formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized login strictly required.' }

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return { error: 'Strictly forbidden. Admins only.' }

    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const password = formData.get('password') as string

    if (!name || !email || !password) {
      return { error: 'Please provide missing input required fields.' }
    }

    const adminAuth = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: authData, error: authError } = await adminAuth.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    })

    if (authError) {
      // Supabase generic message for already registered
      if (authError.message.includes('already been registered')) {
         return { error: 'That email is already registered.' }
      }
      return { error: authError.message }
    }
    if (!authData.user) return { error: 'Fatal account synthesis failed.' }

    // Inject into public.users
    const { error: dbError } = await adminAuth.from('users').insert({
      id: authData.user.id,
      name,
      email,
      phone,
      role: 'distributor',
      is_demo_user: false
    })

    if (dbError) {
      // If DB fails, rollback the auth user
      await adminAuth.auth.admin.deleteUser(authData.user.id)
      return { error: 'Database strict profile failure: ' + dbError.message }
    }

    revalidatePath('/admin')
    return { success: true }
    
  } catch (err: any) {
    return { error: 'Fatal operation error server crash.' }
  }
}
