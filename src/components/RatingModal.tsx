import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, SkipForward } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../utils/cn';
import type { Movie } from '../types';

interface RatingModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
  onRate: (rating: number) => void;
  onSkip: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({ movie, isOpen, onClose, onRate, onSkip }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setSelectedRating(0);
      setHoverRating(0);
    }
  }, [isOpen]);

  const handleStarClick = (rating: number) => {
    setSelectedRating(rating);
  };

  const handleSave = () => {
    if (selectedRating > 0) {
      onRate(selectedRating);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  if (!movie) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-zinc-900 border border-white/10 rounded-[2rem] p-8 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-xs font-black tracking-[0.2em] uppercase text-teal-400 mb-2 block">Avaliar</span>
                <h2 className="text-2xl font-black text-white">{movie.Title}</h2>
                <p className="text-zinc-500 text-sm">{movie.Year}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-500 hover:text-white" />
              </button>
            </div>

            <div className="flex justify-center mb-8">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => handleStarClick(star)}
                    className="p-2 transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={cn(
                        'w-10 h-10 transition-all duration-200',
                        (hoverRating || selectedRating) >= star
                          ? 'fill-teal-400 text-teal-400 drop-shadow-[0_0_8px_rgba(20,184,166,0.6)]'
                          : 'text-zinc-700 hover:text-zinc-500'
                      )}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center mb-6">
              {selectedRating > 0 ? (
                <motion.p
                  key={selectedRating}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-teal-400 font-bold text-lg"
                >
                  {selectedRating} {selectedRating === 1 ? 'estrela' : 'estrelas'}
                </motion.p>
              ) : (
                <p className="text-zinc-500 text-sm">Clica numa estrela para avaliar</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleSkip}
                className="flex-1 rounded-2xl py-4"
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Saltar
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={selectedRating === 0}
                className="flex-1 rounded-2xl py-4"
              >
                Guardar
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
