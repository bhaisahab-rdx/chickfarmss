import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Chicken, Resource } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { LoadingChickens } from "@/components/ui/loading-chickens";
import {
  ChevronRight, Home, ShoppingCart, BarChart3, Wallet, User
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import BalanceBar from "@/components/balance-bar";
import { Droplets, Wheat } from "lucide-react";
import { ApiTest } from "@/components/api-test";

// Utility functions at the top level
const getChickenImage = (type: string) => {
  let imagePath;
  if (type === 'golden') {
    imagePath = '/assets/goldenchicken.png';
  } else if (type === 'regular') {
    imagePath = '/assets/regularchicken.png';
  } else if (type === 'baby') {
    imagePath = '/assets/babychicken.png';
  } else {
    imagePath = `/assets/chickens/${type}.svg`;
  }
  const fallbackPath = '/assets/chickens/baby.svg';

  return (
    <img
      src={imagePath}
      alt={`${type} Chicken`}
      className="w-full h-full object-contain"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.onerror = null;
        target.src = fallbackPath;
      }}
    />
  );
};

// Calculate remaining cooldown time for a chicken
const getRemainingCooldown = (chicken: Chicken): { hours: number, minutes: number, seconds: number } | null => {
  if (!chicken.lastHatchTime) return null;

  const requirements = {
    baby: { cooldown: 6 * 60 * 60 * 1000 }, // 6 hours
    regular: { cooldown: 5 * 60 * 60 * 1000 }, // 5 hours
    golden: { cooldown: 3 * 60 * 60 * 1000 }, // 3 hours
  };

  const cooldownTime = requirements[chicken.type as keyof typeof requirements].cooldown;
  const now = Date.now();
  const hatchTime = new Date(chicken.lastHatchTime).getTime();
  const timePassed = now - hatchTime;

  if (timePassed >= cooldownTime) return null;

  const remainingTime = cooldownTime - timePassed;
  const hours = Math.floor(remainingTime / (60 * 60 * 1000));
  const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((remainingTime % (60 * 1000)) / 1000);

  return { hours, minutes, seconds };
};

// Background style utility
const getBgStyle = () => {
  // Always return light background regardless of time of day
  return 'bg-gradient-to-b from-amber-50/50 to-white';
};

export default function HomePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'sunset' | 'night'>('day');
  const [activeChicken, setActiveChicken] = useState<number | null>(null);
  const isMobile = useIsMobile();
  const [cooldownTimers, setCooldownTimers] = useState<{[key: number]: string}>({});

  // Day-night cycle logic
  useEffect(() => {
    const updateTimeOfDay = () => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 17) {
        setTimeOfDay('day');
      } else if ((hour >= 17 && hour < 20) || (hour >= 5 && hour < 6)) {
        setTimeOfDay('sunset');
      } else {
        setTimeOfDay('night');
      }
    };

    updateTimeOfDay();
    const interval = setInterval(updateTimeOfDay, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const chickensQuery = useQuery<Chicken[]>({
    queryKey: ["/api/chickens"],
  });

  const resourcesQuery = useQuery<Resource>({
    queryKey: ["/api/resources"],
  });

  const hatchMutation = useMutation({
    mutationFn: async (chickenId: number) => {
      const res = await apiRequest("POST", `/api/chickens/${chickenId}/hatch`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chickens"] });

      // Play hatch sound
      const hatchSound = new Audio('/assets/hatch-sound.mp3');
      hatchSound.volume = 0.5;
      hatchSound.play().catch(() => {
        // Silent catch - audio might not play if user hasn't interacted with the page
      });

      toast({
        title: "Success!",
        description: "Your chicken has hatched some eggs!",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Cannot Hatch",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update cooldown timers every second
  useEffect(() => {
    if (!chickensQuery.data) return;

    const updateCooldowns = () => {
      const newTimers: {[key: number]: string} = {};

      chickensQuery.data.forEach(chicken => {
        const cooldown = getRemainingCooldown(chicken);
        if (cooldown) {
          newTimers[chicken.id] = `${cooldown.hours}h ${cooldown.minutes}m ${cooldown.seconds}s`;
        }
      });

      setCooldownTimers(newTimers);
    };

    updateCooldowns();
    const interval = setInterval(updateCooldowns, 1000);
    return () => clearInterval(interval);
  }, [chickensQuery.data]);

  // Helper function to determine if a chicken can hatch
  const canHatch = (chicken: Chicken) => {
    if (!chicken.lastHatchTime) return true;

    const requirements = {
      baby: { cooldown: 6 * 60 * 60 * 1000 }, // 6 hours
      regular: { cooldown: 5 * 60 * 60 * 1000 }, // 5 hours
      golden: { cooldown: 3 * 60 * 60 * 1000 }, // 3 hours
    };

    const cooldownTime = requirements[chicken.type as keyof typeof requirements].cooldown;
    const now = Date.now();
    const hatchTime = new Date(chicken.lastHatchTime).getTime();
    const timePassed = now - hatchTime;

    return timePassed >= cooldownTime;
  };

  // Chicken animation to use based on type
  const getChickenAnimation = (type: string) => {
    switch (type) {
      case 'baby':
        return {
          y: [0, -8, 0],
          rotate: [0, 0, 0],
          scale: [1, 1.05, 1],
          duration: 1.5,
          ease: "easeInOut"
        };
      case 'regular':
        return {
          x: [-3, 3, -3],
          y: [0, -2, 0],
          rotate: [-2, 2, -2],
          duration: 2,
          ease: "easeInOut"
        };
      case 'golden':
        return {
          y: [0, -5, 0],
          rotate: [-3, 3, -3],
          scale: [1, 1.02, 1],
          duration: 2.5,
          ease: "easeInOut"
        };
      default:
        return {
          y: [0, -5, 0],
          duration: 2,
          ease: "easeInOut"
        };
    }
  };

  // Sort chickens with ready-to-hatch first
  const sortedChickens = [...(chickensQuery.data || [])].sort((a, b) => {
    const aCanHatch = canHatch(a) ? 1 : 0;
    const bCanHatch = canHatch(b) ? 1 : 0;
    return bCanHatch - aCanHatch;
  });

  // Handle resource link clicks
  const handleResourceClick = (resourceType: string) => {
    window.location.href = `/market?tab=${resourceType}`;
  };

  // Show loading state while data is being fetched
  if (chickensQuery.isLoading || resourcesQuery.isLoading) {
    return (
      <div className={`min-h-screen flex flex-col ${getBgStyle()}`}>
        <BalanceBar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingChickens size="lg" message="Loading your chicken farm..." />
        </div>
      </div>
    );
  }

  if (!chickensQuery.data?.length) {
    return (
      <div className={`h-full flex flex-col ${getBgStyle()}`}>
        <BalanceBar />
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            className="max-w-md w-full"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <div
              className="chickfarms-welcome-card p-6 sm:p-8 text-center rounded-xl relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 249, 235, 0.9))",
                border: "3px solid rgba(255, 188, 91, 0.7)",
                boxShadow: "0 10px 25px rgba(255, 165, 61, 0.3), 0 4px 10px rgba(0, 0, 0, 0.1)"
              }}
            >
              {/* Decorative clouds */}
              <motion.div
                className="absolute top-5 left-0 w-40 h-28 opacity-90"
                animate={{ x: [0, 30, 0] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <img src="/assets/orange-cloud.png" alt="Orange Cloud" className="w-full h-full" />
              </motion.div>

              <motion.div
                className="absolute top-10 right-0 w-32 h-24 opacity-80"
                animate={{ x: [0, -20, 0] }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              >
                <img src="/assets/orange-cloud.png" alt="Orange Cloud" className="w-full h-full" />
              </motion.div>

              <motion.div
                className="absolute bottom-10 right-20 w-28 h-20 opacity-70"
                animate={{ x: [0, 15, 0] }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              >
                <img src="/assets/orange-cloud.png" alt="Orange Cloud" className="w-full h-full" />
              </motion.div>

              <motion.img
                src="/assets/chickfarms-logo.png"
                alt="ChickFarms"
                className="w-32 h-32 mx-auto mb-4"
                initial={{ y: -20 }}
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <h2
                  className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4"
                  style={{ color: "#ff7c2e" }}
                >
                  Welcome to ChickFarms!
                </h2>
                <p className="text-gray-700 text-sm sm:text-base mb-6 max-w-sm mx-auto">
                  Start your farming journey by getting your first chicken from the shop and grow your farm into a thriving business!
                </p>
                <motion.button
                  onClick={() => window.location.href = '/shop'}
                  className="chickfarms-button px-6 py-3 rounded-lg text-white font-bold text-base relative overflow-hidden"
                  style={{
                    background: "linear-gradient(to bottom, #ff9800, #ff7c2e)",
                    border: "2px solid #ffbc5b",
                    boxShadow: "0 4px 10px rgba(255, 159, 67, 0.4)"
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Get Your First Chicken</span>
                  <motion.div
                    className="absolute inset-0 bg-white/10"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: "linear"
                    }}
                  />
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Create a proper Resource type object with required fields
  const resources: Resource = resourcesQuery.data
    ? resourcesQuery.data
    : {
        id: 0,
        userId: user?.id || 0,
        waterBuckets: 0,
        wheatBags: 0,
        eggs: 0,
        mysteryBoxes: 0
      };

  return (
    <div className={`h-full flex flex-col ${getBgStyle()}`}>
      {/* Background Decorative Clouds */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          className="absolute right-5 top-20 w-48 h-32 opacity-80"
          animate={{ x: [0, -20, 0], y: [0, 5, 0] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          <img src="/assets/orange-cloud.png" alt="Orange Cloud" className="w-full h-full" />
        </motion.div>

        <motion.div
          className="absolute left-10 top-40 w-40 h-28 opacity-70"
          animate={{ x: [0, 15, 0], y: [0, -5, 0] }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        >
          <img src="/assets/orange-cloud.png" alt="Orange Cloud" className="w-full h-full" />
        </motion.div>

        <motion.div
          className="absolute right-20 bottom-32 w-36 h-24 opacity-60"
          animate={{ x: [0, -10, 0], y: [0, 8, 0] }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        >
          <img src="/assets/orange-cloud.png" alt="Orange Cloud" className="w-full h-full" />
        </motion.div>
      </div>

      <BalanceBar />
      <div className="flex-1 overflow-auto p-4 pt-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <h1 className="text-xl font-bold text-amber-800 mb-1">Your Chicken Coop</h1>
          <p className="text-sm text-amber-700">Tap on a chicken to manage it</p>
        </motion.div>

        {/* Chicken Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedChickens.map((chicken, index) => (
            <motion.div
              key={chicken.id}
              className={`bg-white/90 rounded-xl overflow-hidden shadow-md border border-amber-200 relative ${
                activeChicken === chicken.id ? 'ring-2 ring-amber-500' : ''
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              onClick={() => setActiveChicken(activeChicken === chicken.id ? null : chicken.id)}
            >
              {/* Chicken Image with Animation */}
              <div className="flex justify-center items-center p-4 h-32 bg-gradient-to-b from-amber-50 to-amber-100/50">
                <motion.div
                  animate={getChickenAnimation(chicken.type)}
                  transition={{
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="relative w-24 h-24"
                >
                  {getChickenImage(chicken.type)}
                </motion.div>
              </div>

              {/* Chicken Info */}
              <div className="p-3 bg-white border-t border-amber-100">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold capitalize text-amber-800">
                    {chicken.type} Chicken
                  </h3>
                  <div className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    #{chicken.id}
                  </div>
                </div>

                {/* Egg Production Progress */}
                <div className="mt-2 mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-amber-700">Egg Production</span>
                    {canHatch(chicken) ? (
                      <span className="text-xs text-green-600 font-medium">Ready!</span>
                    ) : (
                      <span className="text-xs text-amber-600 font-medium">In Progress...</span>
                    )}
                  </div>

                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    {canHatch(chicken) ? (
                      <motion.div
                        className="h-full bg-gradient-to-r from-green-400 to-green-500"
                        style={{ width: '100%' }}
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    ) : (
                      <motion.div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
                        style={{
                          width: `${((Date.now() - new Date(chicken.lastHatchTime || 0).getTime()) /
                            (chicken.type === 'baby' ? 6 : chicken.type === 'regular' ? 5 : 3) / 60 / 60 / 1000) * 100}%`
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Hatch Button or Cooldown Timer */}
                {canHatch(chicken) ? (
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      hatchMutation.mutate(chicken.id);
                    }}
                    disabled={
                      hatchMutation.isPending ||
                      resources.waterBuckets < (chicken.type === 'golden' ? 3 : chicken.type === 'regular' ? 2 : 1) ||
                      resources.wheatBags < (chicken.type === 'golden' ? 3 : chicken.type === 'regular' ? 2 : 1)
                    }
                    className={`w-full py-2 px-4 rounded-lg text-white font-medium text-sm relative overflow-hidden
                      ${
                        resources.waterBuckets < (chicken.type === 'golden' ? 3 : chicken.type === 'regular' ? 2 : 1) ||
                        resources.wheatBags < (chicken.type === 'golden' ? 3 : chicken.type === 'regular' ? 2 : 1)
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {hatchMutation.isPending ? (
                      <span>Hatching...</span>
                    ) : resources.waterBuckets < (chicken.type === 'golden' ? 3 : chicken.type === 'regular' ? 2 : 1) ||
                       resources.wheatBags < (chicken.type === 'golden' ? 3 : chicken.type === 'regular' ? 2 : 1) ? (
                      <span>Not Enough Resources</span>
                    ) : (
                      <span>Hatch Eggs</span>
                    )}

                    {!(resources.waterBuckets < (chicken.type === 'golden' ? 3 : chicken.type === 'regular' ? 2 : 1) ||
                       resources.wheatBags < (chicken.type === 'golden' ? 3 : chicken.type === 'regular' ? 2 : 1)) && (
                      <motion.div
                        className="absolute inset-0 bg-white/10"
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5,
                          ease: "linear"
                        }}
                      />
                    )}
                  </motion.button>
                ) : (
                  <div className="bg-gray-100 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500 mb-1">Cooldown Remaining</p>
                    <p className="text-sm font-medium text-gray-700">
                      {cooldownTimers[chicken.id] || "Calculating..."}
                    </p>
                  </div>
                )}
              </div>

              {/* Resource Requirements - Only show when chicken is active */}
              <AnimatePresence>
                {activeChicken === chicken.id && (
                  <motion.div
                    className="p-3 border-t border-amber-100 bg-amber-50"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h4 className="text-xs font-medium text-amber-800 mb-2">Resources Required:</h4>
                    <div className="flex justify-center space-x-4">
                      <div className="flex items-center">
                        <img src="/assets/waterbucket.png" alt="Water Bucket" className="h-4 w-4 mr-1" style={{ objectFit: "contain" }} />
                        <span className="text-sm">
                          {chicken.type === 'golden' ? 3 : chicken.type === 'regular' ? 2 : 1}
                          <span className={resources.waterBuckets < (chicken.type === 'golden' ? 3 : chicken.type === 'regular' ? 2 : 1) ? 'text-red-500 ml-1' : 'text-green-500 ml-1'}>
                            ({resources.waterBuckets})
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center">
                        <img src="/assets/wheatbag.png" alt="Wheat Bag" className="h-4 w-4 mr-1" style={{ objectFit: "contain" }} />
                        <span className="text-sm">
                          {chicken.type === 'golden' ? 3 : chicken.type === 'regular' ? 2 : 1}
                          <span className={resources.wheatBags < (chicken.type === 'golden' ? 3 : chicken.type === 'regular' ? 2 : 1) ? 'text-red-500 ml-1' : 'text-green-500 ml-1'}>
                            ({resources.wheatBags})
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-amber-100 flex justify-between">
                      <div className="text-xs text-gray-500">Production rate:</div>
                      <div className="text-xs font-medium">
                        {chicken.type === 'golden' ? '5' : chicken.type === 'regular' ? '3' : '1'} eggs per cycle
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Add More Chickens Button */}
        <motion.div
          className="mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Link href="/shop">
            <motion.button
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-amber500 to-amber-600 text-white font-medium flex items-center justify-center space-x-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>Get More Chickens</span>
              <ChevronRight size={16} />
            </motion.button>
          </Link>
        </motion.div>

        {/* Quick Market Links */}
        <motion.div
          className="mt-4 grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.button
            onClick={() => handleResourceClick('water')}
            className="py-3 px-4 rounded-lg bg-blue-500/90 text-white font-medium flex items-center justify-center space-x-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <img src="/assets/waterbucket.png" alt="Water Bucket" width="24" height="24" style={{ objectFit: "contain" }} />
            <span>Buy Water</span>
          </motion.button>

          <motion.button
            onClick={() => handleResourceClick('wheat')}
            className="py-3 px-4 rounded-lg bg-amber-500/90 text-white font-medium flex items-center justify-center space-x-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <img src="/assets/wheatbag.png" alt="Wheat Bag" width="24" height="24" style={{ objectFit: "contain" }} />
            <span>Buy Wheat</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}