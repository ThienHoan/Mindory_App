-- Add ADHD-friendly task policy fields and session metrics.

ALTER TABLE assigned_tasks
  ADD COLUMN IF NOT EXISTS focus_interval_seconds INT DEFAULT 300,
  ADD COLUMN IF NOT EXISTS break_seconds INT DEFAULT 30,
  ADD COLUMN IF NOT EXISTS game_break_seconds INT DEFAULT 45,
  ADD COLUMN IF NOT EXISTS allow_game_break BOOLEAN DEFAULT TRUE;

ALTER TABLE learning_sessions
  ADD COLUMN IF NOT EXISTS active_seconds INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS idle_seconds INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS study_seconds INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quiz_seconds INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS break_seconds INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS game_break_seconds INT DEFAULT 0;
