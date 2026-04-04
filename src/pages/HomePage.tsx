import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { geminiService } from '../services/gemini';
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

export const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Buscar histórico do utilizador
      const { data: historyData, error: historyError } = await supabase
        .from('watched_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (historyError) throw historyError;

      // 2. Se não houver histórico suficiente, ir para onboarding
      if (!historyData || historyData.length < 3) {
        navigate('/onboarding');
        return;
      }

      // 3. Formatar histórico para a IA
      const formattedHistory = historyData.map(item => ({
        title: item.title,
        rating: item.rating,
        media_type: item.media_type as 'movie' | 'series',
        user_note: item.user_note
      }));

      // 4. Tentar Gemini - sem fallback para forçar ver o erro real
      const aiResponse = await geminiService.getRecommendations(formattedHistory as any);
      
      // 5. Cruzar sugestões com OMDb para obter posters e detalhes reais
      const enrichedMovies = await Promise.all(
        aiResponse.recommendations.map(async (rec) => {
          const movieDetails = await omdbService.search(rec.title);
          const bestMatch = movieDetails[0]; // Pegamos o primeiro resultado da pesquisa
          
          if (bestMatch) {
            return {
              imdbID: bestMatch.imdbID,
              Title: bestMatch.Title,
              Year: rec.year,
              Type: rec.media_type,
              Poster: bestMatch.Poster,
              aiReason: rec.ai_reason,
              imdbRating: bestMatch.imdbRating
            } as Movie;
          }
          return null;
        })
      );

      setRecommendations(enrichedMovies.filter(m => m !== null) as Movie[]);
    } catch (err: any) {
      console.error('Erro ao gerar recomendações:', err);
      setError('Não conseguimos gerar as tuas recomendações neste momento. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const addToWatchlist = async (movie: Movie) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('watchlist_items').insert({
      user_id: user.id,
      tmdb_id: 0,
      media_type: movie.Type,
      title: movie.Title,
      poster_path: movie.Poster,
      ai_reason: movie.aiReason,
      status: 'pending'
    });

    if (!error) {
      // Remover da lista de recomendações local para dar feedback imediato
      setRecommendations(prev => prev.filter(m => m.imdbID !== movie.imdbID));
      alert(`${movie.Title} adicionado à tua Watchlist!`);
    }
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
              Baseadas no que já viste e nos teus comentários, a nossa IA selecionou estas obras para a tua próxima sessão.
            </p>
          </div>
          
          <Button 
            variant="secondary" 
            onClick={fetchRecommendations} 
            isLoading={loading}
            className="rounded-2xl border-white/5 h-fit py-4"
          >
            <RefreshCcw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Novas Sugestões
          </Button>
        </div>
      </header>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-[2rem] p-12 text-center mb-12">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">{error}</h3>
          <Button variant="outline" onClick={fetchRecommendations}>Tentar Novamente</Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
        {loading ? (
          // Skeletons
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
              onWatchlist={() => addToWatchlist(movie)}
              onAlreadySeen={() => alert("Fixe! Vou atualizar as tuas recomendações.")}
              onReject={() => setRecommendations(prev => prev.filter(m => m.imdbID !== movie.imdbID))}
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
