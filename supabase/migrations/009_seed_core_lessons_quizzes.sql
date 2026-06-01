-- Seed minimal lessons and quizzes for grades 1-5 core subjects
-- Uses subject name + grade to find subject_id

-- Grade 1
INSERT INTO lessons (subject_id, title, description, pdf_url, total_pages)
SELECT s.id, 'Toán lớp 1: Số và đếm', 'Nhận biết số và đếm cơ bản', 'https://example.com/grade1_math_1.pdf', 3
FROM subjects s
WHERE s.name = 'Toán' AND s.grade = 1
AND NOT EXISTS (
    SELECT 1 FROM lessons l WHERE l.subject_id = s.id AND l.title = 'Toán lớp 1: Số và đếm'
);

INSERT INTO lessons (subject_id, title, description, pdf_url, total_pages)
SELECT s.id, 'Tiếng Việt lớp 1: Bảng chữ cái', 'Làm quen chữ cái và âm vần', 'https://example.com/grade1_viet_1.pdf', 3
FROM subjects s
WHERE s.name = 'Tiếng Việt' AND s.grade = 1
AND NOT EXISTS (
    SELECT 1 FROM lessons l WHERE l.subject_id = s.id AND l.title = 'Tiếng Việt lớp 1: Bảng chữ cái'
);

INSERT INTO lessons (subject_id, title, description, pdf_url, total_pages)
SELECT s.id, 'Tiếng Anh lớp 1: Alphabet', 'Nhận diện chữ cái tiếng Anh', 'https://example.com/grade1_eng_1.pdf', 2
FROM subjects s
WHERE s.name = 'Tiếng Anh' AND s.grade = 1
AND NOT EXISTS (
    SELECT 1 FROM lessons l WHERE l.subject_id = s.id AND l.title = 'Tiếng Anh lớp 1: Alphabet'
);

-- Grade 2
INSERT INTO lessons (subject_id, title, description, pdf_url, total_pages)
SELECT s.id, 'Toán lớp 2: Cộng trừ trong phạm vi 100', 'Luyện cộng trừ cơ bản', 'https://example.com/grade2_math_1.pdf', 3
FROM subjects s
WHERE s.name = 'Toán' AND s.grade = 2
AND NOT EXISTS (
    SELECT 1 FROM lessons l WHERE l.subject_id = s.id AND l.title = 'Toán lớp 2: Cộng trừ trong phạm vi 100'
);

INSERT INTO lessons (subject_id, title, description, pdf_url, total_pages)
SELECT s.id, 'Tiếng Việt lớp 2: Luyện đọc đoạn ngắn', 'Luyện đọc và hiểu câu', 'https://example.com/grade2_viet_1.pdf', 3
FROM subjects s
WHERE s.name = 'Tiếng Việt' AND s.grade = 2
AND NOT EXISTS (
    SELECT 1 FROM lessons l WHERE l.subject_id = s.id AND l.title = 'Tiếng Việt lớp 2: Luyện đọc đoạn ngắn'
);

INSERT INTO lessons (subject_id, title, description, pdf_url, total_pages)
SELECT s.id, 'Tiếng Anh lớp 2: Greetings', 'Chào hỏi và giới thiệu bản thân', 'https://example.com/grade2_eng_1.pdf', 2
FROM subjects s
WHERE s.name = 'Tiếng Anh' AND s.grade = 2
AND NOT EXISTS (
    SELECT 1 FROM lessons l WHERE l.subject_id = s.id AND l.title = 'Tiếng Anh lớp 2: Greetings'
);

-- Grade 3
INSERT INTO lessons (subject_id, title, description, pdf_url, total_pages)
SELECT s.id, 'Toán lớp 3: Bảng nhân chia', 'Luyện bảng nhân chia cơ bản', 'https://example.com/grade3_math_1.pdf', 4
FROM subjects s
WHERE s.name = 'Toán' AND s.grade = 3
AND NOT EXISTS (
    SELECT 1 FROM lessons l WHERE l.subject_id = s.id AND l.title = 'Toán lớp 3: Bảng nhân chia'
);

INSERT INTO lessons (subject_id, title, description, pdf_url, total_pages)
SELECT s.id, 'Tiếng Việt lớp 3: Tập làm văn ngắn', 'Viết đoạn văn 3-5 câu', 'https://example.com/grade3_viet_1.pdf', 3
FROM subjects s
WHERE s.name = 'Tiếng Việt' AND s.grade = 3
AND NOT EXISTS (
    SELECT 1 FROM lessons l WHERE l.subject_id = s.id AND l.title = 'Tiếng Việt lớp 3: Tập làm văn ngắn'
);

INSERT INTO lessons (subject_id, title, description, pdf_url, total_pages)
SELECT s.id, 'Tiếng Anh lớp 3: Numbers and Colors', 'Từ vựng số và màu sắc', 'https://example.com/grade3_eng_1.pdf', 2
FROM subjects s
WHERE s.name = 'Tiếng Anh' AND s.grade = 3
AND NOT EXISTS (
    SELECT 1 FROM lessons l WHERE l.subject_id = s.id AND l.title = 'Tiếng Anh lớp 3: Numbers and Colors'
);

-- Grade 4
INSERT INTO lessons (subject_id, title, description, pdf_url, total_pages)
SELECT s.id, 'Toán lớp 4: Phân số cơ bản', 'Làm quen khái niệm phân số', 'https://example.com/grade4_math_1.pdf', 4
FROM subjects s
WHERE s.name = 'Toán' AND s.grade = 4
AND NOT EXISTS (
    SELECT 1 FROM lessons l WHERE l.subject_id = s.id AND l.title = 'Toán lớp 4: Phân số cơ bản'
);

INSERT INTO lessons (subject_id, title, description, pdf_url, total_pages)
SELECT s.id, 'Tiếng Việt lớp 4: Chính tả', 'Luyện viết đúng chính tả', 'https://example.com/grade4_viet_1.pdf', 3
FROM subjects s
WHERE s.name = 'Tiếng Việt' AND s.grade = 4
AND NOT EXISTS (
    SELECT 1 FROM lessons l WHERE l.subject_id = s.id AND l.title = 'Tiếng Việt lớp 4: Chính tả'
);

INSERT INTO lessons (subject_id, title, description, pdf_url, total_pages)
SELECT s.id, 'Tiếng Anh lớp 4: Simple Sentences', 'Viết câu đơn đơn giản', 'https://example.com/grade4_eng_1.pdf', 2
FROM subjects s
WHERE s.name = 'Tiếng Anh' AND s.grade = 4
AND NOT EXISTS (
    SELECT 1 FROM lessons l WHERE l.subject_id = s.id AND l.title = 'Tiếng Anh lớp 4: Simple Sentences'
);

-- Grade 5
INSERT INTO lessons (subject_id, title, description, pdf_url, total_pages)
SELECT s.id, 'Toán lớp 5: Tỉ số phần trăm', 'Làm quen tỉ số phần trăm', 'https://example.com/grade5_math_1.pdf', 4
FROM subjects s
WHERE s.name = 'Toán' AND s.grade = 5
AND NOT EXISTS (
    SELECT 1 FROM lessons l WHERE l.subject_id = s.id AND l.title = 'Toán lớp 5: Tỉ số phần trăm'
);

INSERT INTO lessons (subject_id, title, description, pdf_url, total_pages)
SELECT s.id, 'Tiếng Việt lớp 5: Tập làm văn', 'Viết đoạn văn miêu tả', 'https://example.com/grade5_viet_1.pdf', 3
FROM subjects s
WHERE s.name = 'Tiếng Việt' AND s.grade = 5
AND NOT EXISTS (
    SELECT 1 FROM lessons l WHERE l.subject_id = s.id AND l.title = 'Tiếng Việt lớp 5: Tập làm văn'
);

INSERT INTO lessons (subject_id, title, description, pdf_url, total_pages)
SELECT s.id, 'Tiếng Anh lớp 5: Daily Routines', 'Mô tả thói quen hàng ngày', 'https://example.com/grade5_eng_1.pdf', 2
FROM subjects s
WHERE s.name = 'Tiếng Anh' AND s.grade = 5
AND NOT EXISTS (
    SELECT 1 FROM lessons l WHERE l.subject_id = s.id AND l.title = 'Tiếng Anh lớp 5: Daily Routines'
);

-- Quizzes
INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'Số nào lớn hơn 5?', '["6","3","4","5"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Toán' AND s.grade = 1 AND l.title = 'Toán lớp 1: Số và đếm'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'Số nào lớn hơn 5?'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'Đếm số quả táo: 1,2,3,?', '["4","5","6","7"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Toán' AND s.grade = 1 AND l.title = 'Toán lớp 1: Số và đếm'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'Đếm số quả táo: 1,2,3,?'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'Chữ cái nào đứng sau A?', '["B","C","D","E"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Việt' AND s.grade = 1 AND l.title = 'Tiếng Việt lớp 1: Bảng chữ cái'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'Chữ cái nào đứng sau A?'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'Chữ cái nào là nguyên âm?', '["A","B","C","D"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Việt' AND s.grade = 1 AND l.title = 'Tiếng Việt lớp 1: Bảng chữ cái'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'Chữ cái nào là nguyên âm?'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'Letter after B is?', '["C","D","E","F"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Anh' AND s.grade = 1 AND l.title = 'Tiếng Anh lớp 1: Alphabet'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'Letter after B is?'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'Which is a vowel?', '["A","B","C","D"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Anh' AND s.grade = 1 AND l.title = 'Tiếng Anh lớp 1: Alphabet'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'Which is a vowel?'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, '25 + 15 = ?', '["40","35","45","30"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Toán' AND s.grade = 2 AND l.title = 'Toán lớp 2: Cộng trừ trong phạm vi 100'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = '25 + 15 = ?'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, '60 - 18 = ?', '["42","48","38","50"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Toán' AND s.grade = 2 AND l.title = 'Toán lớp 2: Cộng trừ trong phạm vi 100'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = '60 - 18 = ?'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'Chọn từ đúng: em ___ sách', '["đọc","đỏ","đá","đi"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Việt' AND s.grade = 2 AND l.title = 'Tiếng Việt lớp 2: Luyện đọc đoạn ngắn'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'Chọn từ đúng: em ___ sách'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'Chọn từ đúng: con ___ kêu meo', '["mèo","mẹ","mẽ","mê"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Việt' AND s.grade = 2 AND l.title = 'Tiếng Việt lớp 2: Luyện đọc đoạn ngắn'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'Chọn từ đúng: con ___ kêu meo'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'How do you say "Xin chào"?', '["Hello","Goodbye","Thanks","Please"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Anh' AND s.grade = 2 AND l.title = 'Tiếng Anh lớp 2: Greetings'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'How do you say "Xin chào"?'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'I am ___ student.', '["a","an","the","to"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Anh' AND s.grade = 2 AND l.title = 'Tiếng Anh lớp 2: Greetings'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'I am ___ student.'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, '3 x 4 = ?', '["12","16","9","10"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Toán' AND s.grade = 3 AND l.title = 'Toán lớp 3: Bảng nhân chia'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = '3 x 4 = ?'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, '12 : 3 = ?', '["4","6","3","2"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Toán' AND s.grade = 3 AND l.title = 'Toán lớp 3: Bảng nhân chia'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = '12 : 3 = ?'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'Chọn câu đúng chính tả', '["Em đi học","Em đi hok","Em đi hộc","Em đi hox"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Việt' AND s.grade = 3 AND l.title = 'Tiếng Việt lớp 3: Tập làm văn ngắn'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'Chọn câu đúng chính tả'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'Chọn từ đúng: bầu trời ___', '["xanh","sanh","xan","xang"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Việt' AND s.grade = 3 AND l.title = 'Tiếng Việt lớp 3: Tập làm văn ngắn'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'Chọn từ đúng: bầu trời ___'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'Color of the sky?', '["Blue","Red","Green","Black"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Anh' AND s.grade = 3 AND l.title = 'Tiếng Anh lớp 3: Numbers and Colors'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'Color of the sky?'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'Number after 5?', '["6","7","8","9"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Anh' AND s.grade = 3 AND l.title = 'Tiếng Anh lớp 3: Numbers and Colors'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'Number after 5?'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'Phân số nào bằng 1/2?', '["2/4","1/3","3/5","2/3"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Toán' AND s.grade = 4 AND l.title = 'Toán lớp 4: Phân số cơ bản'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'Phân số nào bằng 1/2?'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'Phân số lớn hơn 1/2?', '["3/4","1/4","2/5","1/5"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Toán' AND s.grade = 4 AND l.title = 'Toán lớp 4: Phân số cơ bản'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'Phân số lớn hơn 1/2?'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'Chọn từ đúng: ___ tiếng chim hót', '["nghe","nge","ngê","ngey"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Việt' AND s.grade = 4 AND l.title = 'Tiếng Việt lớp 4: Chính tả'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'Chọn từ đúng: ___ tiếng chim hót'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'Chọn từ đúng: trời ___', '["mưa","mưae","mưaa","mưae"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Việt' AND s.grade = 4 AND l.title = 'Tiếng Việt lớp 4: Chính tả'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'Chọn từ đúng: trời ___'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'I ___ a book.', '["have","has","having","to have"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Anh' AND s.grade = 4 AND l.title = 'Tiếng Anh lớp 4: Simple Sentences'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'I ___ a book.'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'She ___ to school.', '["goes","go","going","gone"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Anh' AND s.grade = 4 AND l.title = 'Tiếng Anh lớp 4: Simple Sentences'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'She ___ to school.'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, '25% của 100 là?', '["25","20","30","40"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Toán' AND s.grade = 5 AND l.title = 'Toán lớp 5: Tỉ số phần trăm'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = '25% của 100 là?'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, '50% của 60 là?', '["30","25","40","20"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Toán' AND s.grade = 5 AND l.title = 'Toán lớp 5: Tỉ số phần trăm'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = '50% của 60 là?'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'Chọn từ đúng: ___ đẹp', '["cảnh","cảnhh","cãnh","cạnh"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Việt' AND s.grade = 5 AND l.title = 'Tiếng Việt lớp 5: Tập làm văn'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'Chọn từ đúng: ___ đẹp'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'Chọn câu đúng', '["Em yêu trường em","Em iu trường em","Em yêu trương em","Em yêu truong em"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Việt' AND s.grade = 5 AND l.title = 'Tiếng Việt lớp 5: Tập làm văn'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'Chọn câu đúng'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'I ___ up at 6.', '["wake","wakes","waking","woke"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Anh' AND s.grade = 5 AND l.title = 'Tiếng Anh lớp 5: Daily Routines'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'I ___ up at 6.'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'He ___ breakfast.', '["eats","eat","eating","eaten"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Anh' AND s.grade = 5 AND l.title = 'Tiếng Anh lớp 5: Daily Routines'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'He ___ breakfast.'
);
