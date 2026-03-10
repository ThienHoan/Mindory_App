-- Migration 004: Add soft delete support for profiles
-- Run in Supabase SQL Editor

-- Add deleted_at column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Update the children GET query: filter out soft-deleted profiles
-- (The backend code uses .is('deleted_at', null) filter)

-- RLS: Prevent soft-deleted users from logging in via supabase
-- Note: Auth users still exist but profiles are hidden from queries
CREATE POLICY "Hide soft-deleted profiles"
  ON profiles FOR SELECT
  USING (deleted_at IS NULL OR auth.uid() = id);
