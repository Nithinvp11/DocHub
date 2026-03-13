'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WorkspaceFavoriteToggleButtonProps {
  workspaceId: string;
  initialIsFavorite?: boolean;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'ghost' | 'outline';
  showText?: boolean;
  className?: string;
  onToggle?: (isFavorite: boolean) => void;
}

export function WorkspaceFavoriteToggleButton({
  workspaceId,
  initialIsFavorite = false,
  size = 'default',
  variant = 'ghost',
  showText = false,
  className = '',
  onToggle,
}: WorkspaceFavoriteToggleButtonProps) {
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

      const response = await fetch('/api/workspace-favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workspaceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle workspace favorite');
      }

      const data = await response.json();
      const newIsFavorite = data.isFavorite;
      setIsFavorite(newIsFavorite);

      if (newIsFavorite) {
        toast.success('Workspace added to favorites', { icon: '⭐' });
      } else {
        toast.success('Workspace removed from favorites');
      }

      onToggle?.(newIsFavorite);
    } catch (error) {
      console.error('Failed to toggle workspace favorite:', error);
      toast.error('Failed to update workspace favorite');
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
            size={size === 'icon' ? 'icon' : size}
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
                  isFavorite ? 'fill-amber-500 text-amber-500' : 'text-slate-400'
                }`}
              />
            </motion.div>
            {showText && (
              <span className="text-sm">{isFavorite ? 'Favorited' : 'Add to Favorites'}</span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isFavorite ? 'Remove workspace from favorites' : 'Add workspace to favorites'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
