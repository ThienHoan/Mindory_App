-- Add more quiz variety for existing grade-5 core lessons
-- Safe to re-run thanks to NOT EXISTS checks.

-- English Grade 5: Daily Routines
INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'She ___ to school by bike every day.', '["goes","go","went","going"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Anh' AND s.grade = 5 AND l.title = 'Tiếng Anh lớp 5: Daily Routines'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'She ___ to school by bike every day.'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'I ___ my teeth after breakfast.', '["brush","brushes","brushed","brushing"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Anh' AND s.grade = 5 AND l.title = 'Tiếng Anh lớp 5: Daily Routines'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'I ___ my teeth after breakfast.'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'They ___ TV in the evening.', '["watch","watches","watched","watching"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Anh' AND s.grade = 5 AND l.title = 'Tiếng Anh lớp 5: Daily Routines'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'They ___ TV in the evening.'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'What time do you get up?', '["At six o''clock","In the kitchen","By bus","On Monday"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Anh' AND s.grade = 5 AND l.title = 'Tiếng Anh lớp 5: Daily Routines'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'What time do you get up?'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'He ___ homework after dinner.', '["does","do","did","doing"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Anh' AND s.grade = 5 AND l.title = 'Tiếng Anh lớp 5: Daily Routines'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'He ___ homework after dinner.'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'We ___ to bed at 9 p.m.', '["go","goes","went","going"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Anh' AND s.grade = 5 AND l.title = 'Tiếng Anh lớp 5: Daily Routines'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'We ___ to bed at 9 p.m.'
);

-- Math Grade 5: Percentages
INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, '50% of 200 equals ___', '["100","50","150","20"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Toán' AND s.grade = 5 AND l.title = 'Toán lớp 5: Tỉ số phần trăm'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = '50% of 200 equals ___'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, '25% of 80 equals ___', '["20","25","40","8"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Toán' AND s.grade = 5 AND l.title = 'Toán lớp 5: Tỉ số phần trăm'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = '25% of 80 equals ___'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, '10% of 350 equals ___', '["35","30","25","45"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Toán' AND s.grade = 5 AND l.title = 'Toán lớp 5: Tỉ số phần trăm'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = '10% of 350 equals ___'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, '30% of 90 equals ___', '["27","30","18","9"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Toán' AND s.grade = 5 AND l.title = 'Toán lớp 5: Tỉ số phần trăm'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = '30% of 90 equals ___'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, '120 is 60% of ___', '["200","180","240","160"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Toán' AND s.grade = 5 AND l.title = 'Toán lớp 5: Tỉ số phần trăm'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = '120 is 60% of ___'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, '75% of 40 equals ___', '["30","25","35","20"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Toán' AND s.grade = 5 AND l.title = 'Toán lớp 5: Tỉ số phần trăm'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = '75% of 40 equals ___'
);

-- Vietnamese Grade 5: Writing
INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'Từ nào viết đúng chính tả?', '["xinh xắn","xinh sắn","sinh xắn","xynh xắn"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Việt' AND s.grade = 5 AND l.title = 'Tiếng Việt lớp 5: Tập làm văn'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'Từ nào viết đúng chính tả?'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'Câu nào đủ chủ ngữ và vị ngữ?', '["Bạn Lan học bài.","Đang học bài.","Học bài chăm chỉ.","Bạn Lan chăm chỉ."]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Việt' AND s.grade = 5 AND l.title = 'Tiếng Việt lớp 5: Tập làm văn'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'Câu nào đủ chủ ngữ và vị ngữ?'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'Từ nào đồng nghĩa với "siêng năng"?', '["chăm chỉ","lười biếng","vụng về","ồn ào"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Việt' AND s.grade = 5 AND l.title = 'Tiếng Việt lớp 5: Tập làm văn'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'Từ nào đồng nghĩa với "siêng năng"?'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'Dấu câu phù hợp: "Em đi học___"', '[".",",","?",":"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Việt' AND s.grade = 5 AND l.title = 'Tiếng Việt lớp 5: Tập làm văn'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'Dấu câu phù hợp: "Em đi học___"'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'Từ nào là tính từ?', '["xanh","chạy","nhà","bút"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Việt' AND s.grade = 5 AND l.title = 'Tiếng Việt lớp 5: Tập làm văn'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'Từ nào là tính từ?'
);

INSERT INTO quizzes (lesson_id, question, options, correct_index)
SELECT l.id, 'Từ nào viết hoa đúng?', '["Hà Nội","hà nội","Hà nội","hà Nội"]'::jsonb, 0
FROM lessons l
JOIN subjects s ON s.id = l.subject_id
WHERE s.name = 'Tiếng Việt' AND s.grade = 5 AND l.title = 'Tiếng Việt lớp 5: Tập làm văn'
AND NOT EXISTS (
    SELECT 1 FROM quizzes q WHERE q.lesson_id = l.id AND q.question = 'Từ nào viết hoa đúng?'
);
