import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { omdbService } from '../../services/omdb';
import type { OMDBMovie } from '../../services/omdb';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Search, ChevronRight, Sparkles, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OnboardingPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<OMDBMovie[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ movie: OMDBMovie, rating: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (search.length < 2) return;
    setLoading(true);
    const results = await omdbService.search(search);
    setSearchResults(results);
    setLoading(false);
  };

  const handleSelectItem = (movie: OMDBMovie) => {
    if (selectedItems.find(i => i.movie.imdbID === movie.imdbID)) return;
    setSelectedItems([...selectedItems, { movie, rating: 8 }]); // Default rating 8
    setSearch('');
    setSearchResults([]);
  };

  const handleComplete = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const items = selectedItems.map(item => ({
        user_id: user.id,
        tmdb_id: 0, // Ignoramos TMDB pois estamos a usar OMDb
        media_type: item.movie.Type === 'series' ? 'series' : 'movie',
        title: item.movie.Title,
        poster_path: item.movie.Poster,
        rating: item.rating,
        watched_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('watched_items').insert(items);
      if (!error) navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/5 blur-[150px] -z-10" />
      
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-glow">
              <Sparkles className="text-black w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="text-xs font-black tracking-widest uppercase text-teal-400">Onboarding</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter mb-4 leading-none">
            Treina a tua <span className="text-teal-400">IA Pessoal</span>.
          </h1>
          <p className="text-zinc-500 text-lg max-w-2xl font-medium">
            Precisamos de pelo menos 3 filmes ou séries que já tenhas visto para criar o teu perfil de gostos.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Search Column */}
          <div className="lg:col-span-5 space-y-6">
            <form onSubmit={handleSearch} className="relative group">
              <Input 
                placeholder="Pesquisa um filme ou série..."
                className="pl-14 h-16 text-lg rounded-2xl bg-zinc-900 border-white/5 focus:ring-teal-500/10 focus:border-teal-500/30 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-teal-500 transition-colors" />
            </form>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {searchResults.map(movie => (
                <button
                  key={movie.imdbID}
                  onClick={() => handleSelectItem(movie)}
                  className="w-full flex items-center gap-4 p-4 glass-card rounded-2xl hover:border-teal-500/30 transition-all group"
                >
                  <img src={movie.Poster} className="w-16 h-20 object-cover rounded-lg shadow-xl" alt="" />
                  <div className="text-left">
                    <h4 className="font-bold text-white group-hover:text-teal-400 transition-colors">{movie.Title}</h4>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">{movie.Year} • {movie.Type}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selection Column */}
          <div className="lg:col-span-7">
            <div className="bg-zinc-900/40 rounded-[2.5rem] p-8 min-h-[500px] border border-white/5 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-white">Os Teus Selecionados ({selectedItems.length}/3)</h3>
                {selectedItems.length >= 3 && (
                  <Button variant="glow" onClick={handleComplete} isLoading={loading}>
                    Continuar <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <AnimatePresence>
                  {selectedItems.map((item) => (
                    <motion.div
                      key={item.movie.imdbID}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="relative group"
                    >
                      <div className="aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 group-hover:border-teal-500/50 transition-colors">
                        <img src={item.movie.Poster} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-4">
                           <div className="flex gap-1 mb-2">
                             {[1,2,3,4,5].map(star => (
                               <Star key={star} className="w-4 h-4 text-yellow-500 fill-current" />
                             ))}
                           </div>
                           <button 
                            onClick={() => setSelectedItems(selectedItems.filter(i => i.movie.imdbID !== item.movie.imdbID))}
                            className="text-[10px] uppercase font-black text-rose-500 hover:text-rose-400"
                           >
                            Remover
                           </button>
                        </div>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest mt-3 text-center text-zinc-500 truncate px-2">
                        {item.movie.Title}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {selectedItems.length < 3 && (
                  <div className="aspect-[2/3] rounded-2xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-zinc-700">
                    <span className="text-sm font-black uppercase tracking-widest">Aguardando...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
