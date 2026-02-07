
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio text DEFAULT '';

-- Update RLS if needed, though usually update policy covers all columns
-- Just in case, ensure the policy allows updating 'bio'
-- (Existing policies usually allow UPDATE on the row based on ID, so specific columns are implicitly covered unless using column-level security which is rare here)
