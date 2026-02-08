-- Fix Order Visibility and Permissions for Sitters (Task Hall)

-- 1. Fix SELECT Policy (Visibility)
-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

-- Create new policy:
-- Allows viewing if:
-- - You are the creator
-- - You are the assigned sitter
-- - The order is a public pending task (Task Hall)
CREATE POLICY "Users can view own orders or public tasks" 
ON public.orders 
FOR SELECT 
USING (
  auth.uid() = creator_id 
  OR auth.uid() = sitter_id 
  OR (status = 'PENDING' AND sitter_id IS NULL)
);

-- 2. Fix UPDATE Policy (Accepting Orders)
-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;

-- Create new policy:
-- Allows updating if:
-- - You are the creator
-- - You are the assigned sitter
-- - The order is a public pending task (allows sitters to "claim" it)
CREATE POLICY "Users can update own orders or claim tasks" 
ON public.orders 
FOR UPDATE 
USING (
  auth.uid() = creator_id 
  OR auth.uid() = sitter_id 
  OR (status = 'PENDING' AND sitter_id IS NULL)
);
