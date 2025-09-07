import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Layout/Header';
import AuthForm from './components/Auth/AuthForm';
import StudentDashboard from './components/Student/Dashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import ExamInterface from './components/Exam/ExamInterface';
import ExamResults from './components/Exam/ExamResults';

type AppView = 'dashboard' | 'exam' | 'results';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [currentExamMode, setCurrentExamMode] = useState<'practice' | 'mock_test' | 'learning'>('practice');
  const [currentExamId, setCurrentExamId] = useState<string>('');

  const handleStartExam = (mode: 'practice' | 'mock_test' | 'learning') => {
    setCurrentExamMode(mode);
    setCurrentView('exam');
  };

  const handleExamComplete = (examId: string) => {
    setCurrentExamId(examId);
    setCurrentView('results');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleRetakeExam = () => {
    setCurrentView('exam');
  };

  if (!user) {
    return <AuthForm />;
  }

  const renderContent = () => {
    if (currentView === 'exam') {
      return (
        <ExamInterface
          mode={currentExamMode}
          onExamComplete={handleExamComplete}
          onExit={handleBackToDashboard}
        />
      );
    }

    if (currentView === 'results') {
      return (
        <ExamResults
          examId={currentExamId}
          onRetakeExam={handleRetakeExam}
          onBackToDashboard={handleBackToDashboard}
        />
      );
    }

    // Dashboard view
    if (user.role === 'admin') {
      return <AdminDashboard />;
    } else {
      return <StudentDashboard onStartExam={handleStartExam} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {currentView === 'dashboard' && <Header />}
      {renderContent()}
      <Toaster position="top-right" />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;