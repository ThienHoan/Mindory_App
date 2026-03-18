-- Insert more lessons for Vietnamese and Science
-- Safe to re-run: explicit IDs with ON CONFLICT DO NOTHING

-- Vietnamese subject id: b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12
-- Science subject id:    c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13

INSERT INTO lessons (id, subject_id, title, description, pdf_url, total_pages)
VALUES
  ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Luyện đọc đoạn văn ngắn', 'Rèn kỹ năng đọc trôi chảy và ngắt nghỉ đúng', 'https://example.com/vietnamese_lesson_2.pdf', 4),
  ('f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Mở rộng vốn từ theo chủ đề gia đình', 'Nhận biết và sử dụng từ ngữ về gia đình trong câu', 'https://example.com/vietnamese_lesson_3.pdf', 5),
  ('f3eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Viết câu kể đơn giản', 'Luyện viết câu đủ chủ ngữ và vị ngữ', 'https://example.com/vietnamese_lesson_4.pdf', 4),
  ('f4eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Vòng đời của cây', 'Quan sát các giai đoạn phát triển từ hạt đến cây trưởng thành', 'https://example.com/science_lesson_2.pdf', 5),
  ('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Động vật ăn gì?', 'Phân loại động vật theo thức ăn: ăn cỏ, ăn thịt, ăn tạp', 'https://example.com/science_lesson_3.pdf', 4),
  ('f6eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Không khí và vai trò của không khí', 'Hiểu vì sao con người, động vật, cây cối cần không khí', 'https://example.com/science_lesson_4.pdf', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO quizzes (id, lesson_id, question, options, correct_index)
VALUES
  ('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'Khi đọc thành tiếng, em cần làm gì?', '["Đọc rõ ràng, ngắt nghỉ đúng", "Đọc thật nhanh", "Bỏ qua dấu câu", "Đọc thật nhỏ"]'::jsonb, 0),
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a32', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'Dấu chấm dùng để làm gì?', '["Kết thúc câu", "Nối hai câu", "Hỏi", "Ra lệnh"]'::jsonb, 0),
  ('a3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Từ nào thuộc chủ đề gia đình?', '["Bố", "Bàn", "Xe đạp", "Đường phố"]'::jsonb, 0),
  ('a4eebc99-9c0b-4ef8-bb6d-6bb9bd380a34', 'f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Câu nào dùng từ đúng?', '["Mẹ em rất hiền", "Mẹ em rất chạy", "Mẹ em rất bàn", "Mẹ em rất sách"]'::jsonb, 0),
  ('a5eebc99-9c0b-4ef8-bb6d-6bb9bd380a35', 'f3eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'Câu kể cần có gì?', '["Chủ ngữ và vị ngữ", "Chỉ cần một từ", "Chỉ cần dấu hỏi", "Chỉ cần động từ"]'::jsonb, 0),
  ('a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a36', 'f3eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'Câu nào là câu kể?', '["Em đi học.", "Bạn đi đâu?", "Ôi đẹp quá!", "Đi nhanh lên!"]'::jsonb, 0),
  ('a7eebc99-9c0b-4ef8-bb6d-6bb9bd380a37', 'f4eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 'Thứ tự vòng đời của cây là gì?', '["Hạt - nảy mầm - cây non - cây trưởng thành", "Cây trưởng thành - hạt - nảy mầm", "Hoa - lá - rễ", "Rễ - hạt - cây non"]'::jsonb, 0),
  ('a8eebc99-9c0b-4ef8-bb6d-6bb9bd380a38', 'f4eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 'Bộ phận nào hút nước cho cây?', '["Rễ", "Lá", "Hoa", "Quả"]'::jsonb, 0),
  ('a9eebc99-9c0b-4ef8-bb6d-6bb9bd380a39', 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 'Động vật ăn cỏ là:', '["Trâu", "Hổ", "Mèo", "Đại bàng"]'::jsonb, 0),
  ('aaeebc99-9c0b-4ef8-bb6d-6bb9bd380a3a', 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 'Gà thuộc nhóm nào?', '["Ăn tạp", "Ăn cỏ", "Ăn thịt", "Không ăn"]'::jsonb, 0),
  ('abeebc99-9c0b-4ef8-bb6d-6bb9bd380a3b', 'f6eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 'Con người cần không khí để:', '["Hô hấp", "Ngủ", "Ăn", "Viết"]'::jsonb, 0),
  ('aceebc99-9c0b-4ef8-bb6d-6bb9bd380a3c', 'f6eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 'Không khí có ở đâu?', '["Khắp xung quanh chúng ta", "Chỉ trong nhà", "Chỉ ngoài đường", "Chỉ ở rừng"]'::jsonb, 0)
ON CONFLICT (id) DO NOTHING;
