ALTER TABLE assigned_ai_quizzes
  DROP CONSTRAINT IF EXISTS assigned_ai_quizzes_status_check;

ALTER TABLE assigned_ai_quizzes
  ADD CONSTRAINT assigned_ai_quizzes_status_check
  CHECK (status IN ('assigned', 'completed', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_assigned_ai_quizzes_active_child
  ON assigned_ai_quizzes(child_id, status)
  WHERE status <> 'cancelled';
