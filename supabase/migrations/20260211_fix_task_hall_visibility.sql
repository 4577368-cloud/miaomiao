-- Fix Order Visibility for Task Hall (Sitter View)
-- This allows sitters to see 'PENDING' orders that are not yet assigned.

-- 1. DROP existing restrictive policies
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;

-- 2. CREATE new inclusive SELECT policy
-- Allows viewing if:
-- - User is the creator
-- - User is the assigned sitter
-- - Order is PENDING and has no sitter (Public Task Hall)
CREATE POLICY "Users can view own orders or public tasks" 
ON public.orders 
FOR SELECT 
USING (
  auth.uid() = creator_id 
  OR auth.uid() = sitter_id 
  OR (status = 'PENDING' AND sitter_id IS NULL)
);

-- 3. CREATE new inclusive UPDATE policy
-- Allows updating if:
-- - User is the creator
-- - User is the assigned sitter
-- - Order is PENDING and has no sitter (allows claiming the task)
CREATE POLICY "Users can update own orders or claim tasks" 
ON public.orders 
FOR UPDATE 
USING (
  auth.uid() = creator_id 
  OR auth.uid() = sitter_id 
  OR (status = 'PENDING' AND sitter_id IS NULL)
);

-- 4. Ensure RLS is enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
