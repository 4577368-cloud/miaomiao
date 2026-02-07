-- Add gender and user_no to profiles
-- 1. Create sequence for 9-digit User ID (starting from 100,000,001)
CREATE SEQUENCE IF NOT EXISTS public.user_no_seq START 100000001;

-- 2. Add columns to profiles table
DO $$
BEGIN
    -- Add gender
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'gender') THEN
        ALTER TABLE public.profiles ADD COLUMN gender text CHECK (gender IN ('male', 'female', 'other'));
    END IF;

    -- Add user_no
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_no') THEN
        ALTER TABLE public.profiles ADD COLUMN user_no bigint DEFAULT nextval('public.user_no_seq');
    END IF;
END $$;

-- 3. Ensure user_no is unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_no ON public.profiles(user_no);

-- 4. Update existing records that might have null user_no (if any)
UPDATE public.profiles SET user_no = nextval('public.user_no_seq') WHERE user_no IS NULL;
