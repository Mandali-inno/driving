import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  BarChart3, 
  Play, 
  Star,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Exam, Subscription } from '../../lib/supabase';
import { mockExams, mockSubscription } from '../../lib/mockData';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface DashboardProps {
  onStartExam: (mode: 'practice' | 'mock_test' | 'learning') => void;
}

const StudentDashboard: React.FC<DashboardProps> = ({ onStartExam }) => {
  const { user } = useAuth();
  const [recentExams, setRecentExams] = useState<Exam[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [stats, setStats] = useState({
    totalExams: 0,
    averageScore: 0,
    passedExams: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Check if using mock data
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes('your_supabase')) {
        // Use mock data
        setRecentExams(mockExams);
        setSubscription(mockSubscription);
        
        // Calculate mock stats
        const totalExams = mockExams.length;
        const averageScore = Math.round(mockExams.reduce((sum, exam) => sum + exam.score, 0) / totalExams);
        const passedExams = mockExams.filter(exam => exam.passed).length;
        
        setStats({ totalExams, averageScore, passedExams });
        setLoading(false);
        return;
      }
      
      // Fetch recent exams
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (examsError) throw examsError;
      setRecentExams(examsData || []);

      // Calculate stats
      if (examsData && examsData.length > 0) {
        const totalExams = examsData.length;
        const averageScore = examsData.reduce((sum, exam) => sum + exam.score, 0) / totalExams;
        const passedExams = examsData.filter(exam => exam.passed).length;
        
        setStats({ totalExams, averageScore: Math.round(averageScore), passedExams });
      }

      // Fetch subscription
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single();

      if (subscriptionData && !subscriptionError) {
        setSubscription(subscriptionData);
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const examModes = [
    {
      id: 'practice',
      title: 'Practice Mode',
      description: 'Unlimited questions with instant feedback',
      icon: BookOpen,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
    },
    {
      id: 'mock_test',
      title: 'Mock Test',
      description: '20 questions in 20 minutes - Real exam simulation',
      icon: Clock,
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
    },
    {
      id: 'learning',
      title: 'Learning Mode',
      description: 'Study with detailed explanations',
      icon: Star,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
    },
  ];

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.full_name}!
        </h1>
        <p className="text-gray-600">Ready to ace your driving test?</p>
      </motion.div>

      {/* Subscription Status */}
      {subscription && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8 bg-green-50 border border-green-200 rounded-xl p-4"
        >
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">Active Subscription</h3>
              <p className="text-sm text-green-600">
                {subscription.plan_type} plan
                {subscription.end_date && ` - expires ${format(new Date(subscription.end_date), 'MMM dd, yyyy')}`}
              </p>
            </div>
          </div>
        </motion.div>
      )}

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
              <p className="text-sm font-medium text-gray-600">Total Exams</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalExams}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-500" />
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
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-3xl font-bold text-gray-900">{stats.averageScore}%</p>
            </div>
            <Trophy className="h-8 w-8 text-yellow-500" />
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
              <p className="text-sm font-medium text-gray-600">Passed Exams</p>
              <p className="text-3xl font-bold text-gray-900">{stats.passedExams}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Exam Modes */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Choose Your Mode</h2>
          
          {examModes.map((mode, index) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${mode.color}`}>
                    <mode.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{mode.title}</h3>
                    <p className="text-sm text-gray-600">{mode.description}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onStartExam(mode.id as any)}
                  className={`${mode.color} ${mode.hoverColor} text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors`}
                >
                  <Play className="h-4 w-4" />
                  <span>Start</span>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Exams */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Exams</h2>
          
          {recentExams.length > 0 ? (
            <div className="space-y-4">
              {recentExams.map((exam, index) => (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 capitalize">
                          {exam.mode.replace('_', ' ')}
                        </h3>
                        {exam.passed && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span>Score: {exam.score}%</span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(exam.created_at), 'MMM dd')}</span>
                        </span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      exam.passed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {exam.passed ? 'Passed' : 'Failed'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No exams taken yet</p>
              <p className="text-sm text-gray-500">Start your first practice session!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;