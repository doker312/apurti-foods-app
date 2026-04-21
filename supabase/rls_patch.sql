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

-- REPLICA IDENTITY FULL is required for Supabase Realtime to send full row data
-- (supabase_realtime publication was already added in schema.sql — don't re-add)
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;
ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER TABLE public.products REPLICA IDENTITY FULL;

-- ============================================================
-- FEATURE UPDATE: PACKING OPTIONS (500g, 10Kg, 30Kg)
-- ============================================================
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_500g NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_10kg NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_30kg NUMERIC(10,2) DEFAULT 0;

-- Update existing items to copy the base price to the 500g, 10kg, 30kg variants for continuity
UPDATE public.products SET price_500g = price_customer WHERE price_500g = 0;
UPDATE public.products SET price_10kg = price_customer * 18 WHERE price_10kg = 0;
UPDATE public.products SET price_30kg = price_customer * 52 WHERE price_30kg = 0;

-- Orders and Distributor Packing
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS packing TEXT DEFAULT '500g';
ALTER TABLE public.distributor_pricing ADD COLUMN IF NOT EXISTS packing TEXT DEFAULT '500g';

-- Modify unique constraints if needed for distributor pricing
ALTER TABLE public.distributor_pricing DROP CONSTRAINT IF EXISTS distributor_pricing_distributor_id_product_id_key;
ALTER TABLE public.distributor_pricing ADD CONSTRAINT distributor_pricing_distributor_id_product_id_packing_key UNIQUE (distributor_id, product_id, packing);
