-- Add columns for tracking points and refund info
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS points_used int DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_amount decimal(10, 2) DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_time timestamptz;

-- Update status check constraint to include 'REFUNDED'
-- Postgres doesn't allow easy modification of check constraints, so we drop and re-add
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('UNPAID', 'PENDING', 'PENDING_ACCEPTANCE', 'ACCEPTED', 'IN_SERVICE', 'COMPLETED', 'REVIEWED', 'CANCELLED', 'REFUNDED'));

-- Create RPC for refunding
CREATE OR REPLACE FUNCTION public.admin_refund_order(target_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_creator_id uuid;
  v_points_used int;
BEGIN
  -- Get order details
  SELECT * INTO v_order FROM public.orders WHERE id = target_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Check if already refunded
  IF v_order.status = 'REFUNDED' THEN
    RAISE EXCEPTION 'Order already refunded';
  END IF;
  
  -- Check if cancelled (Requirement: "When an order is cancelled...")
  IF v_order.status != 'CANCELLED' THEN
    RAISE EXCEPTION 'Only cancelled orders can be refunded';
  END IF;

  v_points_used := COALESCE(v_order.points_used, 0);
  v_creator_id := v_order.creator_id;

  -- 1. Return points if used
  -- Ensure points column exists before update (Safe guard)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'points') THEN
      IF v_points_used > 0 THEN
        UPDATE public.profiles 
        SET points = COALESCE(points, 0) + v_points_used 
        WHERE id = v_creator_id;
      END IF;
  END IF;

  -- 2. Update order status
  UPDATE public.orders 
  SET status = 'REFUNDED',
      refund_time = now(),
      updated_at = now()
  WHERE id = target_order_id;

  -- 3. (Optional) Log notification
  -- Ensure uuid-ossp extension is available for uuid_generate_v4
  INSERT INTO public.notifications (id, user_id, type, title, content, order_id)
  VALUES (
    (SELECT uuid_generate_v4()::text),
    v_creator_id,
    'system',
    '订单已退款',
    '您的订单已完成退款' || CASE WHEN v_points_used > 0 THEN '，并退还 ' || v_points_used || ' 积分' ELSE '' END,
    target_order_id
  );

END;
$$;

-- Security hardening: Revoke execution from public and grant only to service_role/admin
-- Note: In Supabase, 'service_role' has full access. We want to ensure anon/authenticated users cannot call this directly via RPC.
REVOKE EXECUTE ON FUNCTION public.admin_refund_order(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_refund_order(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_refund_order(uuid) FROM authenticated;
-- Grant to service_role (implicit, but good to be explicit if needed, usually not required for service_role)
-- If you have a specific admin role in the database, grant to that. 
-- For Supabase Dashboard SQL Editor execution, it runs as postgres/admin.
-- For API calls, we rely on the backend checking permissions before calling this, OR if calling from frontend, we need an RLS policy or check inside the function.
-- Since this is an RPC, if we want to call it from frontend Admin panel, we DO need to grant it to authenticated users BUT add a check inside the function.

-- Alternative Secure Approach: Allow authenticated users to call, but check for admin role inside.
GRANT EXECUTE ON FUNCTION public.admin_refund_order(uuid) TO authenticated;

-- Update function to include role check
CREATE OR REPLACE FUNCTION public.admin_refund_order(target_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_creator_id uuid;
  v_points_used int;
  v_caller_role text;
BEGIN
  -- Check if caller is admin
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
  IF v_caller_role IS DISTINCT FROM 'admin' AND v_caller_role IS DISTINCT FROM 'super_admin' THEN
    RAISE EXCEPTION 'Access denied: Only admins can refund orders';
  END IF;

  -- Get order details
  SELECT * INTO v_order FROM public.orders WHERE id = target_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Check if already refunded
  IF v_order.status = 'REFUNDED' THEN
    RAISE EXCEPTION 'Order already refunded';
  END IF;
  
  -- Check if cancelled (Requirement: "When an order is cancelled...")
  IF v_order.status != 'CANCELLED' THEN
    RAISE EXCEPTION 'Only cancelled orders can be refunded';
  END IF;

  v_points_used := COALESCE(v_order.points_used, 0);
  v_creator_id := v_order.creator_id;

  -- 1. Return points if used
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'points') THEN
      IF v_points_used > 0 THEN
        UPDATE public.profiles 
        SET points = COALESCE(points, 0) + v_points_used 
        WHERE id = v_creator_id;
      END IF;
  END IF;

  -- 2. Update order status
  UPDATE public.orders 
  SET status = 'REFUNDED',
      refund_time = now(),
      updated_at = now()
  WHERE id = target_order_id;

  -- 3. (Optional) Log notification
  INSERT INTO public.notifications (id, user_id, type, title, content, order_id)
  VALUES (
    (SELECT uuid_generate_v4()::text),
    v_creator_id,
    'system',
    '订单已退款',
    '您的订单已完成退款' || CASE WHEN v_points_used > 0 THEN '，并退还 ' || v_points_used || ' 积分' ELSE '' END,
    target_order_id
  );

END;
$$;
