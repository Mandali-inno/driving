import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  ArrowLeft,
  Flag,
  BarChart3
} from 'lucide-react';
// import { useAuth } from '../../contexts/AuthContext';
import { supabase, Question, Answer, Exam } from '../../lib/supabase';
import { mockQuestions, mockUsers } from '../../lib/mockData';
import toast from 'react-hot-toast';

interface ExamInterfaceProps {
  mode: 'practice' | 'mock_test' | 'learning';
  onExamComplete: (examId: string) => void;
  onExit: () => void;
}

const ExamInterface: React.FC<ExamInterfaceProps> = ({ mode, onExamComplete, onExit }) => {
  // const { user } = useAuth();
  const user = mockUsers[0]; // Mock user for testing
  const [questions, setQuestions] = useState<(Question & { answers: Answer[] })[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(mode === 'mock_test' ? 20 * 60 : 0); // 20 minutes for mock test
  const [examId, setExamId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    fetchQuestions();
    createExamSession();
  }, []);

  useEffect(() => {
    if (mode === 'mock_test' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, mode]);

  const fetchQuestions = async () => {
    try {
      // Check if using mock data
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('your_supabase')) {
        // Use mock data
        const questionsToUse = mode === 'mock_test' 
          ? mockQuestions.slice(0, Math.min(20, mockQuestions.length))
          : mockQuestions.slice(0, Math.min(10, mockQuestions.length));
        
        // Shuffle questions and answers
        const shuffledQuestions = questionsToUse.map(q => ({
          ...q,
          answers: q.answers?.sort(() => Math.random() - 0.5) || []
        })).sort(() => Math.random() - 0.5);
        
        setQuestions(shuffledQuestions);
        setLoading(false);
        return;
      }
      
      let query = supabase
        .from('questions')
        .select(`
          *,
          answers (*)
        `);

      if (mode === 'mock_test') {
        query = query.limit(20);
      } else {
        query = query.limit(10);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Shuffle questions and answers
      const shuffledQuestions = data?.map(q => ({
        ...q,
        answers: q.answers?.sort(() => Math.random() - 0.5) || []
      })).sort(() => Math.random() - 0.5) || [];

      setQuestions(shuffledQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const createExamSession = async () => {
    try {
      // Check if using mock data
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('your_supabase')) {
        // Use mock exam ID
        setExamId('mock-exam-' + Date.now());
        return;
      }
      
      const { data, error } = await supabase
        .from('exams')
        .insert({
          user_id: user?.id,
          mode,
          total_questions: mode === 'mock_test' ? 20 : 10,
        })
        .select()
        .single();

      if (error) throw error;
      setExamId(data.id);
    } catch (error) {
      console.error('Error creating exam session:', error);
      toast.error('Failed to start exam');
    }
  };

  const handleAnswerSelect = (answerId: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answerId,
    }));

    if (mode === 'learning') {
      setShowExplanation(true);
    }
  };

  const handleNextQuestion = async () => {
    if (mode !== 'learning') {
      await saveResponse();
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowExplanation(false);
    } else {
      handleSubmitExam();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setShowExplanation(false);
    }
  };

  const saveResponse = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    const selectedAnswerId = selectedAnswers[currentQuestion.id];

    if (!selectedAnswerId) return;
    
    // Check if using mock data
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('your_supabase')) {
      // Skip saving for mock data
      return;
    }

    const correctAnswer = currentQuestion.answers.find(a => a.is_correct);
    const isCorrect = selectedAnswerId === correctAnswer?.id;

    try {
      await supabase.from('exam_responses').insert({
        exam_id: examId,
        question_id: currentQuestion.id,
        chosen_answer_id: selectedAnswerId,
        is_correct: isCorrect,
      });
    } catch (error) {
      console.error('Error saving response:', error);
    }
  };

  const handleSubmitExam = async () => {
    try {
      // Save current response if not in learning mode
      if (mode !== 'learning') {
        await saveResponse();
      }

      // Calculate score
      const responses = Object.keys(selectedAnswers);
      let correctCount = 0;

      responses.forEach(questionId => {
        const question = questions.find(q => q.id === questionId);
        const selectedAnswerId = selectedAnswers[questionId];
        const correctAnswer = question?.answers.find(a => a.is_correct);
        
        if (selectedAnswerId === correctAnswer?.id) {
          correctCount++;
        }
      });

      const score = Math.round((correctCount / questions.length) * 100);
      const passed = score >= 70; // 70% passing grade

      // Check if using mock data
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('your_supabase')) {
        // Skip database update for mock data
        toast.success(`Exam completed! Score: ${score}%`);
        onExamComplete(examId);
        return;
      }

      // Update exam with results
      await supabase
        .from('exams')
        .update({
          end_time: new Date().toISOString(),
          score,
          passed,
        })
        .eq('id', examId);

      toast.success(`Exam completed! Score: ${score}%`);
      onExamComplete(examId);
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast.error('Failed to submit exam');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswerId = selectedAnswers[currentQuestion?.id];
  const correctAnswer = currentQuestion?.answers.find(a => a.is_correct);
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900 capitalize">
                {mode.replace('_', ' ')}
              </h1>
              <span className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {mode === 'mock_test' && (
                <div className="flex items-center space-x-2 text-red-600">
                  <Clock className="h-5 w-5" />
                  <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
                </div>
              )}
              
              <button
                onClick={onExit}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Exit
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-green-600 h-2 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            {/* Question */}
            <div className="mb-8">
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {currentQuestion?.category.replace('_', ' ')}
                </div>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mt-4 leading-relaxed">
                {currentQuestion?.question_text}
              </h2>
              
              {currentQuestion?.image_url && (
                <motion.img
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={currentQuestion.image_url}
                  alt="Question illustration"
                  className="mt-6 max-w-md mx-auto rounded-lg shadow-md"
                />
              )}
            </div>

            {/* Answer Options */}
            <div className="space-y-4">
              {currentQuestion?.answers.map((answer, index) => {
                const isSelected = selectedAnswerId === answer.id;
                const isCorrect = answer.is_correct;
                const showResult = mode === 'learning' && showExplanation;
                
                let buttonClass = 'w-full text-left p-4 border-2 rounded-xl transition-all hover:shadow-md ';
                
                if (isSelected && !showResult) {
                  buttonClass += 'border-green-500 bg-green-50';
                } else if (showResult) {
                  if (isCorrect) {
                    buttonClass += 'border-green-500 bg-green-50';
                  } else if (isSelected && !isCorrect) {
                    buttonClass += 'border-red-500 bg-red-50';
                  } else {
                    buttonClass += 'border-gray-200 bg-gray-50';
                  }
                } else {
                  buttonClass += 'border-gray-200 hover:border-green-300';
                }

                return (
                  <motion.button
                    key={answer.id}
                    whileHover={{ scale: showResult ? 1 : 1.01 }}
                    whileTap={{ scale: showResult ? 1 : 0.99 }}
                    onClick={() => !showResult && handleAnswerSelect(answer.id)}
                    disabled={showResult}
                    className={buttonClass}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                        isSelected && !showResult
                          ? 'border-green-500 bg-green-500 text-white'
                          : showResult && isCorrect
                          ? 'border-green-500 bg-green-500 text-white'
                          : showResult && isSelected && !isCorrect
                          ? 'border-red-500 bg-red-500 text-white'
                          : 'border-gray-300'
                      }`}>
                        {showResult ? (
                          isCorrect ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : isSelected && !isCorrect ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            String.fromCharCode(65 + index)
                          )
                        ) : (
                          String.fromCharCode(65 + index)
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{answer.answer_text}</p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation for Learning Mode */}
            {mode === 'learning' && showExplanation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl"
              >
                <h3 className="font-semibold text-blue-900 mb-2">Explanation</h3>
                <p className="text-blue-800">
                  The correct answer is: <strong>{correctAnswer?.answer_text}</strong>
                </p>
              </motion.div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Flag className="h-4 w-4" />
                <span>{Object.keys(selectedAnswers).length} answered</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNextQuestion}
                disabled={!selectedAnswerId && mode !== 'learning'}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>
                  {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
                </span>
                {currentQuestionIndex === questions.length - 1 ? (
                  <BarChart3 className="h-4 w-4" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ExamInterface;