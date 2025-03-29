import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';

interface AchievementBadgeProps {
  code: string;
  name: string;
  description: string;
  category: 'investment' | 'farming' | 'social' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  threshold: number;
  iconSvg: string;
  progress: number;
  isComplete: boolean;
  unlockedAt: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const rarityColors = {
  common: 'bg-slate-500',
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  legendary: 'bg-amber-500'
};

const categoryIcons = {
  investment: '💰',
  farming: '🌾',
  social: '👥',
  milestone: '🏆'
};

export function AchievementBadge({
  code,
  name,
  description,
  category,
  rarity,
  threshold,
  iconSvg,
  progress,
  isComplete,
  unlockedAt,
  size = 'md'
}: AchievementBadgeProps) {
  // Size variants
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16', 
    lg: 'w-24 h-24'
  };
  
  const tooltipOffset = {
    sm: 4,
    md: 8,
    lg: 12
  };
  
  const iconContainer = `relative rounded-full flex items-center justify-center ${sizeClasses[size]} ${isComplete ? rarityColors[rarity] : 'bg-gray-300 grayscale'}`;
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center gap-1">
            <div className={iconContainer}>
              {/* Use the SVG string directly */}
              <div dangerouslySetInnerHTML={{ __html: iconSvg }} className={sizeClasses[size]} />
              
              {/* Show badge for rarity */}
              <Badge 
                className={`absolute -top-1 -right-1 text-xs ${isComplete ? '' : 'bg-gray-400'}`} 
                variant={isComplete ? 'default' : 'outline'}
              >
                {rarity.charAt(0).toUpperCase()}
              </Badge>
            </div>
            
            {!isComplete && (
              <Progress 
                value={(progress / threshold) * 100} 
                className="w-full h-1.5 mt-1"
              />
            )}
            
            <span className="text-xs font-medium mt-1 text-center">{name}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent 
          sideOffset={tooltipOffset[size]}
          className="bg-background border border-border p-3 rounded-md shadow-md max-w-xs"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{name}</span>
              <Badge variant="outline">{categoryIcons[category]} {category}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
            <div className="text-xs text-muted-foreground">
              {isComplete ? (
                <span>Completed on {unlockedAt ? format(new Date(unlockedAt), 'PPP') : 'Unknown'}</span>
              ) : (
                <div className="flex flex-col gap-1">
                  <span>Progress: {progress} / {threshold}</span>
                  <Progress value={(progress / threshold) * 100} className="h-1" />
                </div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}