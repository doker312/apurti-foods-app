-- ============================================================
-- APURTI FOODS — RLS PATCH (Run this AFTER schema.sql)
-- This fixes cross-role data visibility & insert permissions
-- ============================================================

-- CRITICAL: Enable REPLICA IDENTITY FULL for Supabase Realtime
-- Without this, realtime INSERT/UPDATE events may not fire correctly
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;
ALTER TABLE public.delivery_tracking REPLICA IDENTITY FULL;
ALTER TABLE public.users REPLICA IDENTITY FULL;

-- Fix: Allow all authenticated users to read user profiles
-- (needed so admin can see customer names in orders, etc.)
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Authenticated users can read all profiles" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Fix: Allow users to insert their own profile (Google OAuth callback)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Fix: Allow service role to do everything on users
-- (seed route uses service role key - this is automatic but ensure it)
DROP POLICY IF EXISTS "Service role full access on users" ON public.users;

-- Fix: Allow any authenticated user to read all products
DROP POLICY IF EXISTS "Anyone can read products" ON public.products;
CREATE POLICY "Anyone can read products" ON public.products
  FOR SELECT USING (true);

-- Fix: Allow admin to insert/update/delete products
DROP POLICY IF EXISTS "Admin can manage products" ON public.products;
CREATE POLICY "Admin can manage products" ON public.products
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Fix: All authenticated users can read all orders (admin needs to see all)
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
CREATE POLICY "Users can read relevant orders" ON public.orders
  FOR SELECT USING (
    user_id = auth.uid()
    OR assigned_delivery_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin'))
  );

-- Fix: Allow delivery partners to read orders assigned to them
-- (even before they're assigned - delivery sees pending orders too)
DROP POLICY IF EXISTS "Delivery can see pending orders" ON public.orders;
CREATE POLICY "Delivery can see all for acceptance" ON public.orders
  FOR SELECT USING (
    user_id = auth.uid()
    OR assigned_delivery_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'delivery'))
  );

-- Fix: Admin can update any order
DROP POLICY IF EXISTS "Delivery and admin can update orders" ON public.orders;
CREATE POLICY "Delivery and admin can update orders" ON public.orders
  FOR UPDATE USING (
    assigned_delivery_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Fix: Allow admin to insert orders too
DROP POLICY IF EXISTS "Admin can insert orders" ON public.orders;
CREATE POLICY "Admin can insert orders" ON public.orders
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Fix: Order items - all authenticated can read (for admin/delivery)
DROP POLICY IF EXISTS "Order items readable by order owner" ON public.order_items;
CREATE POLICY "Order items readable by relevant users" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
      AND (
        o.user_id = auth.uid()
        OR o.assigned_delivery_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'delivery'))
      )
    )
  );

-- Fix: Distributor pricing - distributors and admins can read
DROP POLICY IF EXISTS "Distributor reads own pricing" ON public.distributor_pricing;
CREATE POLICY "Distributor reads own pricing" ON public.distributor_pricing
  FOR SELECT USING (
    distributor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Fix: delivery_tracking readable by all authenticated
DROP POLICY IF EXISTS "Order owners can read tracking" ON public.delivery_tracking;
CREATE POLICY "Tracking readable by authenticated" ON public.delivery_tracking
  FOR SELECT USING (auth.role() = 'authenticated');

-- Ensure realtime is on
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_tracking;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
