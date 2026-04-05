import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { MainLayout } from '../layouts/MainLayout';
import { Button } from '../components/Button';
import { useToast } from '../components/Toast';
import { User, Mail, LogOut, Trash2, BarChart3, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileStats {
  totalWatched: number;
  totalWatchlist: number;
  avgRating: number;
  topGenre?: string;
}

interface ProfileStats {
  totalWatched: number;
  totalWatchlist: number;
  avgRating: number;
  topGenre?: string;
}

export const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<ProfileStats>({ totalWatched: 0, totalWatchlist: 0, avgRating: 0 });
  const { showToast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    if (!user) return;
    
    try {
      // Get watched count
      const { data: watched } = await supabase
        .from('watched_items')
        .select('rating')
        .eq('user_id', user.id);
      
        const watchedCount = watched?.length || 0;
        const avgRating = watchedCount > 0 && watched
        ? Math.round(watched.reduce((sum: number, item: any) => sum + (item.rating || 0), 0) / watchedCount * 10) / 10
        : 0;

      // Get watchlist count
      const { count: watchlistCount } = await supabase
        .from('watchlist_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setStats({
        totalWatched: watchedCount,
        totalWatchlist: watchlistCount || 0,
        avgRating
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const handleDeleteAllData = async () => {
    const confirmDelete = confirm('ATENÇÃO: Esta ação vai APAGAR TODOS os teus dados (histórico, watchlist). Esta ação é IRREVERSÍVEL. Tens a certeza?');
    
    if (confirmDelete) {
      const doubleConfirm = confirm('Tens mesmo a certeza? Todos os teus dados serão eliminados permanentemente.');
      
      if (doubleConfirm && user) {
        await supabase.from('watched_items').delete().eq('user_id', user.id);
        await supabase.from('watchlist_items').delete().eq('user_id', user.id);
        await supabase.from('rejected_suggestions').delete().eq('user_id', user.id);
        showToast('Todos os dados foram eliminados.');
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/auth';
  };

  return (
    <MainLayout>
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-glow"
          >
            <User className="text-black w-7 h-7 stroke-[2.5]" />
          </motion.div>
          <span className="text-xs font-black tracking-[0.3em] uppercase text-teal-400">Perfil</span>
        </div>
        
        <h1 className="text-6xl md:text-7xl font-black tracking-tighter mb-4 leading-[0.9]">
          O teu <span className="text-teal-400">Perfil</span>.
        </h1>
      </header>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* User Info Card */}
        <div className="glass-card rounded-[2.5rem] p-8 border border-white/10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-[1.5rem] flex items-center justify-center border border-white/10">
              <User className="w-10 h-10 text-zinc-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-zinc-500" />
                <span className="text-lg font-bold text-white">{user?.email}</span>
              </div>
              <p className="text-xs text-zinc-500 font-medium">Membro desde {new Date(user?.created_at || '').toLocaleDateString('pt-PT', { year: 'numeric', month: 'long' })}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card rounded-[2rem] p-6 text-center border border-white/10">
            <BarChart3 className="w-8 h-8 text-teal-500 mx-auto mb-3" />
            <span className="text-3xl font-black text-white">{stats.totalWatched}</span>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-1">Vistos</p>
          </div>
          
          <div className="glass-card rounded-[2rem] p-6 text-center border border-white/10">
            <span className="text-3xl font-black text-yellow-400">{stats.totalWatchlist}</span>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-1">Wishlist</p>
          </div>
          
          <div className="glass-card rounded-[2rem] p-6 text-center border border-white/10">
            <span className="text-3xl font-black text-rose-400">{stats.avgRating}</span>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-1">Média</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Button 
            variant="secondary" 
            className="w-full py-4 rounded-2xl justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="mr-3 w-5 h-5" />
            Terminar Sessão
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-black px-4 text-xs text-zinc-600 font-bold uppercase tracking-widest">Zona de Perigo</span>
            </div>
          </div>

          <Button 
            variant="danger" 
            className="w-full py-4 rounded-2xl"
            onClick={handleDeleteAllData}
          >
            <Trash2 className="mr-3 w-5 h-5" />
            Apagar Todos os Meus Dados
          </Button>
        </div>

        {/* GDPR Notice */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-900/50 border border-white/5">
          <Shield className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-500 leading-relaxed">
            Os teus dados são armazenados de forma segura na base de dados do Supabase. 
            Tens o direito de solicitar a eliminação completa dos teus dados a qualquer momento, 
            conforme o RGPD. Ao apagares os teus dados, removes automaticamente todo o histórico 
            e watchlist associados à tua conta.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};