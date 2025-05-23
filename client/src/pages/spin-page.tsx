import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { SpinWheel } from "@/components/ui/spin-wheel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dailySpinRewards, superJackpotRewards, SpinHistory } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import BalanceBar from "@/components/balance-bar";

export default function SpinPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("daily");

  // Get spin status (daily spin availability, extra spins)
  const spinStatusQuery = useQuery({
    queryKey: ["/api/spin/status"],
    queryFn: () => apiRequest("GET", "/api/spin/status"),
    refetchInterval: 1000, // Update countdown every second
  });

  // Get spin history
  const spinHistoryQuery = useQuery<SpinHistory[]>({
    queryKey: ["/api/spin/history"],
    queryFn: () => apiRequest("GET", "/api/spin/history"),
  });

  // Daily spin mutation
  const dailySpinMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/spin/daily"),
    onSuccess: (data) => {
      toast({
        title: "Spin successful!",
        description: "Check your rewards below.",
      });
      // Invalidate relevant queries to refresh data
      spinStatusQuery.refetch();
      spinHistoryQuery.refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      if (data.reward.type === "chicken") {
        queryClient.invalidateQueries({ queryKey: ["/api/chickens"] });
      } else if (data.reward.type === "usdt") {
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to spin",
        variant: "destructive",
      });
    },
  });

  // Super jackpot spin mutation
  const superSpinMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/spin/super"),
    onSuccess: (data) => {
      toast({
        title: "Super Jackpot Spin successful!",
        description: "Check your rewards below.",
      });
      // Invalidate relevant queries to refresh data
      spinStatusQuery.refetch();
      spinHistoryQuery.refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      if (data.reward.type === "chicken") {
        queryClient.invalidateQueries({ queryKey: ["/api/chickens"] });
      } else if (data.reward.type === "usdt") {
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to spin",
        variant: "destructive",
      });
    },
  });

  // Buy extra spins mutation
  const buySpinsMutation = useMutation({
    mutationFn: (quantity: number) => apiRequest("POST", "/api/spin/buy", { quantity }),
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Extra spins purchased successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to purchase spins",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <BalanceBar />
      
      <div className="mt-4">
        <h1 className="text-3xl font-bold mb-6">Lucky Spin Wheel</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Daily Free Spin</CardTitle>
              <CardDescription>Get your daily chance to win rewards!</CardDescription>
            </CardHeader>
            <CardContent>
              {spinStatusQuery.data?.canSpinDaily ? (
                <p className="text-green-600 font-semibold">Free spin available!</p>
              ) : (
                <p className="text-muted-foreground">
                  Next free spin in: {formatDistanceToNow(Date.now() + (spinStatusQuery.data?.timeUntilNextSpin || 0))}
                </p>
              )}
              <p className="mt-2">Extra spins available: {spinStatusQuery.data?.extraSpinsAvailable || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Super Jackpot</CardTitle>
              <CardDescription>Try your luck for amazing rewards!</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">Cost: 10 USDT per spin</p>
              <p className="text-sm text-muted-foreground mt-2">Win Golden Chickens and big USDT prizes!</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Buy Extra Spins</CardTitle>
              <CardDescription>Get more chances to win</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">2 USDT per extra spin</p>
              <div className="flex gap-2 mt-4">
                <Button onClick={() => buySpinsMutation.mutate(1)} disabled={buySpinsMutation.isPending}>
                  Buy 1
                </Button>
                <Button onClick={() => buySpinsMutation.mutate(5)} disabled={buySpinsMutation.isPending}>
                  Buy 5
                </Button>
                <Button onClick={() => buySpinsMutation.mutate(10)} disabled={buySpinsMutation.isPending}>
                  Buy 10
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="daily" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-[400px] mx-auto mb-8">
            <TabsTrigger value="daily">Daily Spin</TabsTrigger>
            <TabsTrigger value="super">Super Jackpot</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="flex justify-center">
            <SpinWheel
              onSpin={dailySpinMutation.mutateAsync}
              rewards={dailySpinRewards}
              isSpinning={dailySpinMutation.isPending}
              spinType="daily"
            />
          </TabsContent>

          <TabsContent value="super" className="flex justify-center">
            <SpinWheel
              onSpin={superSpinMutation.mutateAsync}
              rewards={superJackpotRewards}
              isSpinning={superSpinMutation.isPending}
              spinType="super"
            />
          </TabsContent>
        </Tabs>

        {/* Spin History */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Spin History</CardTitle>
            <CardDescription>Your recent spins and rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {spinHistoryQuery.data?.map((spin: SpinHistory) => (
                <div key={spin.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {spin.spinType === "daily" ? "Daily Spin" : "Super Jackpot"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(spin.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {spin.rewardType === "usdt" ? `$${spin.rewardAmount} USDT` :
                         spin.rewardType === "chicken" ? `${spin.chickenType} Chicken` :
                         `${spin.rewardAmount} ${spin.rewardType}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {!spinHistoryQuery.data?.length && (
                <p className="text-center text-muted-foreground py-8">
                  No spins yet. Try your luck now!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
