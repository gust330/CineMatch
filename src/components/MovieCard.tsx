import React from 'react';
import { Star, Info, Plus, Check, Play } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../utils/cn';
import { motion } from 'framer-motion';

export interface MovieCardProps {
  title: string;
  year: string;
  poster: string;
  rating?: string;
  aiReason?: string;
  onWatchlist?: () => void;
  onAlreadySeen?: () => void;
  onReject?: () => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  title,
  year,
  poster,
  rating,
  aiReason,
  onWatchlist,
  onAlreadySeen,
  onReject,
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      className="group relative flex w-full flex-col overflow-hidden rounded-[2rem] bg-zinc-950 border border-white/5 transition-all hover:border-teal-500/30 hover:shadow-[0_20px_50px_-20px_rgba(20,184,166,0.3)] cursor-pointer"
    >
      {/* Poster Image com efeito de brilho suave no topo */}
      <div className="aspect-[2/3] w-full overflow-hidden relative">
        <img
          src={poster !== 'N/A' ? poster : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=600'}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Overlay do Gradient de Cinema (Cinematch Style) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
        
        {/* Badge do Ano (Flutuante no Topo) */}
        <div className="absolute top-4 left-4 rounded-full bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1 text-[10px] font-bold text-white/70 uppercase tracking-widest">
          {year}
        </div>

        {/* Rating do IMDb (Flutuante no Topo Direito) */}
        {rating && rating !== 'N/A' && (
          <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-teal-500/10 backdrop-blur-md border border-teal-500/20 px-2 py-1 text-[10px] font-black text-teal-400">
            <Star className="h-2.5 w-2.5 fill-current" />
            {rating}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3 className="mb-3 text-2xl font-black text-white leading-tight tracking-tight group-hover:text-teal-400 transition-colors">
          {title}
        </h3>

        {aiReason && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl bg-white/5 backdrop-blur-sm p-4 text-xs leading-relaxed text-zinc-300 border border-white/5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
            <p className="italic font-medium line-clamp-2">"{aiReason}"</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button 
            variant="glow"
            size="md" 
            className="flex-1" 
            onClick={(e) => {
              e.stopPropagation();
              onWatchlist?.();
            }}
          >
            <Plus className="mr-2 h-4 w-4 stroke-[3]" />
            Watchlist
          </Button>
          
          <div className="flex gap-1.5">
            <Button 
              variant="secondary" 
              size="icon" 
              className="w-10 h-10 shrink-0" 
              onClick={(e) => {
                e.stopPropagation();
                onAlreadySeen?.();
              }}
              title="Já vi"
            >
              <Check className="h-4 w-4" />
            </Button>
            
            {onReject && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-10 h-10 text-zinc-600 hover:text-rose-500" 
                onClick={(e) => {
                  e.stopPropagation();
                  onReject?.();
                }}
              >
                <span className="text-xl font-light">×</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
