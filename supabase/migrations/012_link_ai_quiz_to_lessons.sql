-- Link AI-generated PDF quiz suggestions to the normal lesson quiz flow.
ALTER TABLE pdf_documents
  ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL;

ALTER TABLE pdf_questions
  ADD COLUMN IF NOT EXISTS quiz_id UUID REFERENCES quizzes(id) ON DELETE SET NULL;

ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual' CHECK (source_type IN ('manual', 'ai_pdf')),
  ADD COLUMN IF NOT EXISTS source_pdf_question_id UUID REFERENCES pdf_questions(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_quizzes_source_pdf_question_id
  ON quizzes(source_pdf_question_id)
  WHERE source_pdf_question_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pdf_documents_lesson_id ON pdf_documents(lesson_id);
CREATE INDEX IF NOT EXISTS idx_pdf_questions_quiz_id ON pdf_questions(quiz_id);
