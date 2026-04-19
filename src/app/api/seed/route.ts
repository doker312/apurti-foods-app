import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const PRODUCTS = [
  { name: 'Foxtail Millet Flour', description: 'Stone-ground foxtail millet flour, rich in protein & fiber. Perfect for rotis & dosas.', price_customer: 149, stock: 200, category: 'Flour', image_url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80' },
  { name: 'Pearl Millet (Bajra) Atta', description: 'Traditional bajra flour, high in iron and magnesium. Ideal for winter meals.', price_customer: 129, stock: 180, category: 'Flour', image_url: 'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=400&q=80' },
  { name: 'Barnyard Millet Flakes', description: 'Ready-to-cook barnyard millet flakes. Gluten-free, great for porridge & upma.', price_customer: 189, stock: 150, category: 'Ready-to-eat', image_url: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=400&q=80' },
  { name: 'Ragi Malt Mix', description: 'Nutritious finger millet malt, enriched with jaggery. A perfect energy drink for all ages.', price_customer: 219, stock: 120, category: 'Beverages', image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80' },
  { name: 'Jowar Pops (Spicy)', description: 'Crunchy sorghum pops with a spicy masala coating. The healthy alternative to popcorn.', price_customer: 99, stock: 5, category: 'Snacks', image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80' },
  { name: 'Kodo Millet Rice', description: 'Whole kodo millet grains — a diabetic-friendly rice substitute packed with antioxidants.', price_customer: 175, stock: 95, category: 'Grains', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80' },
  { name: 'Little Millet Khichdi Mix', description: 'Ready-to-cook little millet khichdi with lentils, spices, and vegetables. Done in 15 mins.', price_customer: 159, stock: 80, category: 'Ready-to-eat', image_url: 'https://images.unsplash.com/photo-1631452180775-7c5bacec4e45?w=400&q=80' },
  { name: 'Proso Millet Trail Mix', description: 'A power-packed mix of proso millet, nuts & seeds. High protein snack for active lifestyles.', price_customer: 249, stock: 4, category: 'Snacks', image_url: 'https://images.unsplash.com/photo-1604004555489-723a93d6ce74?w=400&q=80' },
  { name: 'Sorghum Breakfast Cereal', description: 'Crunchy sorghum-based breakfast cereal with honey and almond coating.', price_customer: 299, stock: 60, category: 'Ready-to-eat', image_url: 'https://images.unsplash.com/photo-1559181567-c3190bbbce65?w=400&q=80' },
  { name: 'Mixed Millet Grain Pack', description: 'A curated pack of 5 heirloom millets — perfect for a weekly rotation of healthy meals.', price_customer: 399, stock: 45, category: 'Grains', image_url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80' },
]

const DEMO_USERS = [
  { name: 'Demo Customer', email: 'customer@demo.apurti.com', role: 'customer', is_demo_user: true, password: 'demo123' },
  { name: 'Ram Distributors', email: 'distributor@demo.com', role: 'distributor', is_demo_user: true, password: '123456' },
  { name: 'Shyam Wholesale', email: 'distributor2@demo.com', role: 'distributor', is_demo_user: true, password: '123456' },
  { name: 'Raja Rider', email: 'delivery@demo.com', role: 'delivery', is_demo_user: true, password: '123456' },
  { name: 'Priya Speed', email: 'delivery2@demo.com', role: 'delivery', is_demo_user: true, password: '123456' },
  { name: 'Admin Apurti', email: 'admin@apurti.com', role: 'admin', is_demo_user: true, password: 'admin123' },
]

export async function GET() {
  try {
    const supabase = await createAdminClient()

    // Create auth users and profiles
    const createdUsers: Record<string, string> = {}
    for (const u of DEMO_USERS) {
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
    const dist1Id = createdUsers['distributor_distributor@demo.com']
    const dist2Id = createdUsers['distributor_distributor2@demo.com']

    if (dist1Id && products.length > 0) {
      const pricingData = products.map((p: typeof products[0], i: number) => ({
        distributor_id: dist1Id,
        product_id: p.id,
        custom_price: Math.round(p.price_customer * (i % 2 === 0 ? 0.78 : 0.82)),
        custom_offer: i % 2 === 0 ? 22 : 18,
      }))
      await supabase.from('distributor_pricing').upsert(pricingData, { onConflict: 'distributor_id,product_id' })
    }

    if (dist2Id && products.length > 0) {
      const pricingData2 = products.slice(0, 6).map((p: typeof products[0]) => ({
        distributor_id: dist2Id,
        product_id: p.id,
        custom_price: Math.round(p.price_customer * 0.75),
        custom_offer: 25,
      }))
      await supabase.from('distributor_pricing').upsert(pricingData2, { onConflict: 'distributor_id,product_id' })
    }

    // Create demo orders
    const customerId = createdUsers['customer_customer@demo.apurti.com']
    const deliveryId = createdUsers['delivery_delivery@demo.com']
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
