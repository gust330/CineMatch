import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { MainLayout } from '../layouts/MainLayout';
import { Button } from '../components/Button';
import { RatingModal } from '../components/RatingModal';
import { useToast } from '../components/Toast';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Eye, CheckCircle, Clock, Trash2, Film, Tv } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import type { Movie } from '../types';

interface WatchlistItem {
  id: string;
  title: string;
  poster_path: string;
  media_type: 'movie' | 'series';
  status: 'pending' | 'watching' | 'completed';
  ai_reason?: string;
  added_at: string;
}

const statusConfig = {
  pending: { label: 'Pendente', icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  watching: { label: 'A Ver', icon: Eye, color: 'text-teal-500', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
  completed: { label: 'Concluído', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' }
};

export const WatchlistPage: React.FC = () => {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingModalItem, setRatingModalItem] = useState<WatchlistItem | null>(null);
  const [ratingModalMovie, setRatingModalMovie] = useState<Movie | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('watchlist_items')
        .select('*')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      setItems(data || []);
    } catch (error) {
      console.error('Erro ao buscar watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: 'pending' | 'watching' | 'completed') => {
    const { error } = await supabase
      .from('watchlist_items')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      
      if (newStatus === 'completed') {
        const item = items.find(i => i.id === id);
        if (item) {
          const movie: Movie = {
            imdbID: '',
            Title: item.title,
            Year: '',
            Poster: item.poster_path,
            Type: item.media_type
          };
          setRatingModalMovie(movie);
          setRatingModalItem(item);
        }
      }
    }
  };

  const handleRateAndComplete = async (rating: number) => {
    if (!ratingModalItem) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('watched_items').insert({
        user_id: user.id,
        tmdb_id: 0,
        media_type: ratingModalItem.media_type,
        title: ratingModalItem.title,
        poster_path: ratingModalItem.poster_path,
        rating: rating * 2,
        watched_at: new Date().toISOString()
      });
      
      await supabase.from('watchlist_items').delete().eq('id', ratingModalItem.id);
      setItems(prev => prev.filter(i => i.id !== ratingModalItem.id));
    }

    setRatingModalMovie(null);
    setRatingModalItem(null);
    showToast('Adicionado ao teu histórico!');
  };

  const handleSkipRating = async () => {
    if (!ratingModalItem) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('watched_items').insert({
        user_id: user.id,
        tmdb_id: 0,
        media_type: ratingModalItem.media_type,
        title: ratingModalItem.title,
        poster_path: ratingModalItem.poster_path,
        rating: 8,
        watched_at: new Date().toISOString()
      });
      
      await supabase.from('watchlist_items').delete().eq('id', ratingModalItem.id);
      setItems(prev => prev.filter(i => i.id !== ratingModalItem.id));
    }

    setRatingModalMovie(null);
    setRatingModalItem(null);
    showToast('Adicionado ao teu histórico!');
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase.from('watchlist_items').delete().eq('id', id);
    if (!error) {
      setItems(prev => prev.filter(item => item.id !== id));
      showToast('Removido da watchlist');
    }
  };

  const pendingCount = items.filter(i => i.status === 'pending').length;
  const watchingCount = items.filter(i => i.status === 'watching').length;
  const completedCount = items.filter(i => i.status === 'completed').length;

  return (
    <MainLayout>
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center shadow-glow"
          >
            <Bookmark className="text-black w-7 h-7 stroke-[2.5]" />
          </motion.div>
          <span className="text-xs font-black tracking-[0.3em] uppercase text-teal-400">A tua Lista</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter mb-4 leading-[0.9]">
              Watch<span className="text-teal-400">list</span>.
            </h1>
            <p className="text-zinc-500 text-lg font-medium max-w-xl">
              Os teus próximos favoritos estão aqui. Escolhe o que queres ver a seguir!
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="glass-card px-4 py-2 rounded-full flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-bold text-white">{pendingCount}</span>
            </div>
            <div className="glass-card px-4 py-2 rounded-full flex items-center gap-2">
              <Eye className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-bold text-white">{watchingCount}</span>
            </div>
            <div className="glass-card px-4 py-2 rounded-full flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-bold text-white">{completedCount}</span>
            </div>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="aspect-[2/3] rounded-[2rem] bg-zinc-900 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24"
        >
          <Bookmark className="w-20 h-20 text-zinc-800 mx-auto mb-6" />
          <h3 className="text-3xl font-black text-zinc-600 mb-3">A lista está vazia</h3>
          <p className="text-zinc-700 mb-8 text-lg">Descobre novos filmes e adiciona à tua watchlist!</p>
          <Button variant="glow" onClick={() => navigate('/')}>Ver Recomendações</Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {items.map((item) => {
              const status = statusConfig[item.status];
              const StatusIcon = status.icon;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative overflow-hidden rounded-[2.5rem] bg-zinc-900 border border-white/5 hover:border-teal-500/30 transition-all"
                >
                  <div className="aspect-[2/3] relative">
                    <img 
                      src={item.poster_path !== 'N/A' ? item.poster_path : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=600'} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
                    
                    {/* Status Badge */}
                    <div className={cn("absolute top-4 left-4 px-3 py-1.5 rounded-full flex items-center gap-1.5 border", status.bg, status.border)}>
                      <StatusIcon className={cn("w-3.5 h-3.5", status.color)} />
                      <span className={cn("text-[10px] font-black uppercase tracking-wider", status.color)}>{status.label}</span>
                    </div>

                    {/* Media Type */}
                    <div className="absolute top-4 right-4">
                      {item.media_type === 'movie' ? (
                        <Film className="w-5 h-5 text-white/50" />
                      ) : (
                        <Tv className="w-5 h-5 text-white/50" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-xl font-black text-white mb-2 line-clamp-1 group-hover:text-teal-400 transition-colors">{item.title}</h3>
                      
                      {item.ai_reason && (
                        <p className="text-xs text-zinc-400 italic line-clamp-2 mb-4">"{item.ai_reason}"</p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <select 
                          value={item.status}
                          onChange={(e) => updateStatus(item.id, e.target.value as any)}
                          className="flex-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white cursor-pointer hover:border-teal-500/50 transition-colors"
                        >
                          <option value="pending">Pendente</option>
                          <option value="watching">A Ver</option>
                          <option value="completed">Concluído</option>
                        </select>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="w-10 h-10 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <RatingModal
        movie={ratingModalMovie}
        isOpen={!!ratingModalMovie}
        onClose={() => {
          setRatingModalMovie(null);
          setRatingModalItem(null);
        }}
        onRate={handleRateAndComplete}
        onSkip={handleSkipRating}
      />
    </MainLayout>
  );
};
