import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AuthPage } from './pages/auth/AuthPage';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';

// Layout simples para a Home (será expandido)
const HomePlaceholder = () => {
  const { signOut, user } = useAuth();
  return (
    <div className="min-h-screen bg-black text-white p-12 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-black mb-8">Bem-vindo, {user?.email}</h1>
      <p className="text-zinc-500 mb-8">O motor de IA está pronto para as tuas recomendações.</p>
      <button onClick={signOut} className="text-rose-500 font-bold hover:underline cursor-pointer">Sair</button>
    </div>
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
