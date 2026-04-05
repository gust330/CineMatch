import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useToast } from '../../components/Toast';
import { motion } from 'framer-motion';
import { Clapperboard, LogIn } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
          console.log('Login efetuado com sucesso!', data.session);
          window.location.href = '/'; // Redirecionamento forçado para garantir a atualização do estado
        }
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        showToast('Verifique o seu email para confirmar o registo!', 'info');
      }
    } catch (err: any) {
      console.error('Erro detalhado de Auth:', err);
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden p-6">
      {/* Background Glows (UI PRO MAX Style) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/5 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-card p-8 rounded-[2.5rem] relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-teal-500 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(20,184,166,0.3)] mb-4">
            <Clapperboard className="text-black w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2">CineMatch</h1>
          <p className="text-zinc-500 text-sm font-medium text-center">
            {isLogin ? 'Bem-vindo de volta ao seu cinema pessoal.' : 'Descubra a sua próxima obsessão cinematográfica.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <Input 
            label="Email"
            placeholder="nome@email.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input 
            label="Palavra-passe"
            placeholder="••••••••"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-rose-500 text-xs font-bold bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
              {error}
            </p>
          )}

          <Button 
            type="submit" 
            variant="glow" 
            className="w-full py-4 text-lg"
            isLoading={loading}
          >
            {isLogin ? 'Entrar' : 'Criar Conta'}
            <LogIn className="ml-2 w-5 h-5" />
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-zinc-400 text-sm hover:text-teal-400 transition-colors font-semibold"
          >
            {isLogin ? 'Novo por aqui? Criar conta' : 'Já tens conta? Entrar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
