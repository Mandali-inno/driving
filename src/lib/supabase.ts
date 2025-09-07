import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface User {
  id: string;
  full_name: string;
  email?: string;
  phone_number: string;
  role: 'student' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  question_text: string;
  image_url?: string;
  category: 'road_sign' | 'road_rule' | 'general';
  created_by?: string;
  created_at: string;
  answers?: Answer[];
}

export interface Answer {
  id: string;
  question_id: string;
  answer_text: string;
  image_url?: string;
  is_correct: boolean;
  created_at: string;
}

export interface Exam {
  id: string;
  user_id: string;
  mode: 'practice' | 'mock_test' | 'learning';
  start_time: string;
  end_time?: string;
  score: number;
  total_questions: number;
  passed: boolean;
  created_at: string;
}

export interface ExamResponse {
  id: string;
  exam_id: string;
  question_id: string;
  chosen_answer_id?: string;
  is_correct?: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'weekly' | 'monthly' | 'quarterly' | 'lifetime';
  start_date: string;
  end_date?: string;
  status: 'active' | 'expired' | 'cancelled';
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  subscription_id?: string;
  amount: number;
  payment_method: 'MTN_MoMo' | 'Airtel_Money';
  transaction_ref: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}