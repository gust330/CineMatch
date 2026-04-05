import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { openRouterService } from '../services/openrouter';
import { omdbService } from '../services/omdb';
import { MainLayout } from '../layouts/MainLayout';
import { MovieCard } from '../components/MovieCard';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { Sparkles, RefreshCcw, AlertCircle, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import type { Movie } from '../types';

const CACHE_KEY = 'cinematch_recs';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

export const HomePage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Buscar 1 filme novo para substituir
  const fetchOneReplacement = async (excludeIds: string[]): Promise<Movie | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: history } = await supabase
        .from('watched_items')
        .select('title, rating')
        .eq('user_id', user.id)
        .limit(5);

      const historyForAI = (history || []).map((item: any) => ({
        title: item.title,
        rating: item.rating || 8,
        media_type: 'movie' as const,
        user_note: ''
      }));

      const response = await openRouterService.getRecommendations(historyForAI, excludeIds);
      
      if (response.recommendations.length > 0) {
        const rec = response.recommendations[0];
        const details = await omdbService.search(rec.title);
        if (details[0]) {
          return {
            imdbID: details[0].imdbID,
            Title: details[0].Title,
            Year: rec.year,
            Type: rec.media_type,
            Poster: details[0].Poster,
            aiReason: rec.ai_reason,
            imdbRating: details[0].imdbRating
          };
        }
      }
    } catch (err) {
      console.error('Erro ao buscar substituição:', err);
    }
    return null;
  };

  // Buscar 4 recomendações iniciais
  const fetchInitialRecommendations = async (isManual: boolean = false) => {
    if (isManual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    // Verificar cache se não for manual
    if (!isManual) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const { movies, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION && movies.length >= 4) {
            setRecommendations(movies);
            setLoading(false);
            return;
          }
        } catch (e) {}
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: history } = await supabase
        .from('watched_items')
        .select('title, rating')
        .eq('user_id', user.id);

      if (!history || history.length < 3) {
        navigate('/onboarding');
        return;
      }

      // Buscar títulos a excluir
      const excludeIds: string[] = [];
      
      // Adicionar títulos do histórico
      const watchedTitles = history.map((h: any) => h.title);

      // Adicionar do cache de rejeitados/vistos
      const rejectedCache = localStorage.getItem('cinematch_rejected');
      const seenCache = localStorage.getItem('cinematch_seen');
      const rejectedIds = rejectedCache ? JSON.parse(rejectedCache) : [];
      const seenIds = seenCache ? JSON.parse(seenCache) : [];

      const historyForAI = history.map((item: any) => ({
        title: item.title,
        rating: item.rating || 8,
        media_type: 'movie' as const,
        user_note: ''
      }));

      const response = await openRouterService.getRecommendations(historyForAI, [...watchedTitles, ...rejectedIds, ...seenIds]);
      
      const newMovies: Movie[] = [];
      for (const rec of response.recommendations.slice(0, 4)) {
        const details = await omdbService.search(rec.title);
        if (details[0] && !excludeIds.includes(details[0].imdbID)) {
          const movie: Movie = {
            imdbID: details[0].imdbID,
            Title: details[0].Title,
            Year: rec.year,
            Type: rec.media_type,
            Poster: details[0].Poster,
            aiReason: rec.ai_reason,
            imdbRating: details[0].imdbRating
          };
          newMovies.push(movie);
          excludeIds.push(details[0].imdbID);
        }
      }

      if (newMovies.length >= 4) {
        setRecommendations(newMovies);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ movies: newMovies, timestamp: Date.now() }));
      } else {
        setError('Não conseguimos gerar 4 recomendações. Tenta novamente.');
      }
    } catch (err: any) {
      console.error('Erro:', err);
      setError('Ocorreu um erro ao carregar as recomendações.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInitialRecommendations();
  }, []);

  // Rejeitar filme - substituir sempre
  const handleReject = async (movie: Movie) => {
    // Guardar ID rejeitado
    const rejected = JSON.parse(localStorage.getItem('cinematch_rejected') || '[]');
    rejected.push(movie.imdbID);
    localStorage.setItem('cinematch_rejected', JSON.stringify(rejected));

    // Remover da lista
    const newRecs = recommendations.filter(m => m.imdbID !== movie.imdbID);
    
    // Buscar 1 substituição IMEDIATAMENTE
    setRecommendations(newRecs);
    
    const seen = JSON.parse(localStorage.getItem('cinematch_seen') || '[]');
    const replacement = await fetchOneReplacement([...rejected, ...seen]);
    
    if (replacement) {
      setRecommendations(prev => [...prev, replacement]);
    }
  };

  // Já vi - substituir sempre
  const handleAlreadySeen = async (movie: Movie) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Adicionar ao histórico
    await supabase.from('watched_items').insert({
      user_id: user.id,
      tmdb_id: 0,
      media_type: movie.Type,
      title: movie.Title,
      poster_path: movie.Poster,
      rating: 8,
      watched_at: new Date().toISOString()
    });

    // Guardar ID visto
    const seen = JSON.parse(localStorage.getItem('cinematch_seen') || '[]');
    seen.push(movie.imdbID);
    localStorage.setItem('cinematch_seen', JSON.stringify(seen));

    // Remover IMEDIATAMENTE
    const newRecs = recommendations.filter(m => m.imdbID !== movie.imdbID);
    setRecommendations(newRecs);
    
    // Buscar 1 substituição
    const rejected = JSON.parse(localStorage.getItem('cinematch_rejected') || '[]');
    const replacement = await fetchOneReplacement([...rejected, ...seen]);
    
    if (replacement) {
      setRecommendations(prev => [...prev, replacement]);
    }

    alert('Adicionado ao teu histórico! 👍');
  };

  // Adicionar à watchlist - substituir sempre
  const handleWatchlist = async (movie: Movie) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('watchlist_items').insert({
      user_id: user.id,
      tmdb_id: 0,
      media_type: movie.Type,
      title: movie.Title,
      poster_path: movie.Poster,
      ai_reason: movie.aiReason,
      status: 'pending'
    });

    // Remover IMEDIATAMENTE
    const newRecs = recommendations.filter(m => m.imdbID !== movie.imdbID);
    setRecommendations(newRecs);
    
    // Buscar 1 substituição
    const rejected = JSON.parse(localStorage.getItem('cinematch_rejected') || '[]');
    const seen = JSON.parse(localStorage.getItem('cinematch_seen') || '[]');
    const replacement = await fetchOneReplacement([...rejected, ...seen]);
    
    if (replacement) {
      setRecommendations(prev => [...prev, replacement]);
    }

    alert(`${movie.Title} adicionado à Watchlist!`);
  };

  return (
    <MainLayout>
      <header className="mb-12 relative">
        <div className="flex items-center gap-3 mb-4">
          <motion.div 
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="w-10 h-10 bg-teal-500 rounded-2xl flex items-center justify-center shadow-glow"
          >
            <Sparkles className="text-black w-6 h-6 stroke-[2.5]" />
          </motion.div>
          <span className="text-xs font-black tracking-[0.3em] uppercase text-teal-400">Personalizado por IA</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter mb-4 leading-[0.9]">
              As tuas <span className="text-teal-400">Sugestões</span>.
            </h1>
            <p className="text-zinc-500 text-lg font-medium leading-relaxed">
              Baseadas no que já viste, a nossa IA selecionou estas obras para a tua próxima sessão.
            </p>
          </div>
          
          <Button 
            variant="secondary" 
            onClick={() => fetchInitialRecommendations(true)} 
            isLoading={refreshing}
            className="rounded-2xl border-white/5 h-fit py-4"
          >
            <RefreshCcw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
            Novas Sugestões
          </Button>
        </div>
      </header>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-[2rem] p-12 text-center mb-12">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">{error}</h3>
          <Button variant="outline" onClick={() => fetchInitialRecommendations(true)}>Tentar Novamente</Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-[2.5rem] bg-zinc-900 animate-pulse border border-white/5 flex flex-col items-center justify-center">
              <Sparkles className="w-8 h-8 text-zinc-800 mb-2" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-800">A processar...</span>
            </div>
          ))
        ) : (
          recommendations.map((movie) => (
            <MovieCard 
              key={movie.imdbID}
              title={movie.Title}
              year={movie.Year}
              poster={movie.Poster}
              rating={movie.imdbRating}
              aiReason={movie.aiReason}
              onWatchlist={() => handleWatchlist(movie)}
              onAlreadySeen={() => handleAlreadySeen(movie)}
              onReject={() => handleReject(movie)}
            />
          ))
        )}
      </div>

      {!loading && recommendations.length === 0 && !error && (
        <div className="py-24 text-center">
          <Bookmark className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-zinc-600">Já viste tudo!</h3>
          <p className="text-zinc-700 mt-2">Adiciona mais filmes ao teu histórico para novas sugestões.</p>
        </div>
      )}
    </MainLayout>
  );
};
