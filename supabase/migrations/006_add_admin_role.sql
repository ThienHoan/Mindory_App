-- ==============================================
-- Migration 006: Add 'admin' to user_role ENUM
-- + Idempotent RLS write policies for admin
-- Run in Supabase SQL Editor
-- ==============================================

-- 1. Add 'admin' to the ENUM (forward-only, see rollback notes below)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';

-- NOTE: ROLLBACK STRATEGY
-- ALTER TYPE ADD VALUE is forward-only and cannot be cleanly reverted.
-- If rollback is needed:
--   Step 1: UPDATE profiles SET role = 'parent' WHERE role = 'admin';
--   Step 2: Disable /admin routes in Express code (feature flag)
--   Step 3: Do NOT attempt to recreate type — keep the ENUM value unused instead.

-- ==============================================
-- 2. RLS Write Policies for Admin
-- Uses auth.jwt() -> 'app_metadata' ->> 'role' (matches backend claim path)
-- NOTE: Currently backend uses service_role_key which bypasses RLS.
-- These policies protect direct Supabase client calls (e.g. future frontend direct calls).
-- Idempotent: DROP IF EXISTS before CREATE
-- ==============================================

-- Subjects
DROP POLICY IF EXISTS "Admin can insert subjects" ON subjects;
DROP POLICY IF EXISTS "Admin can update subjects" ON subjects;
DROP POLICY IF EXISTS "Admin can delete subjects" ON subjects;

CREATE POLICY "Admin can insert subjects"
  ON subjects FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin can update subjects"
  ON subjects FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin can delete subjects"
  ON subjects FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Lessons
DROP POLICY IF EXISTS "Admin can insert lessons" ON lessons;
DROP POLICY IF EXISTS "Admin can update lessons" ON lessons;
DROP POLICY IF EXISTS "Admin can delete lessons" ON lessons;

CREATE POLICY "Admin can insert lessons"
  ON lessons FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin can update lessons"
  ON lessons FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin can delete lessons"
  ON lessons FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Quizzes
DROP POLICY IF EXISTS "Admin can insert quizzes" ON quizzes;
DROP POLICY IF EXISTS "Admin can update quizzes" ON quizzes;
DROP POLICY IF EXISTS "Admin can delete quizzes" ON quizzes;

CREATE POLICY "Admin can insert quizzes"
  ON quizzes FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin can update quizzes"
  ON quizzes FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admin can delete quizzes"
  ON quizzes FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
