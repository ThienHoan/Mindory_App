-- Add grade/age for child profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grade INT CHECK (grade >= 1 AND grade <= 5);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age INT CHECK (age >= 3 AND age <= 15);

-- Seed core subjects for grades 1-5 (Toan, Tieng Viet, Tieng Anh)
WITH core_subjects AS (
    SELECT * FROM (VALUES
        ('Toán', 1),
        ('Tiếng Việt', 1),
        ('Tiếng Anh', 1),
        ('Toán', 2),
        ('Tiếng Việt', 2),
        ('Tiếng Anh', 2),
        ('Toán', 3),
        ('Tiếng Việt', 3),
        ('Tiếng Anh', 3),
        ('Toán', 4),
        ('Tiếng Việt', 4),
        ('Tiếng Anh', 4),
        ('Toán', 5),
        ('Tiếng Việt', 5),
        ('Tiếng Anh', 5)
    ) AS v(name, grade)
)
INSERT INTO subjects (name, grade)
SELECT name, grade
FROM core_subjects cs
WHERE NOT EXISTS (
    SELECT 1 FROM subjects s WHERE s.name = cs.name AND s.grade = cs.grade
);
