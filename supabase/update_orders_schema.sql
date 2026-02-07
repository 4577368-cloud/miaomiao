-- Add missing columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS pet_ids uuid[],
ADD COLUMN IF NOT EXISTS pet_snapshots jsonb,
ADD COLUMN IF NOT EXISTS sitter_snapshot jsonb,
ADD COLUMN IF NOT EXISTS coupon_id uuid references public.coupons(id),
ADD COLUMN IF NOT EXISTS discount_amount decimal(10, 2) default 0.00,
ADD COLUMN IF NOT EXISTS original_price decimal(10, 2);

-- Add points to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS points int default 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_creator_id ON public.orders(creator_id);
CREATE INDEX IF NOT EXISTS idx_orders_sitter_id ON public.orders(sitter_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Create RPC for safe balance deduction
CREATE OR REPLACE FUNCTION public.deduct_balance(user_id uuid, amount decimal)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_bal decimal;
BEGIN
  SELECT balance INTO current_bal FROM public.profiles WHERE id = user_id FOR UPDATE;
  
  IF current_bal < amount THEN
    RETURN false;
  END IF;
  
  UPDATE public.profiles 
  SET balance = balance - amount,
      updated_at = now()
  WHERE id = user_id;
  
  RETURN true;
END;
$$;

-- Create RPC for adding labor income
CREATE OR REPLACE FUNCTION public.add_labor_income(user_id uuid, amount decimal)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles 
  SET labor_balance = labor_balance + amount,
      updated_at = now()
  WHERE id = user_id;
END;
$$;
