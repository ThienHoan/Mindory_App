-- Create pdf_documents table
CREATE TABLE pdf_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create pdf_questions table
CREATE TABLE pdf_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES pdf_documents(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INT NOT NULL CHECK (correct_index >= 0 AND correct_index < 4),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Setup RLS for pdf_documents
ALTER TABLE pdf_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage their own pdf documents"
ON pdf_documents
FOR ALL
TO authenticated
USING (parent_id = auth.uid());

-- Setup RLS for pdf_questions
ALTER TABLE pdf_questions ENABLE ROW LEVEL SECURITY;

-- Parents can manage questions for their documents
CREATE POLICY "Parents can manage their document questions"
ON pdf_questions
FOR ALL
TO authenticated
USING (
  document_id IN (
    SELECT id FROM pdf_documents WHERE parent_id = auth.uid()
  )
);

-- Children (or public) can read approved questions (we will allow public for now, or authenticated)
CREATE POLICY "Anyone can read approved questions"
ON pdf_questions
FOR SELECT
TO authenticated
USING (status = 'approved');

-- Create storage bucket for PDFs if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdfs', 'pdfs', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
TO public 
USING ( bucket_id = 'pdfs' );

CREATE POLICY "Authenticated users can upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'pdfs' );

CREATE POLICY "Users can update their own uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'pdfs' AND auth.uid() = owner );

CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'pdfs' AND auth.uid() = owner );
