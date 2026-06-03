-- Store lesson PDFs in a private Supabase Storage bucket.
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-pdfs', 'lesson-pdfs', false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS pdf_path TEXT;

COMMENT ON COLUMN lessons.pdf_path IS 'Path inside the lesson-pdfs storage bucket. Keep pdf_url for legacy external URLs.';
