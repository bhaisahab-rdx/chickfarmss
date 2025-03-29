import React from 'react';
import { AchievementBadge } from './achievement-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAchievementsWithProgress } from '@/hooks/use-achievements';
import { Skeleton } from '@/components/ui/skeleton';

export function AchievementCollection() {
  const { data: achievements, isLoading, isError } = useAchievementsWithProgress();
  
  // Group achievements by category
  const achievementsByCategory = React.useMemo(() => {
    const grouped = {
      investment: [] as typeof achievements,
      farming: [] as typeof achievements,
      social: [] as typeof achievements,
      milestone: [] as typeof achievements,
      all: [] as typeof achievements,
    };
    
    if (achievements) {
      achievements.forEach(achievement => {
        grouped[achievement.category as keyof typeof grouped].push(achievement);
        grouped.all.push(achievement);
      });
    }
    
    return grouped;
  }, [achievements]);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            <Skeleton className="w-40 h-8" />
          </CardTitle>
          <CardDescription><Skeleton className="w-64 h-4" /></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center gap-1">
                <Skeleton className="rounded-full w-16 h-16" />
                <Skeleton className="w-12 h-2" />
                <Skeleton className="w-16 h-4" />
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
          <CardTitle>Achievements</CardTitle>
          <CardDescription className="text-red-500">Failed to load achievements</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Achievements</CardTitle>
        <CardDescription>
          Unlock achievements by playing and investing in ChickFarms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="investment">Investment</TabsTrigger>
            <TabsTrigger value="farming">Farming</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="milestone">Milestones</TabsTrigger>
          </TabsList>
          
          {/* All Achievements */}
          <TabsContent value="all">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {achievementsByCategory.all.map((achievement) => (
                <AchievementBadge
                  key={achievement.code}
                  {...achievement}
                />
              ))}
            </div>
          </TabsContent>
          
          {/* Investment Achievements */}
          <TabsContent value="investment">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {achievementsByCategory.investment.map((achievement) => (
                <AchievementBadge
                  key={achievement.code}
                  {...achievement}
                />
              ))}
              {achievementsByCategory.investment.length === 0 && (
                <p className="col-span-full text-center text-muted-foreground">No investment achievements yet</p>
              )}
            </div>
          </TabsContent>
          
          {/* Farming Achievements */}
          <TabsContent value="farming">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {achievementsByCategory.farming.map((achievement) => (
                <AchievementBadge
                  key={achievement.code}
                  {...achievement}
                />
              ))}
              {achievementsByCategory.farming.length === 0 && (
                <p className="col-span-full text-center text-muted-foreground">No farming achievements yet</p>
              )}
            </div>
          </TabsContent>
          
          {/* Social Achievements */}
          <TabsContent value="social">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {achievementsByCategory.social.map((achievement) => (
                <AchievementBadge
                  key={achievement.code}
                  {...achievement}
                />
              ))}
              {achievementsByCategory.social.length === 0 && (
                <p className="col-span-full text-center text-muted-foreground">No social achievements yet</p>
              )}
            </div>
          </TabsContent>
          
          {/* Milestone Achievements */}
          <TabsContent value="milestone">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {achievementsByCategory.milestone.map((achievement) => (
                <AchievementBadge
                  key={achievement.code}
                  {...achievement}
                />
              ))}
              {achievementsByCategory.milestone.length === 0 && (
                <p className="col-span-full text-center text-muted-foreground">No milestone achievements yet</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}