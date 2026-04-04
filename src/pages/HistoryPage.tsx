import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { MainLayout } from '../layouts/MainLayout';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { History, Film, Tv, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

interface WatchedItem {
  id: string;
  title: string;
  poster_path: string;
  media_type: 'movie' | 'series';
  rating: number;
  user_note?: string;
  watched_at: string;
  created_at: string;
}

export const HistoryPage: React.FC = () => {
  const [items, setItems] = useState<WatchedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, avgRating: 0, movies: 0, series: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('watched_items')
        .select('*')
        .eq('user_id', user.id)
        .order('watched_at', { ascending: false });

      const watchedItems = data || [];
      
      // Calculate stats
      const total = watchedItems.length;
      const avgRating = total > 0 
        ? watchedItems.reduce((sum: number, item: any) => sum + (item.rating || 0), 0) / total 
        : 0;
      const movies = watchedItems.filter((i: any) => i.media_type === 'movie').length;
      const series = watchedItems.filter((i: any) => i.media_type === 'series').length;

      setStats({ total, avgRating: Math.round(avgRating * 10) / 10, movies, series });
      setItems(watchedItems);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase.from('watched_items').delete().eq('id', id);
    if (!error) {
      setItems(prev => prev.filter(item => item.id !== id));
      fetchHistory(); // Recalculate stats
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (rating >= 6) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-rose-400 bg-rose-500/20 border-rose-500/30';
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 8) return 'Excelente';
    if (rating >= 6) return 'Bom';
    if (rating >= 4) return 'Medíocre';
    return 'Fraco';
  };

  return (
    <MainLayout>
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: -5 }}
            className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20"
          >
            <History className="text-black w-7 h-7 stroke-[2.5]" />
          </motion.div>
          <span className="text-xs font-black tracking-[0.3em] uppercase text-rose-400">O teu percurso</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter mb-4 leading-[0.9]">
              O teu <span className="text-rose-400">Histórico</span>.
            </h1>
            <p className="text-zinc-500 text-lg font-medium max-w-xl">
              Todas as tuas aventuras cinematográficas registadas. O reflexo dos teus gostos!
            </p>
          </div>
          
          <div className="flex gap-6">
            <div className="text-center">
              <span className="text-4xl font-black text-white">{stats.total}</span>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Visto</p>
            </div>
            <div className="text-center">
              <span className="text-4xl font-black text-teal-400">{stats.avgRating}</span>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Média</p>
            </div>
            <div className="text-center">
              <span className="text-4xl font-black text-white">{stats.movies}</span>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Filmes</p>
            </div>
            <div className="text-center">
              <span className="text-4xl font-black text-white">{stats.series}</span>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Séries</p>
            </div>
          </div>
        </div>
      </header>

      {/* Add More Button */}
      <div className="mb-8">
        <Button 
          variant="outline" 
          onClick={() => navigate('/onboarding')}
          className="rounded-2xl"
        >
          <Plus className="mr-2 w-4 h-4" />
          Adicionar Mais Filmes
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="aspect-[2/3] rounded-[1.5rem] bg-zinc-900 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24"
        >
          <History className="w-20 h-20 text-zinc-800 mx-auto mb-6" />
          <h3 className="text-3xl font-black text-zinc-600 mb-3">Sem histórico ainda</h3>
          <p className="text-zinc-700 mb-8 text-lg">Começa a adicionar os filmes que já viste!</p>
          <Button variant="glow" onClick={() => navigate('/onboarding')}>Adicionar Primeiro Filme</Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative"
              >
                <div className="aspect-[2/3] rounded-[1.5rem] overflow-hidden bg-zinc-900 border border-white/5 hover:border-rose-500/30 transition-all">
                  <img 
                    src={item.poster_path !== 'N/A' ? item.poster_path : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=400'} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
                  
                  {/* Rating Badge */}
                  <div className={cn(
                    "absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center border font-black text-sm",
                    getRatingColor(item.rating)
                  )}>
                    {item.rating}
                  </div>

                  {/* Hover Info */}
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-center items-center text-center">
                    <div className="flex items-center gap-2 mb-2">
                      {item.media_type === 'movie' ? (
                        <Film className="w-4 h-4 text-white/70" />
                      ) : (
                        <Tv className="w-4 h-4 text-white/70" />
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white line-clamp-2 mb-2">{item.title}</h4>
                    <p className="text-[10px] text-zinc-400 mb-3">{getRatingLabel(item.rating)}</p>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-zinc-500 hover:text-rose-500"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-[10px] font-bold text-zinc-500 mt-2 text-center line-clamp-1 px-1">{item.title}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </MainLayout>
  );
};