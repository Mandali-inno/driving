import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  XCircle, 
  BarChart3, 
  Clock, 
  CheckCircle,
  RotateCcw,
  Home
} from 'lucide-react';
import { supabase, Exam, ExamResponse, Question, Answer } from '../../lib/supabase';
import { mockExams, mockQuestions } from '../../lib/mockData';
import { format } from 'date-fns';

interface ExamResultsProps {
  examId: string;
  onRetakeExam: () => void;
  onBackToDashboard: () => void;
}

const ExamResults: React.FC<ExamResultsProps> = ({ 
  examId, 
  onRetakeExam, 
  onBackToDashboard 
}) => {
  const [exam, setExam] = useState<Exam | null>(null);
  const [responses, setResponses] = useState<(ExamResponse & {
    question: Question;
    chosen_answer?: Answer;
  })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExamResults();
  }, [examId]);

  const fetchExamResults = async () => {
    try {
      // Check if using mock data
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('your_supabase')) {
        // Use mock data
        const mockExam = {
          id: examId,
          user_id: '1',
          mode: 'practice' as const,
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString(),
          score: 85,
          total_questions: 5,
          passed: true,
          created_at: new Date().toISOString(),
        };
        
        const mockResponses = mockQuestions.slice(0, 5).map((question, index) => ({
          id: `response-${index}`,
          exam_id: examId,
          question_id: question.id,
          chosen_answer_id: question.answers[Math.floor(Math.random() * question.answers.length)].id,
          is_correct: Math.random() > 0.3, // 70% correct rate
          created_at: new Date().toISOString(),
          question: question,
          chosen_answer: question.answers[0],
        }));
        
        setExam(mockExam);
        setResponses(mockResponses);
        setLoading(false);
        return;
      }
      
      // Fetch exam details
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError) throw examError;
      setExam(examData);

      // Fetch exam responses with questions and answers
      const { data: responsesData, error: responsesError } = await supabase
        .from('exam_responses')
        .select(`
          *,
          question:questions(*),
          chosen_answer:answers(*)
        `)
        .eq('exam_id', examId);

      if (responsesError) throw responsesError;
      setResponses(responsesData || []);

    } catch (error) {
      console.error('Error fetching exam results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const correctAnswers = responses.filter(r => r.is_correct).length;
  const totalQuestions = responses.length;
  const isPassed = exam.passed;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Results Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-center mb-8 p-8 rounded-2xl ${
            isPassed ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
          }`}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            {isPassed ? (
              <Trophy className="h-16 w-16 text-green-600 mx-auto mb-4" />
            ) : (
              <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`text-3xl font-bold mb-2 ${
              isPassed ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {isPassed ? 'Congratulations!' : 'Keep Trying!'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={`text-lg mb-6 ${
              isPassed ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {isPassed 
              ? 'You passed the exam! Well done on your preparation.'
              : 'Don\'t give up! Practice more and try again.'
            }
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <div className={`inline-block text-6xl font-bold mb-2 ${
              isPassed ? 'text-green-600' : 'text-red-600'
            }`}>
              {exam.score}%
            </div>
            <p className="text-gray-600">
              {correctAnswers} out of {totalQuestions} correct
            </p>
          </motion.div>
        </motion.div>

        {/* Exam Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Exam Details</span>
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Mode</p>
              <p className="font-semibold text-gray-900 capitalize">
                {exam.mode.replace('_', ' ')}
              </p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Score</p>
              <p className="font-semibold text-gray-900">{exam.score}%</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Questions</p>
              <p className="font-semibold text-gray-900">{totalQuestions}</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-semibold text-gray-900">
                {format(new Date(exam.created_at), 'MMM dd')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Question Review */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Review Your Answers</h2>
          
          <div className="space-y-6">
            {responses.map((response, index) => (
              <motion.div
                key={response.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className={`border-l-4 pl-4 py-3 ${
                  response.is_correct 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-red-400 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {response.is_correct ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="text-sm font-medium text-gray-600">
                        Question {index + 1}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        response.question.category === 'road_sign' 
                          ? 'bg-blue-100 text-blue-800'
                          : response.question.category === 'road_rule'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {response.question.category.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <p className="font-medium text-gray-900 mb-2">
                      {response.question.question_text}
                    </p>
                    
                    <p className="text-sm text-gray-600">
                      Your answer: <span className="font-medium">
                        {response.chosen_answer?.answer_text || 'Not answered'}
                      </span>
                    </p>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    response.is_correct 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {response.is_correct ? 'Correct' : 'Incorrect'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRetakeExam}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Try Again</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBackToDashboard}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default ExamResults;