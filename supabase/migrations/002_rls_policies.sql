-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assigned_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
-- Subjects/Lessons/Quizzes are public read, admin write
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- FUNCTION: Handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', (new.raw_user_meta_data->>'role')::user_role);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER: on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- POLICIES: Profiles
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Parents can view their children" 
  ON profiles FOR SELECT 
  USING (parent_id = auth.uid());

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- POLICIES: Subjects/Lessons/Quizzes (Read-only for all auth users)
CREATE POLICY "Authenticated users can view subjects" 
  ON subjects FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can view lessons" 
  ON lessons FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can view quizzes" 
  ON quizzes FOR SELECT 
  TO authenticated 
  USING (true);

-- POLICIES: Assigned Tasks
CREATE POLICY "Parents can view all tasks" 
  ON assigned_tasks FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = assigned_tasks.child_id 
    AND profiles.parent_id = auth.uid()
  ));

CREATE POLICY "Parents can manage tasks" 
  ON assigned_tasks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = assigned_tasks.child_id 
    AND profiles.parent_id = auth.uid()
  ));

CREATE POLICY "Children can view own tasks" 
  ON assigned_tasks FOR SELECT 
  USING (child_id = auth.uid());

-- POLICIES: Learning Sessions
CREATE POLICY "Parents can view sessions" 
  ON learning_sessions FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = learning_sessions.child_id 
    AND profiles.parent_id = auth.uid()
  ));

CREATE POLICY "Children can view and create sessions" 
  ON learning_sessions FOR ALL 
  USING (child_id = auth.uid());
