import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const PRODUCTS = [
  { name: 'Pearl Millet (Bajra) Atta', description: 'Traditional bajra flour, high in iron and magnesium.', price_customer: 129, price_500g: 129, price_10kg: 2300, price_30kg: 6800, stock: 180, category: 'Flour', image_url: '/products/Bajra Atta.jpeg' },
  { name: 'Barely (Jou) Flour', description: 'Healthy barely flour, great for breads and rotis.', price_customer: 119, price_500g: 119, price_10kg: 2100, price_30kg: 6100, stock: 150, category: 'Flour', image_url: '/products/Barely (Jou) Flour.jpeg' },
  { name: 'Chana Atta', description: 'Pure chana flour, rich in protein.', price_customer: 139, price_500g: 139, price_10kg: 2500, price_30kg: 7400, stock: 200, category: 'Flour', image_url: '/products/Chana Atta.jpeg' },
  { name: 'Foxnut (Makhana)', description: 'Premium quality foxnuts. Perfect for light snacking.', price_customer: 199, price_500g: 199, price_10kg: 3500, price_30kg: 10000, stock: 50, category: 'Snacks', image_url: '/products/Foxnut.jpeg' },
  { name: 'Kuttu Atta', description: 'Buckwheat flour for fasting.', price_customer: 169, price_500g: 169, price_10kg: 3000, price_30kg: 8900, stock: 100, category: 'Flour', image_url: '/products/Kuttu Atta.jpeg' },
  { name: 'Makka Atta (Corn Flour)', description: 'Traditional corn flour. Essential for makki ki roti.', price_customer: 99, price_500g: 99, price_10kg: 1700, price_30kg: 5000, stock: 120, category: 'Flour', image_url: '/products/Makka Atta(Corn Flour).jpeg' },
  { name: 'Soyabean Atta', description: 'Protein-rich soyabean flour.', price_customer: 149, price_500g: 149, price_10kg: 2600, price_30kg: 7600, stock: 80, category: 'Flour', image_url: '/products/Soyabean Atta.jpeg' },
]

const PROD_USERS = [
  { name: 'Apurti Admin', email: 'admin@apurti.com', role: 'admin', is_demo_user: false, password: 'ApurtiAdmin2026!' },
  { name: 'Raju Distributor', email: 'wholesale@apurti.com', role: 'distributor', is_demo_user: false, password: 'Distributor2026!' },
  { name: 'Express Delivery', email: 'driver@apurti.com', role: 'delivery', is_demo_user: false, password: 'Delivery2026!' },
  { name: 'Demo Customer', email: 'customer@apurti.com', role: 'customer', is_demo_user: false, password: 'Customer2026!' },
]

export async function GET() {
  try {
    const supabase = await createAdminClient()

    // Create auth users and profiles
    const createdUsers: Record<string, string> = {}
    for (const u of PROD_USERS) {
      // Try to create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.name },
      })

      let userId: string
      if (authError && authError.message.includes('already been registered')) {
        // Get existing user
        const { data: users } = await supabase.auth.admin.listUsers()
        const existing = users?.users?.find((user) => user.email === u.email)
        userId = existing?.id || ''
      } else if (authUser?.user) {
        userId = authUser.user.id
      } else {
        continue
      }

      if (userId) {
        createdUsers[u.role + '_' + u.email] = userId
        // Upsert profile
        await supabase.from('users').upsert({
          id: userId,
          name: u.name,
          email: u.email,
          role: u.role,
          is_demo_user: u.is_demo_user,
        }, { onConflict: 'id' })
      }
    }

    // Insert products
    const { data: insertedProducts } = await supabase
      .from('products')
      .upsert(PRODUCTS.map((p) => ({ ...p })), { onConflict: 'name' })
      .select()

    const products = insertedProducts || []

    // Use first distributor for pricing
    const dist1Id = createdUsers['distributor_wholesale@apurti.com']

    if (dist1Id && products.length > 0) {
      const pricingData = products.map((p: typeof products[0], i: number) => ({
        distributor_id: dist1Id,
        product_id: p.id,
        packing: '500g',
        custom_price: Math.round(p.price_customer * (i % 2 === 0 ? 0.78 : 0.82)),
        custom_offer: i % 2 === 0 ? 22 : 18,
      }))
      await supabase.from('distributor_pricing').upsert(pricingData, { onConflict: 'distributor_id,product_id,packing' })
    }



    // Create demo orders
    const customerId = createdUsers['customer_customer@apurti.com']
    const deliveryId = createdUsers['delivery_driver@apurti.com']
    const statuses = ['pending', 'accepted', 'picked', 'out_for_delivery', 'delivered', 'delivered', 'delivered', 'pending', 'accepted', 'delivered']

    if (customerId && products.length >= 2) {
      for (let i = 0; i < 10; i++) {
        const status = statuses[i]
        const orderProducts = [products[i % products.length], products[(i + 1) % products.length]]
        const total = orderProducts.reduce((s: number, p: typeof products[0]) => s + p.price_customer, 0)

        const { data: order } = await supabase.from('orders').insert({
          user_id: customerId,
          user_role: 'customer',
          total_amount: total,
          status,
          assigned_delivery_id: ['accepted', 'picked', 'out_for_delivery', 'delivered'].includes(status) ? deliveryId : null,
          delivery_location_lat: 28.6139 + (Math.random() - 0.5) * 0.1,
          delivery_location_lng: 77.2090 + (Math.random() - 0.5) * 0.1,
          created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        }).select().single()

        if (order) {
          await supabase.from('order_items').insert(
            orderProducts.map((p: typeof products[0]) => ({
              order_id: order.id,
              product_id: p.id,
              quantity: Math.floor(Math.random() * 3) + 1,
              price: p.price_customer,
            }))
          )
        }
      }

      // Distributor orders
      if (dist1Id) {
        for (let i = 0; i < 10; i++) {
          const status = statuses[(i + 3) % statuses.length]
          const bulkProducts = products.slice(i % 5, (i % 5) + 3)
          const total = bulkProducts.reduce((s: number, p: typeof products[0]) => s + p.price_customer * 10, 0) * 0.8

          const { data: distOrder } = await supabase.from('orders').insert({
            user_id: dist1Id,
            user_role: 'distributor',
            total_amount: total,
            status,
            assigned_delivery_id: ['accepted', 'picked', 'out_for_delivery', 'delivered'].includes(status) ? deliveryId : null,
            created_at: new Date(Date.now() - i * 48 * 60 * 60 * 1000).toISOString(),
          }).select().single()

          if (distOrder) {
            await supabase.from('order_items').insert(
              bulkProducts.map((p: typeof products[0]) => ({
                order_id: distOrder.id,
                product_id: p.id,
                quantity: 10,
                price: Math.round(p.price_customer * 0.8),
              }))
            )
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: '✅ Demo data seeded successfully!',
      accounts: {
        customer: { email: 'customer@demo.apurti.com', password: 'demo123' },
        distributor: { email: 'distributor@demo.com', password: '123456' },
        delivery: { email: 'delivery@demo.com', password: '123456' },
        admin: { email: 'admin@apurti.com', password: 'admin123' },
      },
      seeded: { products: products.length, users: Object.keys(createdUsers).length },
    })
  } catch (err: any) {
    console.error('Seed error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
