-- Indexes for foreign keys and common queries
CREATE INDEX IF NOT EXISTS idx_profiles_parent_id ON profiles(parent_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

CREATE INDEX IF NOT EXISTS idx_lessons_subject_id ON lessons(subject_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id ON quizzes(lesson_id);

CREATE INDEX IF NOT EXISTS idx_assigned_tasks_child_id ON assigned_tasks(child_id);
CREATE INDEX IF NOT EXISTS idx_assigned_tasks_assigned_by ON assigned_tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_assigned_tasks_status ON assigned_tasks(status);

CREATE INDEX IF NOT EXISTS idx_learning_sessions_task_id ON learning_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_child_id ON learning_sessions(child_id);

CREATE INDEX IF NOT EXISTS idx_rewards_session_id ON rewards(session_id);
