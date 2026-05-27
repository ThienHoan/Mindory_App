-- ==============================================
-- Migration 007: Mini Game Sessions
-- ==============================================

CREATE TABLE IF NOT EXISTS mini_game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  score INT NOT NULL DEFAULT 0 CHECK (score >= 0),
  accuracy NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (accuracy >= 0 AND accuracy <= 100),
  duration_seconds INT NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  stars_earned INT NOT NULL DEFAULT 0 CHECK (stars_earned >= 0),
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE mini_game_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Children can view own mini game sessions" ON mini_game_sessions;
CREATE POLICY "Children can view own mini game sessions"
  ON mini_game_sessions FOR SELECT TO authenticated
  USING (child_id = auth.uid());

DROP POLICY IF EXISTS "Children can create own mini game sessions" ON mini_game_sessions;
CREATE POLICY "Children can create own mini game sessions"
  ON mini_game_sessions FOR INSERT TO authenticated
  WITH CHECK (child_id = auth.uid());

DROP POLICY IF EXISTS "Parents can view children mini game sessions" ON mini_game_sessions;
CREATE POLICY "Parents can view children mini game sessions"
  ON mini_game_sessions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = mini_game_sessions.child_id
      AND profiles.parent_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_mini_game_sessions_child_id ON mini_game_sessions(child_id);
CREATE INDEX IF NOT EXISTS idx_mini_game_sessions_game_id ON mini_game_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_mini_game_sessions_played_at ON mini_game_sessions(played_at DESC);
