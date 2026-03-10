-- ==============================================
-- Migration 005: Soft Delete for All Tables
-- Prevents RLS cascade issues with hard deletes
-- Run in Supabase SQL Editor
-- ==============================================

-- Add deleted_at to assigned_tasks
ALTER TABLE assigned_tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_at to subjects
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_at to lessons
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_at to quizzes
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- ============================================
-- Active Views (query these instead of tables)
-- ============================================
CREATE OR REPLACE VIEW active_tasks AS
  SELECT * FROM assigned_tasks WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_subjects AS
  SELECT * FROM subjects WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_lessons AS
  SELECT * FROM lessons WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_quizzes AS
  SELECT * FROM quizzes WHERE deleted_at IS NULL;

-- ============================================
-- RLS Policies: Hide soft-deleted content
-- ============================================
CREATE POLICY "Hide soft-deleted tasks"
  ON assigned_tasks FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Hide soft-deleted subjects"
  ON subjects FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Hide soft-deleted lessons"
  ON lessons FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Hide soft-deleted quizzes"
  ON quizzes FOR SELECT
  USING (deleted_at IS NULL);
