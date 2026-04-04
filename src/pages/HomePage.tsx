import React, { useState, useEffect, useCallback } from 'react';
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

const STORAGE_KEYS = {
  recommendations: 'cinematch_recommendations',
  rejectedIds: 'cinematch_rejected',
  seenIds: 'cinematch_seen',
  timestamp: 'cinematch_cache_time'
};

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

export const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Carregar dados do localStorage
  const loadFromCache = useCallback((): { recommendations: Movie[], rejected: string[], seen: string[] } | null => {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.recommendations);
      const rejected = localStorage.getItem(STORAGE_KEYS.rejectedIds) || '[]';
      const seen = localStorage.getItem(STORAGE_KEYS.seenIds) || '[]';
      const timestamp = localStorage.getItem(STORAGE_KEYS.timestamp);
      
      if (cached && timestamp) {
        const isExpired = Date.now() - parseInt(timestamp) > CACHE_DURATION;
        if (!isExpired) {
          return {
            recommendations: JSON.parse(cached),
            rejected: JSON.parse(rejected),
            seen: JSON.parse(seen)
          };
        }
      }
    } catch (e) {
      console.error('Erro ao carregar cache:', e);
    }
    return null;
  }, []);

  // Salvar no localStorage
  const saveToCache = useCallback((recs: Movie[], rejected: string[], seen: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.recommendations, JSON.stringify(recs));
      localStorage.setItem(STORAGE_KEYS.rejectedIds, JSON.stringify(rejected));
      localStorage.setItem(STORAGE_KEYS.seenIds, JSON.stringify(seen));
      localStorage.setItem(STORAGE_KEYS.timestamp, Date.now().toString());
    } catch (e) {
      console.error('Erro ao guardar cache:', e);
    }
  }, []);

  const fetchRecommendations = useCallback(async (isManualRefresh: boolean = false) => {
    // Se não é refresh manual e há cache válido, usar cache
    if (!isManualRefresh) {
      const cached = loadFromCache();
      if (cached && cached.recommendations.length > 0) {
        setRecommendations(cached.recommendations);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar histórico do utilizador
      const { data: historyData, error: historyError } = await supabase
        .from('watched_items')
        .select('title')
        .eq('user_id', user.id);

      if (historyError) throw historyError;

      if (!historyData || historyData.length < 3) {
        navigate('/onboarding');
        return;
      }

      // Buscar filmes rejeitados e vistos do localStorage
      const rejected = JSON.parse(localStorage.getItem(STORAGE_KEYS.rejectedIds) || '[]');
      const seen = JSON.parse(localStorage.getItem(STORAGE_KEYS.seenIds) || '[]');
      
      // Buscar títulos já vistos na base de dados para evitar
      const { data: watchedData } = await supabase
        .from('watched_items')
        .select('title')
        .eq('user_id', user.id);
      
      const watchedTitles = (watchedData || []).map(w => w.title);

      // Formatar histórico
      const watchedForAI = (historyData || []).map((item: any) => ({
        title: item.title,
        rating: 8, // Default rating para histórico antigo
        media_type: 'movie' as const,
        user_note: ''
      }));

      // Adicionar filmes rejeitados e vistos ao prompt
      const allExcluded = [...rejected, ...seen, ...watchedTitles];
      
      console.log('A chamar OpenRouter...');
      const aiResponse = await openRouterService.getRecommendations(watchedForAI, allExcluded);
      console.log('Resposta da OpenRouter:', aiResponse);
      
      // Cruzar com OMDb
      const enrichedMovies = await Promise.all(
        aiResponse.recommendations.map(async (rec) => {
          const movieDetails = await omdbService.search(rec.title);
          const bestMatch = movieDetails[0];
          
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

      // Filtrar duplicados e filmes já vistos/rejeitados
      const excludedIds = [...rejected, ...seen];
      const filteredMovies = enrichedMovies.filter(m => 
        m !== null && !excludedIds.includes(m.imdbID)
      ) as Movie[];

      setRecommendations(filteredMovies);
      
      // Atualizar cache
      saveToCache(filteredMovies, rejected, seen);
    } catch (err: any) {
      console.error('Erro ao gerar recomendações:', err);
      setError('Não conseguimos gerar as tuas recomendações neste momento. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  }, [loadFromCache, navigate, saveToCache]);

  useEffect(() => {
    const init = async () => {
      await fetchRecommendations(false);
    };
    init();
  }, []);

  // Garantir 4 recomendações quando necessário
  useEffect(() => {
    const fillRecommendations = async () => {
      if (!loading && recommendations.length > 0 && recommendations.length < 4) {
        await ensureFourRecommendations();
      }
    };
    // Delay para evitar loop
    const timer = setTimeout(fillRecommendations, 1000);
    return () => clearTimeout(timer);
  }, [recommendations.length]);

  const handleManualRefresh = () => {
    fetchRecommendations(true);
  };

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
      // Remover da lista
      const newRecs = recommendations.filter(m => m.imdbID !== movie.imdbID);
      setRecommendations(newRecs);
      
      // Atualizar cache
      const rejected = JSON.parse(localStorage.getItem(STORAGE_KEYS.rejectedIds) || '[]');
      const seen = JSON.parse(localStorage.getItem(STORAGE_KEYS.seenIds) || '[]');
      saveToCache(newRecs, rejected, seen);
      
      alert(`${movie.Title} adicionado à tua Watchlist!`);
    }
  };

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

    // Guardar ID como visto
    const seen = JSON.parse(localStorage.getItem(STORAGE_KEYS.seenIds) || '[]');
    const newSeen = [...seen, movie.imdbID];
    localStorage.setItem(STORAGE_KEYS.seenIds, JSON.stringify(newSeen));

    // Remover da lista
    const newRecs = recommendations.filter(m => m.imdbID !== movie.imdbID);
    setRecommendations(newRecs);

    // Atualizar cache
    const rejected = JSON.parse(localStorage.getItem(STORAGE_KEYS.rejectedIds) || '[]');
    saveToCache(newRecs, rejected, newSeen);

    alert("Filme adicionado ao teu histórico! 👍");
  };

  const handleReject = async (movie: Movie) => {
    const rejected = JSON.parse(localStorage.getItem(STORAGE_KEYS.rejectedIds) || '[]');
    const newRejected = [...rejected, movie.imdbID];
    localStorage.setItem(STORAGE_KEYS.rejectedIds, JSON.stringify(newRejected));

    // Remover o filme rejeitado
    const currentRecs = recommendations.filter(m => m.imdbID !== movie.imdbID);
    
    // Se tiver menos de 4, buscar novos
    if (currentRecs.length < 4) {
      setLoading(true);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Buscar todos os títulos a excluir
        const { data: watchedData } = await supabase.from('watched_items').select('title').eq('user_id', user.id);
        const watchedTitles = (watchedData || []).map(w => w.title);
        const allExcluded = [...newRejected, ...watchedTitles];

        // Buscar dados do histórico para o prompt
        const { data: historyData } = await supabase
          .from('watched_items')
          .select('title, rating')
          .eq('user_id', user.id)
          .limit(5);

        const historyForAI = (historyData || []).map((item: any) => ({
          title: item.title,
          rating: item.rating || 8,
          media_type: 'movie' as const,
          user_note: ''
        }));

        // Pedir apenas 1 novo filme para substituir o rejeitado
        const newRecs = await openRouterService.getRecommendations(historyForAI, allExcluded);
        
        // Buscar detalhes do novo filme na OMDb
        if (newRecs.recommendations.length > 0) {
          const rec = newRecs.recommendations[0];
          const movieDetails = await omdbService.search(rec.title);
          const bestMatch = movieDetails[0];
          
          if (bestMatch) {
            const newMovie: Movie = {
              imdbID: bestMatch.imdbID,
              Title: bestMatch.Title,
              Year: rec.year,
              Type: rec.media_type,
              Poster: bestMatch.Poster,
              aiReason: rec.ai_reason,
              imdbRating: bestMatch.imdbRating
            };
            
            // Adicionar o novo filme à lista
            setRecommendations([...currentRecs, newMovie]);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar substituição:', err);
        setRecommendations(currentRecs);
      } finally {
        setLoading(false);
      }
    } else {
      setRecommendations(currentRecs);
    }

    // Atualizar cache
    const seen = JSON.parse(localStorage.getItem(STORAGE_KEYS.seenIds) || '[]');
    saveToCache(recommendations, newRejected, seen);
  };

  const ensureFourRecommendations = async () => {
    if (recommendations.length >= 4) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: historyData } = await supabase
        .from('watched_items')
        .select('title, rating')
        .eq('user_id', user.id)
        .limit(5);

      // const rejected = JSON.parse(localStorage.getItem(STORAGE_KEYS.rejectedIds) || '[]');
      const seen = JSON.parse(localStorage.getItem(STORAGE_KEYS.seenIds) || '[]');
      
      const historyForAI = (historyData || []).map((item: any) => ({
        title: item.title,
        rating: item.rating || 8,
        media_type: 'movie' as const,
        user_note: ''
      }));

      const needed = 4 - recommendations.length;
      let newRecs = recommendations;

      for (let i = 0; i < needed; i++) {
        const { data: watchedData } = await supabase.from('watched_items').select('title').eq('user_id', user.id);
        const watchedTitles = (watchedData || []).map(w => w.title);
        
        const currentRejected = JSON.parse(localStorage.getItem(STORAGE_KEYS.rejectedIds) || '[]');
        const allExcluded = [...currentRejected, ...seen, ...watchedTitles];

        const response = await openRouterService.getRecommendations(historyForAI, allExcluded);
        
        if (response.recommendations.length > 0) {
          const rec = response.recommendations[0];
          const movieDetails = await omdbService.search(rec.title);
          const bestMatch = movieDetails[0];
          
          if (bestMatch) {
            const newMovie: Movie = {
              imdbID: bestMatch.imdbID,
              Title: bestMatch.Title,
              Year: rec.year,
              Type: rec.media_type,
              Poster: bestMatch.Poster,
              aiReason: rec.ai_reason,
              imdbRating: bestMatch.imdbRating
            };
            newRecs = [...newRecs, newMovie];
          }
        }
      }

      setRecommendations(newRecs);
    } catch (err) {
      console.error('Erro ao garantir 4 recomendações:', err);
    } finally {
      setLoading(false);
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
            onClick={handleManualRefresh} 
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
          <Button variant="outline" onClick={handleManualRefresh}>Tentar Novamente</Button>
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
              onAlreadySeen={() => handleAlreadySeen(movie)}
              onReject={() => handleReject(movie)}
            />
          ))
        )}
      </div>

      {/* Botão para obter mais recomendações */}
      {!loading && recommendations.length > 0 && (
        <div className="mt-12 text-center">
          <Button 
            variant="outline" 
            onClick={() => fetchRecommendations(true)}
            className="rounded-full px-8"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Ver Mais Recomendações
          </Button>
        </div>
      )}

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
