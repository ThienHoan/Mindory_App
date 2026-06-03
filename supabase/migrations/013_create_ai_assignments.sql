-- Create assigned_ai_quizzes table for parent-assigned AI quizzes
CREATE TABLE IF NOT EXISTS assigned_ai_quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES pdf_documents(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  child_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'completed')),
  assigned_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  completed_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_assigned_ai_quizzes_parent_id ON assigned_ai_quizzes(parent_id);
CREATE INDEX IF NOT EXISTS idx_assigned_ai_quizzes_child_id ON assigned_ai_quizzes(child_id);
CREATE INDEX IF NOT EXISTS idx_assigned_ai_quizzes_document_id ON assigned_ai_quizzes(document_id);

-- Avoid duplicate active assignments per child/document/parent
CREATE UNIQUE INDEX IF NOT EXISTS idx_assigned_ai_quizzes_unique
  ON assigned_ai_quizzes(parent_id, child_id, document_id);

ALTER TABLE assigned_ai_quizzes ENABLE ROW LEVEL SECURITY;

-- Parents can manage their own AI assignments
CREATE POLICY "Parents can manage own ai assignments"
ON assigned_ai_quizzes
FOR ALL
TO authenticated
USING (parent_id = auth.uid());

-- Children can read their own assignments
CREATE POLICY "Children can view own ai assignments"
ON assigned_ai_quizzes
FOR SELECT
TO authenticated
USING (child_id = auth.uid());

-- Children can mark their own assignments completed
CREATE POLICY "Children can update own ai assignments"
ON assigned_ai_quizzes
FOR UPDATE
TO authenticated
USING (child_id = auth.uid());
