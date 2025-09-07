import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  FileQuestion,
  BarChart3,
  Settings
} from 'lucide-react';
import { supabase, Question, Answer } from '../../lib/supabase';
import { mockQuestions } from '../../lib/mockData';
// import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const AdminDashboard: React.FC = () => {
  // const { user } = useAuth();
  const [questions, setQuestions] = useState<(Question & { answers: Answer[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalUsers: 0,
    totalExams: 0,
  });

  useEffect(() => {
    fetchQuestions();
    fetchStats();
  }, []);

  const fetchQuestions = async () => {
    try {
      // Check if using mock data
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('your_supabase')) {
        // Use mock data
        setQuestions(mockQuestions);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          answers (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Check if using mock data
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('your_supabase')) {
        // Use mock stats
        setStats({
          totalQuestions: mockQuestions.length,
          totalUsers: 25,
          totalExams: 150,
        });
        return;
      }
      
      const [questionsResult, usersResult, examsResult] = await Promise.all([
        supabase.from('questions').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('exams').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalQuestions: questionsResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalExams: examsResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    // Check if using mock data
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('your_supabase')) {
      toast.success('Question deleted successfully (demo mode)');
      return;
    }

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      toast.success('Question deleted successfully');
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('Failed to delete question');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage questions and monitor system performance</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Questions</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalQuestions}</p>
            </div>
            <FileQuestion className="h-8 w-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Exams</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalExams}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-yellow-500" />
          </div>
        </motion.div>
      </div>

      {/* Questions Management */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Questions Management</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddQuestion(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Question</span>
            </motion.button>
          </div>
        </div>

        <div className="p-6">
          {questions.length === 0 ? (
            <div className="text-center py-8">
              <FileQuestion className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No questions found</p>
              <p className="text-sm text-gray-500">Create your first question to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          question.category === 'road_sign' 
                            ? 'bg-blue-100 text-blue-800'
                            : question.category === 'road_rule'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {question.category.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {question.answers.length} answers
                        </span>
                      </div>
                      
                      <p className="font-medium text-gray-900 mb-2">
                        {question.question_text}
                      </p>
                      
                      <div className="space-y-1">
                        {question.answers.map((answer, answerIndex) => (
                          <div
                            key={answer.id}
                            className={`text-sm px-2 py-1 rounded ${
                              answer.is_correct 
                                ? 'bg-green-100 text-green-800 font-medium' 
                                : 'text-gray-600'
                            }`}
                          >
                            {String.fromCharCode(65 + answerIndex)}. {answer.answer_text}
                            {answer.is_correct && ' ✓'}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setEditingQuestion(question.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => deleteQuestion(question.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Question Modal would go here */}
      {(showAddQuestion || editingQuestion) && (
        <QuestionModal
          questionId={editingQuestion}
          onClose={() => {
            setShowAddQuestion(false);
            setEditingQuestion(null);
          }}
          onSave={() => {
            fetchQuestions();
            setShowAddQuestion(false);
            setEditingQuestion(null);
          }}
        />
      )}
    </div>
  );
};

// Question Modal Component
const QuestionModal: React.FC<{
  questionId: string | null;
  onClose: () => void;
  onSave: () => void;
}> = ({ questionId, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    question_text: '',
    category: 'general' as 'road_sign' | 'road_rule' | 'general',
    image_url: '',
    answers: [
      { answer_text: '', is_correct: false },
      { answer_text: '', is_correct: false },
      { answer_text: '', is_correct: false },
      { answer_text: '', is_correct: false },
    ],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (questionId) {
      fetchQuestion();
    }
  }, [questionId]);

  const fetchQuestion = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          answers (*)
        `)
        .eq('id', questionId)
        .single();

      if (error) throw error;

      setFormData({
        question_text: data.question_text,
        category: data.category,
        image_url: data.image_url || '',
        answers: data.answers.slice(0, 4).map((a: Answer) => ({
          answer_text: a.answer_text,
          is_correct: a.is_correct,
        })),
      });
    } catch (error) {
      console.error('Error fetching question:', error);
      toast.error('Failed to load question');
    }
  };

  const handleSave = async () => {
    // Validate form
    if (!formData.question_text.trim()) {
      toast.error('Question text is required');
      return;
    }

    if (formData.answers.some(a => !a.answer_text.trim())) {
      toast.error('All answer options are required');
      return;
    }

    if (!formData.answers.some(a => a.is_correct)) {
      toast.error('At least one correct answer is required');
      return;
    }

    setLoading(true);

    try {
      let questionData;
      
      if (questionId) {
        // Update existing question
        const { data, error } = await supabase
          .from('questions')
          .update({
            question_text: formData.question_text,
            category: formData.category,
            image_url: formData.image_url || null,
          })
          .eq('id', questionId)
          .select()
          .single();

        if (error) throw error;
        questionData = data;

        // Delete existing answers
        await supabase.from('answers').delete().eq('question_id', questionId);
      } else {
        // Create new question
        const { data, error } = await supabase
          .from('questions')
          .insert({
            question_text: formData.question_text,
            category: formData.category,
            image_url: formData.image_url || null,
            created_by: user?.id,
          })
          .select()
          .single();

        if (error) throw error;
        questionData = data;
      }

      // Insert answers
      const answersToInsert = formData.answers.map(answer => ({
        question_id: questionData.id,
        answer_text: answer.answer_text,
        is_correct: answer.is_correct,
      }));

      const { error: answersError } = await supabase
        .from('answers')
        .insert(answersToInsert);

      if (answersError) throw answersError;

      toast.success(questionId ? 'Question updated successfully' : 'Question created successfully');
      onSave();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  const updateAnswer = (index: number, field: 'answer_text' | 'is_correct', value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      answers: prev.answers.map((answer, i) => 
        i === index 
          ? { ...answer, [field]: value }
          : field === 'is_correct' && value === true
          ? { ...answer, is_correct: false } // Only one correct answer
          : answer
      ),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {questionId ? 'Edit Question' : 'Add New Question'}
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Text *
            </label>
            <textarea
              value={formData.question_text}
              onChange={(e) => setFormData(prev => ({ ...prev, question_text: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              rows={3}
              placeholder="Enter your question..."
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="general">General</option>
              <option value="road_sign">Road Sign</option>
              <option value="road_rule">Road Rule</option>
            </select>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL (optional)
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Answers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Answer Options *
            </label>
            <div className="space-y-3">
              {formData.answers.map((answer, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={answer.is_correct}
                    onChange={() => updateAnswer(index, 'is_correct', true)}
                    className="h-4 w-4 text-green-600"
                  />
                  <span className="text-sm font-medium text-gray-700 w-8">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <input
                    type="text"
                    value={answer.answer_text}
                    onChange={(e) => updateAnswer(index, 'answer_text', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder={`Answer option ${index + 1}`}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Select the radio button next to the correct answer
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : 'Save Question'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;