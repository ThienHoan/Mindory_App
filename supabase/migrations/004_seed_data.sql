-- Insert Subjects
INSERT INTO subjects (id, name, grade) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Toán Học', 4),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Tiếng Việt', 4),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Khoa Học', 4);

-- Insert Lessons for Math
INSERT INTO lessons (id, subject_id, title, description, pdf_url, total_pages) VALUES
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Phép cộng có nhớ', 'Bài học về phép cộng các số tự nhiên có nhớ', 'https://example.com/math_lesson_1.pdf', 3),
('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Phép trừ có nhớ', 'Bài học về phép trừ các số tự nhiên có nhớ', 'https://example.com/math_lesson_2.pdf', 3);

-- Insert Quizzes for Math Lesson 1
INSERT INTO quizzes (lesson_id, question, options, correct_index) VALUES
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Kết quả của 125 + 348 là bao nhiêu?', '["473", "573", "463", "563"]'::jsonb, 0),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Khi cộng có nhớ, ta cần làm gì?', '["Cộng dồn vào hàng tiếp theo", "Trừ đi ở hàng tiếp theo", "Bỏ qua", "Viết số 0"]'::jsonb, 0);

