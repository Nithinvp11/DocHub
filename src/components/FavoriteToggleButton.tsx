'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface FavoriteToggleButtonProps {
  documentId: string;
  initialIsFavorite?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  showText?: boolean;
  className?: string;
  onToggle?: (isFavorite: boolean) => void;
}

export function FavoriteToggleButton({
  documentId,
  initialIsFavorite = false,
  size = 'default',
  variant = 'ghost',
  showText = false,
  className = '',
  onToggle,
}: FavoriteToggleButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

  const handleToggle = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      setIsAnimating(true);

      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId }),
      });

      if (response.ok) {
        const data = await response.json();
        const newIsFavorite = data.isFavorite;
        setIsFavorite(newIsFavorite);

        if (newIsFavorite) {
          toast.success('Added to favorites', {
            icon: '⭐',
          });
        } else {
          toast.success('Removed from favorites');
        }

        onToggle?.(newIsFavorite);
      } else {
        throw new Error('Failed to toggle favorite');
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('Failed to update favorite');
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsAnimating(false), 600);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size={size}
            variant={variant}
            onClick={handleToggle}
            disabled={isLoading}
            className={`gap-2 ${className}`}
          >
            <motion.div
              animate={
                isAnimating
                  ? {
                      scale: [1, 1.3, 1],
                      rotate: [0, 360],
                    }
                  : {}
              }
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <Star
                className={`h-4 w-4 transition-all ${
                  isFavorite ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'
                }`}
              />
            </motion.div>
            {showText && (
              <span className="text-sm">{isFavorite ? 'Favorited' : 'Add to Favorites'}</span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isFavorite ? 'Remove from favorites' : 'Add to favorites'}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
