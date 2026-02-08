-- 1. 解除 Announcements 表的限制 (发布公告)
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for announcements (Dev)" ON public.announcements;
CREATE POLICY "Enable all for announcements (Dev)"
ON public.announcements FOR ALL
USING (true)
WITH CHECK (true);

-- 2. 解除 Pets 表的限制 (避免删除用户时因级联删除权限不足报错)
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for pets (Dev)" ON public.pets;
CREATE POLICY "Enable all for pets (Dev)"
ON public.pets FOR ALL
USING (true)
WITH CHECK (true);

-- 3. 解除 Addresses 表的限制 (同上)
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for addresses (Dev)" ON public.addresses;
CREATE POLICY "Enable all for addresses (Dev)"
ON public.addresses FOR ALL
USING (true)
WITH CHECK (true);
