-- =============================================
-- Migration 003: RLS Security Patch & Trigger Fix
-- Run this in Supabase SQL Editor
-- =============================================

-- ======================
-- Fix 1: Trigger an toàn - Không cast role (tránh lỗi 500 khi đăng ký)
-- ======================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ======================
-- Fix 2: Bảng rewards - Enable RLS (chưa được enable)
-- ======================
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;


-- ======================
-- Fix 3: Children can SELECT their own rewards
-- ======================
CREATE POLICY "Children can view own rewards"
  ON rewards FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM learning_sessions
    WHERE learning_sessions.id = rewards.session_id
      AND learning_sessions.child_id = auth.uid()
  ));


-- ======================
-- Fix 4: Parents can SELECT their children's rewards
-- ======================
CREATE POLICY "Parents can view children rewards"
  ON rewards FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM learning_sessions ls
    JOIN profiles child_profile ON child_profile.id = ls.child_id
    WHERE ls.id = rewards.session_id
      AND child_profile.parent_id = auth.uid()
  ));


-- ======================
-- Fix 5: Children can UPDATE (claim) their own rewards
-- ======================
CREATE POLICY "Children can claim own rewards"
  ON rewards FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM learning_sessions
    WHERE learning_sessions.id = rewards.session_id
      AND learning_sessions.child_id = auth.uid()
  ));


-- ======================
-- Fix 6: System/backend can INSERT rewards (via service role)
-- ======================
CREATE POLICY "Service role can insert rewards"
  ON rewards FOR INSERT
  WITH CHECK (true);
