import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AchievementBadge } from './achievement-badge';
import { useAchievementsWithProgress } from '@/hooks/use-achievements';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export function RecentAchievements() {
  const { data: achievements, isLoading, isError } = useAchievementsWithProgress();
  
  const recentAchievements = React.useMemo(() => {
    if (!achievements) return [];
    
    // Get completed achievements and sort by unlock date
    const completed = achievements
      .filter(a => a.isComplete && a.unlockedAt)
      .sort((a, b) => {
        if (!a.unlockedAt || !b.unlockedAt) return 0;
        return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
      })
      .slice(0, 5); // Get top 5 most recent
      
    return completed;
  }, [achievements]);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="w-48 h-6" /></CardTitle>
          <CardDescription><Skeleton className="w-64 h-4" /></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex gap-3 w-full border-b pb-3 mb-2">
                <Skeleton className="rounded-full w-10 h-10" />
                <div className="space-y-1">
                  <Skeleton className="w-24 h-4" />
                  <Skeleton className="w-32 h-3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Achievements</CardTitle>
          <CardDescription className="text-red-500">Failed to load achievements</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  if (recentAchievements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Achievements</CardTitle>
          <CardDescription>No achievements unlocked yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Keep playing to unlock achievements and earn rewards!
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Achievements</CardTitle>
        <CardDescription>Your latest unlocked achievements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentAchievements.map((achievement) => (
            <div key={achievement.code} className="flex items-center gap-3 border-b pb-3">
              <AchievementBadge {...achievement} size="sm" />
              <div>
                <h4 className="font-medium text-sm">{achievement.name}</h4>
                <p className="text-xs text-muted-foreground">
                  Unlocked {achievement.unlockedAt ? format(new Date(achievement.unlockedAt), 'PPP') : 'recently'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}