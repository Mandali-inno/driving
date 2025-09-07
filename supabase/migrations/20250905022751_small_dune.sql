/*
  # Rwanda Driving Test Database Schema

  1. New Tables
    - `users` - Student and admin information with phone authentication
    - `questions` - Exam questions with category and image support
    - `answers` - Multiple choice answers linked to questions
    - `exams` - Mock/real exam session records
    - `exam_responses` - Student answers during exam attempts
    - `subscriptions` - Paid access periods tracking
    - `payments` - Mobile money transaction records

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Students can only access their own data
    - Admins can manage questions and view all data

  3. Features
    - Support for questions with images
    - Multiple exam modes (practice, mock_test, learning)
    - Mobile money payment integration (MTN MoMo, Airtel Money)
    - Subscription management with different plan types
    - Comprehensive exam response tracking
*/

-- Users table with role-based access
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE,
  phone_number text UNIQUE NOT NULL,
  role text DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Questions table for exam content
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  image_url text,
  category text NOT NULL CHECK (category IN ('road_sign', 'road_rule', 'general')),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Answers table for multiple choice options
CREATE TABLE IF NOT EXISTS answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_text text NOT NULL,
  image_url text,
  is_correct boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Exams table for test sessions
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  mode text NOT NULL CHECK (mode IN ('practice', 'mock_test', 'learning')),
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  score integer DEFAULT 0,
  total_questions integer DEFAULT 0,
  passed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Exam responses for tracking student answers
CREATE TABLE IF NOT EXISTS exam_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id),
  chosen_answer_id uuid REFERENCES answers(id),
  is_correct boolean,
  created_at timestamptz DEFAULT now()
);

-- Subscriptions table for access management
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  plan_type text NOT NULL CHECK (plan_type IN ('weekly', 'monthly', 'quarterly', 'lifetime')),
  start_date date NOT NULL,
  end_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Payments table for mobile money transactions
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  subscription_id uuid REFERENCES subscriptions(id),
  amount decimal(10,2) NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('MTN_MoMo', 'Airtel_Money')),
  transaction_ref text UNIQUE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for questions (admins can manage, students can read)
CREATE POLICY "Anyone can read questions" ON questions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage questions" ON questions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- RLS Policies for answers (linked to questions)
CREATE POLICY "Anyone can read answers" ON answers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage answers" ON answers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- RLS Policies for exams (users can only access their own)
CREATE POLICY "Users can manage own exams" ON exams
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for exam responses
CREATE POLICY "Users can manage own exam responses" ON exam_responses
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exams 
      WHERE exams.id = exam_responses.exam_id AND exams.user_id = auth.uid()
    )
  );

-- RLS Policies for subscriptions
CREATE POLICY "Users can read own subscriptions" ON subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions" ON subscriptions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- RLS Policies for payments
CREATE POLICY "Users can read own payments" ON payments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payments" ON payments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_exams_user_id ON exams(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_responses_exam_id ON exam_responses(exam_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);