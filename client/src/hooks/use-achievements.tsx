import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';

export interface AchievementBadge {
  id: number;
  code: string;
  name: string;
  description: string;
  category: 'investment' | 'farming' | 'social' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  threshold: number;
  iconSvg: string;
  createdAt: string;
}

export interface UserAchievement {
  id: number;
  userId: number;
  badgeId: number;
  progress: number;
  isComplete: boolean;
  unlockedAt: string | null;
}

export function useAchievementBadges() {
  return useQuery<AchievementBadge[]>({
    queryKey: ['/api/achievements/badges'],
    refetchOnWindowFocus: false,
    refetchInterval: 30 * 60 * 1000, // 30 minutes
  });
}

export function useUserAchievements() {
  return useQuery<UserAchievement[]>({
    queryKey: ['/api/achievements/user'],
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCompletedAchievements() {
  return useQuery<UserAchievement[]>({
    queryKey: ['/api/achievements/user/completed'],
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProgressAchievement() {
  return useMutation({
    mutationFn: ({ code, progress }: { code: string; progress: number }) =>
      apiRequest(`/api/achievements/progress/${code}`, {
        method: 'POST',
        body: JSON.stringify({ progress }),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/achievements/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/achievements/user/completed'] });
    },
  });
}

// Combined hook to get both badges and user progress
export function useAchievementsWithProgress() {
  const badgesQuery = useAchievementBadges();
  const userAchievementsQuery = useUserAchievements();
  
  const isLoading = badgesQuery.isLoading || userAchievementsQuery.isLoading;
  const isError = badgesQuery.isError || userAchievementsQuery.isError;
  
  const data = !isLoading && !isError && badgesQuery.data && userAchievementsQuery.data
    ? badgesQuery.data.map(badge => {
        const userAchievement = userAchievementsQuery.data.find(
          ua => ua.badgeId === badge.id
        );
        
        return {
          ...badge,
          progress: userAchievement?.progress || 0,
          isComplete: userAchievement?.isComplete || false,
          unlockedAt: userAchievement?.unlockedAt || null,
        };
      })
    : [];
  
  return {
    data,
    isLoading,
    isError,
    error: badgesQuery.error || userAchievementsQuery.error,
  };
}