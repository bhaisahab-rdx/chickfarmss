import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { dailySpinRewards, superJackpotRewards } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { SpinWheelModal } from "@/components/ui/spin-wheel-modal";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNowStrict } from "date-fns";
import { useUIState } from "@/hooks/use-ui-state";
import { useSoundEffect } from "@/hooks/use-sound-effects";

export function FloatingSpinButton() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { setSpinWheelOpen } = useUIState();
  const [isDailySpinOpen, setIsDailySpinOpen] = useState(false);
  const [isSuperSpinOpen, setIsSuperSpinOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [spinButtonSound] = useSoundEffect('/assets/spin-start.mp3', { volume: 0.5 });

  // Get spin status
  const spinStatusQuery = useQuery({
    queryKey: ["/api/spin/status"],
    queryFn: () => apiRequest("GET", "/api/spin/status"),
    refetchInterval: 1000, // Update countdown every second
  });

  // Format time remaining for spin
  useEffect(() => {
    if (spinStatusQuery.data?.timeUntilNextSpin && !spinStatusQuery.data?.canSpinDaily) {
      const timeString = formatDistanceToNowStrict(
        Date.now() + spinStatusQuery.data.timeUntilNextSpin,
        { addSuffix: false }
      );
      setTimeRemaining(timeString);
    } else {
      setTimeRemaining(null);
    }
  }, [spinStatusQuery.data]);

  // Show notification when spin is available
  useEffect(() => {
    if (spinStatusQuery.data?.canSpinDaily) {
      setShowNotification(true);
    } else {
      setShowNotification(false);
    }
  }, [spinStatusQuery.data?.canSpinDaily]);

  // Daily spin mutation
  const dailySpinMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/spin/daily"),
    onSuccess: (data) => {
      toast({
        title: "Spin successful!",
        description: `You won ${data.reward.amount} ${data.reward.type}${data.reward.chickenType ? ` ${data.reward.chickenType}` : ''}!`,
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/spin/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spin/history"] });
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
        description: `You won ${data.reward.amount} ${data.reward.type}${data.reward.chickenType ? ` ${data.reward.chickenType}` : ''}!`,
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/spin/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spin/history"] });
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

  if (!user) return null;

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed left-4 bottom-24 md:bottom-20 z-40 flex flex-col items-center">
        <AnimatePresence>
          {timeRemaining && !showNotification && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              className="mb-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-md text-amber-900 text-xs font-medium"
            >
              Next spin: {timeRemaining}
            </motion.div>
          )}
        </AnimatePresence>
      
        <motion.button
          className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group overflow-hidden relative"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            // Play the spin button sound
            spinButtonSound.play();
            
            // If daily spin is available, show that dialog, otherwise show super spin
            if (spinStatusQuery.data?.canSpinDaily || spinStatusQuery.data?.extraSpinsAvailable > 0) {
              setIsDailySpinOpen(true);
              setSpinWheelOpen(true);
            } else {
              setIsSuperSpinOpen(true);
              setSpinWheelOpen(true);
            }
          }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 100 100" 
            className="w-12 h-12 relative z-10 transform group-hover:rotate-180 transition-transform duration-500" 
            role="img"
          >
            <title>Spin Wheel</title>
            {/* Main wheel circle */}
            <circle cx="50" cy="50" r="45" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
            
            {/* Spin wheel partitions */}
            <path d="M50,50 L95,50 A45,45 0 0,0 73,11 Z" fill="#FBBF24" />
            <path d="M50,50 L73,11 A45,45 0 0,0 27,11 Z" fill="#F59E0B" />
            <path d="M50,50 L27,11 A45,45 0 0,0 5,50 Z" fill="#FBBF24" />
            <path d="M50,50 L5,50 A45,45 0 0,0 27,89 Z" fill="#F59E0B" />
            <path d="M50,50 L27,89 A45,45 0 0,0 73,89 Z" fill="#FBBF24" />
            <path d="M50,50 L73,89 A45,45 0 0,0 95,50 Z" fill="#F59E0B" />
            
            {/* Center circle */}
            <circle cx="50" cy="50" r="8" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
            
            {/* Pointer */}
            <polygon points="50,10 45,25 55,25" fill="#EA580C" />
            
            {/* Stars/Reward icons */}
            <circle cx="80" cy="30" r="4" fill="#FDBA74" />
            <circle cx="30" cy="30" r="4" fill="#FDBA74" />
            <circle cx="80" cy="70" r="4" fill="#FDBA74" />
            <circle cx="30" cy="70" r="4" fill="#FDBA74" />
            <circle cx="20" cy="50" r="4" fill="#FDBA74" />
            <circle cx="50" cy="80" r="4" fill="#FDBA74" />
          </svg>
          
          {/* Notification Badge */}
          <AnimatePresence>
            {showNotification && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 z-20"
              >
                <Badge variant="destructive" className="bg-green-500 hover:bg-green-600">
                  Ready!
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Extra Spins Badge */}
          <AnimatePresence>
            {spinStatusQuery.data?.extraSpinsAvailable > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -bottom-1 -right-1 z-20"
              >
                <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300">
                  +{spinStatusQuery.data?.extraSpinsAvailable}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Daily Spin Modal */}
      <SpinWheelModal
        isOpen={isDailySpinOpen}
        onClose={() => {
          setIsDailySpinOpen(false);
          setSpinWheelOpen(false);
        }}
        onSpin={dailySpinMutation.mutateAsync}
        rewards={dailySpinRewards}
        isSpinning={dailySpinMutation.isPending}
        spinType="daily"
      />

      {/* Super Jackpot Spin Modal */}
      <SpinWheelModal
        isOpen={isSuperSpinOpen}
        onClose={() => {
          setIsSuperSpinOpen(false);
          setSpinWheelOpen(false);
        }}
        onSpin={superSpinMutation.mutateAsync}
        rewards={superJackpotRewards}
        isSpinning={superSpinMutation.isPending}
        spinType="super"
      />
    </>
  );
}