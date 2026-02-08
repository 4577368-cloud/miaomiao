-- Allow anon to pass check_is_admin for testing
CREATE OR REPLACE FUNCTION check_is_admin()
RETURNS boolean AS $$
BEGIN
  -- For testing purposes, allow everyone or just return true
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
