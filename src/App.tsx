import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AuthPage } from './pages/auth/AuthPage';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';
import { MainLayout } from './layouts/MainLayout';

// Mock Home Page (Next to be implemented)
const HomePlaceholder = () => {
  const { user } = useAuth();
  return (
    <MainLayout>
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center shadow-glow">
            <span className="text-black text-xs font-black">AI</span>
          </div>
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-teal-400">Recomendações para ti</span>
        </div>
        <h1 className="text-6xl font-black tracking-tighter mb-4 leading-none">
          O teu Cinema <span className="text-teal-400">Puro</span>.
        </h1>
        <p className="text-zinc-500 text-lg max-w-2xl font-medium">
          A analisar os teus gostos recentes para sugerir a tua próxima obsessão...
        </p>
      </header>
      
      {/* Grid Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="aspect-[2/3] rounded-[2rem] bg-zinc-900 animate-pulse border border-white/5 flex flex-col items-center justify-center text-zinc-800">
            <span className="text-xs font-black uppercase tracking-widest">A carregar...</span>
          </div>
        ))}
      </div>
    </MainLayout>
  );
};

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-teal-500 font-black animate-pulse">CineMatch...</div>;
  if (!user) return <Navigate to="/auth" />;
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/onboarding" element={<PrivateRoute><OnboardingPage /></PrivateRoute>} />
          <Route path="/" element={<PrivateRoute><HomePlaceholder /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
