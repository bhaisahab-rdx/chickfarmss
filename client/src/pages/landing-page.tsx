import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import ScrollToTop from "@/components/scroll-to-top";
import { Link } from "wouter";
import { LoadingChickens } from "@/components/ui/loading-chickens";
import { useState, useEffect } from 'react';
import { 
  Droplets, 
  Wheat, 
  Egg, 
  Gift, 
  Sparkles, 
  BarChart3, 
  Users, 
  DollarSign, 
  PiggyBank,
  Hash,
  RefreshCw,
  LineChart as LineChartIcon,
  Wallet as WalletIcon,
  Share2
} from "lucide-react";

export default function LandingPage() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading for testing the animation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FEF3C7] flex items-center justify-center">
        <LoadingChickens size="lg" message="Preparing your farm..." />
      </div>
    );
  }

  const handleGetStarted = () => {
    if (user) {
      setLocation("/home");
    } else {
      setLocation("/auth?redirect=/home");
    }
  };

  const PriceDisplay = ({ amount }: { amount: string }) => (
    <span className="text-lg font-semibold text-amber-600 flex items-center gap-1">
      <img 
        src="/assets/tether-usdt-logo.png" 
        alt="USDT" 
        className="w-5 h-5 inline-block"
        style={{ objectFit: "contain" }} 
      />
      {amount}
    </span>
  );

  const ChickenDisplay = ({ type }: { type: string }) => {
    const chickenImages = {
      baby: "/assets/babychicken.png",
      regular: "/assets/regularchicken.png",
      golden: "/assets/goldenchicken.png"
    };

    return (
      <img 
        src={chickenImages[type as keyof typeof chickenImages]} 
        alt={`${type} Chicken`} 
        className="w-16 h-16"
        style={{ objectFit: "contain" }} 
      />
    );
  };

  const ResourceIcon = ({ type }: { type: string }) => {
    const resourceImages = {
      water: "/assets/waterbucket.png",
      wheat: "/assets/wheatbag.png",
      egg: "/assets/egg.png"
    };

    return (
      <img 
        src={resourceImages[type as keyof typeof resourceImages]} 
        alt={type} 
        className="w-12 h-12"
        style={{ objectFit: "contain" }} 
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#FEF3C7] flex flex-col overflow-y-auto">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-amber-100">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <img src="/assets/chickfarms-logo.png" alt="ChickFarms Logo" className="h-8 sm:h-10" />
            <span className="text-lg sm:text-xl font-bold text-amber-900">ChickFarms</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                onClick={() => setLocation(user ? "/home" : "/auth")}
                className="text-amber-900 hover:text-amber-700 hover:bg-amber-50 px-2 sm:px-4 h-9 sm:h-10 text-xs sm:text-sm"
              >
                <span className="flex items-center">
                  <span className="mr-1 sm:mr-1.5 text-base sm:text-lg">🏠</span> 
                  <span className="hidden xs:inline">{user ? "Dashboard" : "Login"}</span>
                </span>
              </Button>
            </motion.div>

            {!user && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <motion.div
                  animate={{
                    boxShadow: ["0px 0px 0px rgba(245, 158, 11, 0)", "0px 0px 15px rgba(245, 158, 11, 0.5)", "0px 0px 0px rgba(245, 158, 11, 0)"]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2
                  }}
                  className="absolute inset-0 rounded-md"
                />
                <Button
                  variant="default"
                  onClick={() => setLocation("/auth")}
                  className="bg-amber-500 hover:bg-amber-600 text-white relative z-10 border border-amber-400 px-2 sm:px-4 h-9 sm:h-10 text-xs sm:text-sm"
                >
                  <span className="flex items-center">
                    <span className="mr-1 sm:mr-1.5 text-base sm:text-lg">🐔</span>
                    <span className="hidden xs:inline">Sign Up</span>
                    <span className="xs:hidden">Join</span>
                  </span>
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-16 md:py-24 lg:py-32">
        <div className="container mx-auto px-3 sm:px-4 grid md:grid-cols-2 gap-6 md:gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl"
          >
            <Badge className="mb-4 bg-amber-100 text-amber-800 hover:bg-amber-200">
              Farming Game
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-amber-900 mb-6">
              Farm, Invest & Earn Real USDT
            </h1>
            <p className="text-lg text-amber-800 mb-8">
              Join ChickFarms, the innovative farming simulation where you raise chickens,
              collect eggs, and earn real cryptocurrency through strategic gameplay.
            </p>
            <div className="flex flex-wrap gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <motion.div
                  animate={{
                    boxShadow: ["0px 0px 0px rgba(245, 158, 11, 0)", "0px 0px 20px rgba(245, 158, 11, 0.5)", "0px 0px 0px rgba(245, 158, 11, 0)"]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2
                  }}
                  className="absolute inset-0 rounded-full"
                />
                <Button
                  onClick={handleGetStarted}
                  size="lg"
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 sm:px-8 h-10 sm:h-12 text-sm sm:text-base rounded-full relative z-10 shadow-lg border-2 border-amber-400"
                >
                  <span className="flex items-center">
                    <span className="mr-1 sm:mr-2 text-lg sm:text-xl">🐔</span> Start Playing
                  </span>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    const howItWorksSection = document.getElementById("how-it-works");
                    howItWorksSection?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="bg-white text-amber-600 hover:bg-amber-50 rounded-full shadow-lg border-2 border-amber-300 hover:border-amber-400 transition-all duration-200 px-4 sm:px-8 h-10 sm:h-12 text-sm sm:text-base"
                >
                  <span className="flex items-center">
                    <span className="mr-1 sm:mr-2 text-lg sm:text-xl">📘</span> Learn More
                  </span>
                </Button>
              </motion.div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-lg overflow-hidden shadow-xl">
              <img
                src="/assets/chickfarms-banner.png"
                alt="ChickFarms Game Preview"
                className="w-full h-auto"
              />
            </div>
            <div className="absolute -z-10 -top-10 -right-10 w-64 h-64 bg-amber-300 rounded-full opacity-30 blur-3xl"></div>
            <div className="absolute -z-10 -bottom-10 -left-10 w-64 h-64 bg-amber-500 rounded-full opacity-20 blur-3xl"></div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-12 sm:py-16 md:py-20 bg-white relative overflow-hidden">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <Badge className="mb-4 bg-amber-100 text-amber-800 hover:bg-amber-200">
              Game Mechanics
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-900 mb-3 sm:mb-4">
              How ChickFarms Works
            </h2>
            <p className="text-base sm:text-lg text-amber-700 max-w-2xl mx-auto">
              A simple farming simulation game with real earnings potential
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[
              {
                title: "Buy Chickens",
                desc: "Purchase different types of chickens with varying production rates and hatching times.",
                icon: "🐔",
                delay: 0
              },
              {
                title: "Collect Eggs",
                desc: "Regularly collect eggs from your chickens and sell them in the marketplace for USDT.",
                icon: "🥚",
                delay: 0.1
              },
              {
                title: "Upgrade Farm",
                desc: "Expand your chicken collection and increase your earning potential over time.",
                icon: "📈",
                delay: 0.2
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: item.delay }}
                viewport={{ once: true }}
              >
                <Card className="border-amber-100 hover:shadow-md transition-shadow h-full">
                  <CardHeader className="pb-2">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full bg-amber-100 text-2xl sm:text-3xl mb-3 sm:mb-4">
                      {item.icon}
                    </div>
                    <CardTitle className="text-lg sm:text-xl text-amber-900">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm sm:text-base text-amber-700">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Meet Your Chickens */}
          <div className="mt-12 sm:mt-16 md:mt-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg border border-amber-100">
                  <h3 className="text-xl sm:text-2xl font-bold text-amber-900 mb-4 sm:mb-6">
                    Meet Your Chickens
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    {[
                      {
                        title: "Baby Chicken",
                        desc: "Produces 2 eggs every 6 hours. Perfect for beginners!",
                        price: "$90 USDT",
                        type: "baby",
                        production: "8 eggs per day"
                      },
                      {
                        title: "Regular Chicken",
                        desc: "Produces 5 eggs every 5 hours. Balanced investment.",
                        price: "$150 USDT",
                        type: "regular",
                        production: "24 eggs per day"
                      },
                      {
                        title: "Golden Chicken",
                        desc: "Produces 20 eggs every 3 hours. For serious farmers!",
                        price: "$400 USDT",
                        type: "golden",
                        production: "160 eggs per day"
                      }
                    ].map((chicken, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className="p-4 sm:p-6 rounded-lg border border-amber-100 bg-gradient-to-r from-amber-50 to-amber-100 hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <motion.div
                              animate={{
                                y: [0, -5, 0],
                                rotate: index === 0 ? [0, 10, 0] : index === 1 ? [0, -5, 0] : [0, 15, 0]
                              }}
                              transition={{
                                duration: 1.5 + index * 0.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                              className="w-10 h-10 sm:w-auto sm:h-auto flex-shrink-0"
                            >
                              <ChickenDisplay type={chicken.type} />
                            </motion.div>
                            <div>
                              <h4 className="font-bold text-base sm:text-lg text-amber-900">{chicken.title}</h4>
                              <p className="text-amber-700 text-xs sm:text-sm">{chicken.production}</p>
                            </div>
                          </div>
                          <PriceDisplay amount={chicken.price} />
                        </div>
                        <p className="mt-2 sm:mt-3 text-amber-700 text-xs sm:text-sm">{chicken.desc}</p>
                        <div className="mt-3 sm:mt-4">
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 text-xs sm:text-sm">
                            ROI: {index === 0 ? "40" : index === 1 ? "30" : "20"} days
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg border border-amber-100">
                  <h3 className="text-lg sm:text-xl font-bold text-amber-900 mb-3 sm:mb-4">
                    Resource Management
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <ResourceIcon type="water" />
                      <div>
                        <h4 className="font-semibold text-amber-900 text-sm sm:text-base">Water Needs</h4>
                        <p className="text-xs sm:text-sm text-amber-700">Essential for egg production</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <ResourceIcon type="wheat" />
                      <div>
                        <h4 className="font-semibold text-amber-900 text-sm sm:text-base">Wheat Feed</h4>
                        <p className="text-xs sm:text-sm text-amber-700">Required for healthy chickens</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg border border-amber-100">
                  <h3 className="text-lg sm:text-xl font-bold text-amber-900 mb-3 sm:mb-4">
                    Earning Potential
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="text-amber-700 text-xs sm:text-sm">
                      • Baby Chickens earn <span className="font-semibold flex items-center gap-1 inline-flex">
                        <img 
                          src="/assets/tether-usdt-logo.png" 
                          alt="USDT" 
                          className="w-3 h-3 sm:w-4 sm:h-4"
                          style={{ objectFit: "contain" }} 
                        />
                        $2 USDT
                      </span> daily
                    </div>
                    <div className="text-amber-700 text-xs sm:text-sm">
                      • Regular Chickens earn <span className="font-semibold flex items-center gap-1 inline-flex">
                        <img 
                          src="/assets/tether-usdt-logo.png" 
                          alt="USDT" 
                          className="w-3 h-3 sm:w-4 sm:h-4"
                          style={{ objectFit: "contain" }} 
                        />
                        $4.8 USDT
                      </span> daily
                    </div>
                    <div className="text-amber-700 text-xs sm:text-sm">
                      • Golden Chickens earn <span className="font-semibold flex items-center gap-1 inline-flex">
                        <img 
                          src="/assets/tether-usdt-logo.png" 
                          alt="USDT" 
                          className="w-3 h-3 sm:w-4 sm:h-4"
                          style={{ objectFit: "contain" }} 
                        />
                        $16 USDT
                      </span> daily
                    </div>
                    <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-amber-800 text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                        <span className="text-base sm:text-xl">✨</span>
                        Your chickens will continue to produce eggs and earn USDT throughout their entire lifetime!
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Mystery Boxes & Daily Rewards Section */}
          <div className="mt-12 sm:mt-16 md:mt-20"> 
            <div className="text-center mb-6 sm:mb-8 md:mb-12">
              <Badge className="mb-4 bg-amber-100 text-amber-800 hover:bg-amber-200">
                Exciting Rewards
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-amber-900 mb-3 sm:mb-4">
                Mystery Boxes & Daily Rewards
              </h2>
              <p className="text-base sm:text-lg text-amber-700 max-w-2xl mx-auto">
                Spin the wheel daily and open mystery boxes for amazing rewards
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* Mystery Boxes */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl overflow-hidden shadow-xl"
              >
                <div className="bg-gradient-to-r from-amber-600 to-orange-600 py-3 sm:py-4 px-4 sm:px-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
                    <Gift className="h-5 w-5 sm:h-7 sm:w-7" />
                    <span className="text-2xl sm:text-3xl">🎁</span> Mystery Boxes
                  </h3>
                </div>

                <div className="p-4 sm:p-6">
                  <p className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base">
                    Purchase mystery boxes and open them to receive valuable rewards including USDT, chickens, resources, and more!
                  </p>

                  <div className="space-y-4">
                    {[
                      {
                        name: "Basic Box",
                        price: "$10",
                        features: ["Eggs", "Wheat", "Water", "Small USDT rewards"],
                        color: "from-amber-50 to-amber-100 border-amber-200"
                      },
                      {
                        name: "Premium Box",
                        price: "$50",
                        features: ["Higher rewards", "Chicken chance", "More resources", "USDT bonus"],
                        color: "from-purple-50 to-purple-100 border-purple-200"
                      },
                      {
                        name: "Gold Box",
                        price: "$100",
                        features: ["Golden Chicken chance", "Major USDT rewards", "Egg multipliers", "VIP Resources"],
                        color: "from-amber-50 to-amber-100 border-amber-200"
                      }
                    ].map((box, i) => (
                      <motion.div
                        key={i}
                        className={`rounded-lg border p-4 bg-gradient-to-r ${box.color}`}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.3 }}
                        viewport={{ once: true }}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-lg">{box.name}</h4>
                          <PriceDisplay amount={box.price} />
                        </div>
                        <ul className="text-sm space-y-1">
                          {box.features.map((feature, j) => (
                            <li key={j} className="flex items-center">
                              <span className="text-amber-600 mr-2">✓</span> {feature}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-amber-800 text-sm">
                      <span className="font-semibold">Pro Tip:</span> Daily login rewards can include free mystery boxes. Don't miss a day!
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Daily Rewards & Spin Wheel */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl overflow-hidden shadow-xl"
              >
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 py-3 sm:py-4 px-4 sm:px-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
                    <RefreshCw className="h-5 w-5 sm:h-7 sm:w-7" />
                    <span className="text-2xl sm:text-3xl">🎡</span> Daily Spin Wheel
                  </h3>
                </div>

                <div className="p-4 sm:p-6">
                  <p className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base">
                    Spin the wheel once daily for a chance to win eggs, resources, USDT, and even extra spins and chickens!
                  </p>

                  <div className="relative mb-8">
                    <div className="aspect-square max-w-xs mx-auto rounded-full overflow-hidden border-4 border-amber-300 shadow-lg">
                      <img
                        src="/assets/custom-spin-wheel.svg"
                        alt="Spin Wheel Preview"
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <motion.div 
                      className="absolute -top-5 -right-5 bg-amber-500 text-white rounded-full p-3 shadow-lg z-10"
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <Sparkles className="h-6 w-6" />
                    </motion.div>
                  </div>
                  
                  <div className="bg-amber-100 p-4 rounded-lg border border-amber-200 mb-6">
                    <h4 className="font-bold text-lg text-amber-800 mb-2 flex items-center gap-2">
                      <RefreshCw className="h-5 w-5" /> Spin Types
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-white rounded-lg shadow border border-amber-200">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-bold text-amber-800">Daily Spin</h5>
                          <Badge className="bg-green-100 text-green-700">Free</Badge>
                        </div>
                        <p className="text-sm text-amber-700">One free spin every 24 hours. Never miss your daily chance!</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg shadow border border-amber-200">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-bold text-amber-800">Super Jackpot</h5>
                          <Badge className="bg-purple-100 text-purple-700">Premium</Badge>
                        </div>
                        <p className="text-sm text-amber-700">Higher rewards with better chances of winning big prizes!</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <h4 className="font-bold text-lg text-amber-800">Daily Login Rewards</h4>
                    <div className="grid grid-cols-7 gap-2">
                      {[
                        { day: 1, reward: "5 Eggs", color: "bg-gradient-to-r from-amber-50 to-amber-100" },
                        { day: 2, reward: "10 Eggs", color: "bg-gradient-to-r from-yellow-50 to-yellow-100" },
                        { day: 3, reward: "1 Free Basic Mystery Box", color: "bg-gradient-to-r from-teal-50 to-teal-100" },
                        { day: 4, reward: "10 Water + 10 Wheat", color: "bg-gradient-to-r from-blue-50 to-blue-100" },
                        { day: 5, reward: "$1 USDT", color: "bg-gradient-to-r from-green-50 to-green-100" },
                        { day: 6, reward: "1 Free Silver Mystery Box", color: "bg-gradient-to-r from-blue-50 to-blue-100" },
                        { day: 7, reward: "$5 USDT + 1 Extra Spin", color: "bg-gradient-to-r from-purple-50 to-purple-100" },
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          className={`p-2 rounded border border-amber-200 flex flex-col items-center justify-center ${item.color} text-center`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05, duration: 0.2 }}
                          viewport={{ once: true }}
                          whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                        >
                          <div className="font-bold text-amber-900">Day {item.day}</div>
                          <div className="text-xs text-amber-800 mt-1">{item.reward}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-amber-800 text-sm">
                      <span className="font-semibold">Tip:</span> Maintain a login streak for bonus rewards. 7-day streaks give you special prizes!
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Dedicated Spin Wheel Section */}
      <section className="py-20 bg-gradient-to-br from-amber-50 to-orange-50 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-300 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-orange-300 rounded-full opacity-20 blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-amber-100 text-amber-800 hover:bg-amber-200">
              Exciting Feature
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-4">
              Daily Spin Wheel
            </h2>
            <p className="text-lg text-amber-700 max-w-2xl mx-auto">
              Spin daily for amazing rewards and bonuses
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="bg-white p-6 rounded-xl shadow-lg border border-amber-100">
                <h3 className="text-2xl font-bold text-amber-900 mb-6 flex items-center gap-3">
                  <span className="text-3xl">🎮</span> How It Works
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <h4 className="font-bold text-amber-800 text-lg mb-2">Daily Free Spin</h4>
                    <p className="text-amber-700">
                      Log in daily to get a free spin every 24 hours. The wheel contains various rewards including:
                    </p>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      {[
                        { icon: "💰", label: "USDT" },
                        { icon: "🥚", label: "Eggs" },
                        { icon: "🌾", label: "Wheat" },
                        { icon: "💧", label: "Water" },
                        { icon: "🐔", label: "Chickens" },
                        { icon: "🎡", label: "Extra Spins" }
                      ].map((item, i) => (
                        <div key={i} className="bg-white p-2 rounded border border-amber-200 text-center">
                          <div className="text-2xl mb-1">{item.icon}</div>
                          <div className="text-xs font-medium text-amber-800">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-fuchsia-50 rounded-lg border border-purple-100">
                    <h4 className="font-bold text-purple-800 text-lg mb-2">Super Jackpot Spin</h4>
                    <div className="flex gap-4 items-center">
                      <div className="text-5xl">🏆</div>
                      <div>
                        <p className="text-purple-800">Premium spin with higher-value rewards and better chances at rare prizes!</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge className="bg-purple-100 text-purple-800">Premium</Badge>
                          <span className="text-purple-700 text-sm">Higher Rewards</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-amber-100 rounded-lg">
                      <h5 className="font-bold text-amber-800 mb-1">Winning Streak</h5>
                      <p className="text-sm text-amber-700">Maintain a login streak to earn bonus prizes and extra spins!</p>
                    </div>
                    <div className="p-4 bg-amber-100 rounded-lg">
                      <h5 className="font-bold text-amber-800 mb-1">Special Events</h5>
                      <p className="text-sm text-amber-700">Look out for special event wheels with unique limited-time rewards!</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <div className="relative">
                <motion.div 
                  className="relative"
                  animate={{ rotate: [0, 720] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" }}
                >
                  <img
                    src="/assets/custom-spin-wheel.svg"
                    alt="Spin Wheel"
                    className="max-w-full rounded-full shadow-2xl border-4 border-amber-300"
                  />
                </motion.div>
                <motion.div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full p-5 shadow-lg z-10 border-2 border-white"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  animate={{ boxShadow: ["0px 0px 0px rgba(245, 158, 11, 0)", "0px 0px 20px rgba(245, 158, 11, 0.7)", "0px 0px 0px rgba(245, 158, 11, 0)"] }}
                  transition={{ boxShadow: { repeat: Infinity, duration: 2 } }}
                >
                  <span className="text-white font-bold text-xl">SPIN</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-amber-100 text-amber-800 hover:bg-amber-200">
              New Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-4">
              Mystery Boxes & Daily Rewards
            </h2>
            <p className="text-lg text-amber-700 max-w-2xl mx-auto">
              Unlock amazing rewards and earn daily bonuses
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Mystery Boxes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="bg-white p-6 rounded-lg shadow-lg border border-amber-100">
                <h3 className="text-2xl font-bold text-amber-900 mb-6 flex items-center gap-2">
                  <span className="text-3xl">🎁</span> Mystery Boxes
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      name: "Basic Box",
                      price: "$10 USDT",
                      rewards: "10-50 Wheat, 5-20 Water, 1-5 Eggs",
                      rarity: "Common (70%), Rare (30%)",
                      color: "bg-gradient-to-r from-slate-50 to-slate-100"
                    },
                    {
                      name: "Silver Box",
                      price: "$25 USDT",
                      rewards: "50-150 Wheat, 20-50 Water, 5-15 Eggs, Baby Chicken",
                      rarity: "Common (50%), Rare (40%), Epic (10%)",
                      color: "bg-gradient-to-r from-gray-50 to-gray-100"
                    },
                    {
                      name: "Golden Box",
                      price: "$50 USDT",
                      rewards: "150-300 Wheat, 50-100 Water, 15-30 Eggs, Regular Chicken, +5% USDT Bonus",
                      rarity: "Common (30%), Rare (40%), Epic (20%), Legendary (10%)",
                      color: "bg-gradient-to-r from-amber-50 to-amber-100"
                    },
                    {
                      name: "Diamond Box",
                      price: "$100 USDT",
                      rewards: "300-500 Wheat, 100-200 Water, 30-50 Eggs, Golden Chicken, +10% USDT Bonus",
                      rarity: "Rare (30%), Epic (50%), Legendary (20%)",
                      color: "bg-gradient-to-r from-cyan-50 to-cyan-100"
                    }
                  ].map((box, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className={`p-6 rounded-lg border border-amber-100 ${box.color} hover:shadow-md transition-all`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-lg text-amber-900">{box.name}</h4>
                          <p className="text-amber-700 text-sm mt-1">{box.rewards}</p>
                          <p className="text-amber-600 text-xs mt-1">{box.rarity}</p>
                        </div>
                        <PriceDisplay amount={box.price} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Daily Rewards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="bg-white p-6 rounded-lg shadow-lg border border-amber-100">
                <h3 className="text-2xl font-bold text-amber-900 mb-6 flex items-center gap-2">
                  <span className="text-3xl">🎯</span> Daily Rewards
                </h3>
                <div className="space-y-4">
                  {[
                    { day: 1, reward: "10 Wheat + 5 Water", color: "bg-gradient-to-r from-green-50 to-green-100" },
                    { day: 2, reward: "15 Wheat + 10 Water", color: "bg-gradient-to-r from-emerald-50 to-emerald-100" },
                    { day: 3, reward: "1 Free Basic Mystery Box", color: "bg-gradient-to-r from-teal-50 to-teal-100" },
                    { day: 4, reward: "30 Wheat + 20 Water", color: "bg-gradient-to-r from-cyan-50 to-cyan-100" },
                    { day: 5, reward: "5 Bonus Eggs + 50 Wheat", color: "bg-gradient-to-r from-sky-50 to-sky-100" },
                    { day: 6, reward: "1 Free Silver Mystery Box", color: "bg-gradient-to-r from-blue-50 to-blue-100" },
                    { day: 7, reward: "0.5 USDT Bonus + 1 Free Golden Box", color: "bg-gradient-to-r from-amber-50 to-amber-100" }
                  ].map((day, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className={`p-4 rounded-lg border border-amber-100 ${day.color} hover:shadow-md transition-all`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-900">
                          {day.day}
                        </div>
                        <div>
                          <h4 className="font-semibold text-amber-900">Day {day.day}</h4>
                          <p className="text-amber-700">{day.reward}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-amber-700 text-sm">
                    <span className="font-semibold">💡 Pro Tip:</span> Log in daily to maintain your streak! Missing a day resets your progress.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Deposits & Withdrawals */}
      <section className="py-20 bg-amber-50 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-300 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-400 rounded-full opacity-20 blur-3xl"></div>

        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-amber-200 text-amber-800 hover:bg-amber-300">
              Transactions
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-4">
              Easy Deposits & Withdrawals
            </h2>
            <p className="text-lg text-amber-700 max-w-2xl mx-auto">
              Secure and straightforward transactions to fund your farm and withdraw your earnings
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="order-2 md:order-1"
            >
              <h3 className="text-2xl font-bold text-amber-900 mb-6">
                Cryptocurrency Transactions
              </h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-1">Deposit USDT</h4>
                    <p className="text-amber-700">
                      Deposit USDT (TRC20) to your game wallet to purchase chickens and resources.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-1">Play & Earn</h4>
                    <p className="text-amber-700">
                      Generate income by raising chickens, collecting eggs, and selling resources.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-1">Withdraw Profits</h4>
                    <p className="text-amber-700">
                      Withdraw your earnings to your personal USDT wallet anytime.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="order-1 md:order-2"
            >
              <img
                src="/assets/wallet-screen.svg"
                alt="Wallet Interface"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Referral Program */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-amber-300 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-amber-400 rounded-full opacity-20 blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-amber-100 text-amber-800 hover:bg-amber-200">
              Multi-Level Rewards
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-4">
              6-Tier Referral Program
            </h2>
            <p className="text-lg text-amber-700 max-w-2xl mx-auto">
              Invite friends, build your team, and earn recurring commissions through 6 levels
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="relative">
                <img
                  src="/assets/referral-screen.svg"
                  alt="Referral Program Interface"
                  className="w-full h-auto rounded-lg shadow-lg border border-amber-100"
                />
                <motion.div 
                  className="absolute top-1/3 right-0 transform translate-x-1/2 -translate-y-1/2 bg-amber-500 text-white rounded-full p-4 shadow-lg"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Users className="h-8 w-8" />
                </motion.div>
              </div>

              {/* Referral Tiers */}
              <div className="mt-8 bg-white p-6 rounded-lg shadow-md border border-amber-100">
                <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center gap-2">
                  <Share2 className="h-5 w-5" /> Commission Structure
                </h3>
                
                <div className="space-y-3 mt-4">
                  {[
                    { level: 1, rate: "10%", description: "Direct referrals" },
                    { level: 2, rate: "5%", description: "Your referrals' referrals" },
                    { level: 3, rate: "3%", description: "3rd generation" },
                    { level: 4, rate: "2%", description: "4th generation" },
                    { level: 5, rate: "1%", description: "5th generation" },
                    { level: 6, rate: "0.5%", description: "6th generation" }
                  ].map((tier, i) => (
                    <motion.div 
                      key={i}
                      className={`flex items-center bg-gradient-to-r from-amber-50 to-amber-100 p-3 rounded-lg border border-amber-200`}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                      viewport={{ once: true }}
                    >
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center font-bold text-amber-700 mr-3 flex-shrink-0">
                        {tier.level}
                      </div>
                      <div className="flex-grow">
                        <div className="text-amber-800 font-medium">Level {tier.level}</div>
                        <div className="text-amber-600 text-sm">{tier.description}</div>
                      </div>
                      <div className="text-lg font-bold text-amber-700">{tier.rate}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="bg-white p-8 rounded-xl shadow-lg border border-amber-100">
                <h3 className="text-2xl font-bold text-amber-900 mb-6 flex items-center gap-3">
                  <Users className="h-6 w-6 text-amber-700" />
                  <span>Build Your Network</span>
                </h3>
                
                <div className="space-y-6">
                  <p className="text-amber-800">
                    Invite your friends to join ChickFarms and earn commissions on their deposits. 
                    Our multi-level structure means you also earn from your referrals' referrals - up to 6 levels deep!
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    {[
                      { icon: <Users className="h-10 w-10 text-amber-600" />, title: "Build Team", desc: "Invite friends to grow your network" },
                      { icon: <DollarSign className="h-10 w-10 text-amber-600" />, title: "Earn USDT", desc: "Get commissions from all 6 levels" },
                      { icon: <LineChartIcon className="h-10 w-10 text-amber-600" />, title: "Track Progress", desc: "Monitor your team's performance" },
                      { icon: <WalletIcon className="h-10 w-10 text-amber-600" />, title: "Monthly Salary", desc: "Earn based on team performance" }
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.3 }}
                        viewport={{ once: true }}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          {item.icon}
                        </div>
                        <h4 className="font-bold text-amber-800">{item.title}</h4>
                        <p className="text-sm text-amber-700">{item.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mt-6">
                    <h4 className="font-bold text-amber-800 mb-2">Team Milestone Rewards</h4>
                    <p className="text-sm text-amber-700 mb-4">
                      Unlock bonus rewards when your team reaches certain earnings milestones:
                    </p>
                    <ul className="space-y-2 text-sm">
                      {[
                        { milestone: "$100 team earnings", reward: "$5 bonus" },
                        { milestone: "$500 team earnings", reward: "$30 bonus" },
                        { milestone: "$1,000 team earnings", reward: "$75 bonus" },
                        { milestone: "$5,000 team earnings", reward: "$400 bonus" },
                        { milestone: "$10,000 team earnings", reward: "$1,000 bonus" }
                      ].map((item, i) => (
                        <li key={i} className="flex justify-between">
                          <span className="text-amber-800"><span className="font-medium">→</span> {item.milestone}</span>
                          <span className="font-bold text-amber-700">{item.reward}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-8 flex justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleGetStarted}
                      className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-md font-medium border border-amber-400 flex items-center gap-2"
                    >
                      <Users className="h-5 w-5" />
                      Start Building Your Team
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Marketplace */}
      <section className="py-20 bg-amber-50 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-amber-200 text-amber-800 hover:bg-amber-300">
              Trading
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-4">
              In-Game Marketplace
            </h2>
            <p className="text-lg text-amber-700 max-w-2xl mx-auto">
              Buy and sell farm resources to maximize your profits
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="order-2 md:order-1"
            >
              <h3 className="text-2xl font-bold text-amber-900 mb-6">
                Resource Trading
              </h3>
              <p className="text-amber-700 mb-6">
                The marketplace is where you can buy essential resources for your farm
                and sell your products for USDT.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg border border-amber-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <motion.div
                      className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl"
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, 0, -5, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <ResourceIcon type="water"/>
                    </motion.div>
                    <h4 className="font-semibold text-amber-900">Water</h4>
                  </div>
                  <p className="text-sm text-amber-700">
                    Essential for chicken health and egg production.
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-amber-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <motion.div
                      className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-xl"
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, -4, 0, 4, 0]
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.3
                      }}
                    >
                      <ResourceIcon type="wheat"/>
                    </motion.div>
                    <h4 className="font-semibold text-amber-900">Wheat</h4>
                  </div>
                  <p className="text-sm text-amber-700">
                    Feed your chickens to maintain egg production.
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-amber-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <motion.div
                      className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl"
                      animate={{
                        scale: [1, 1.05, 1],
                        y: [0, -3, 0]
                      }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.6
                      }}
                    >
                      <ResourceIcon type="egg"/>
                    </motion.div>
                    <h4 className="font-semibold text-amber-900">Eggs</h4>
                  </div>
                  <p className="text-sm text-amber-700">
                    Sell eggs for profit or use them to expand your farm.
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-amber-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <motion.div
                      className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl"
                      animate={{
                        scale: [1, 1.15, 1],
                        rotate: [0, 10, 0, -10, 0]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.9
                      }}
                    >
                      <ChickenDisplay type="baby"/>
                    </motion.div>
                    <h4 className="font-semibold text-amber-900">Chicks</h4>
                  </div>
                  <p className="text-sm text-amber-700">
                    Buy baby chickens to start or expand your farm.
                  </p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="order-1 md:order-2"
            >
              <img
                src="/assets/market-screen.svg"
                alt="Marketplace Interface"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-amber-100 text-amber-800 hover:bg-amber-200">
              Questions
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-amber-700 max-w-2xl mx-auto">
              Everything you need to know about ChickFarms
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {[
                {
                  question: "Is ChickFarms free to play?",
                  answer: "ChickFarms is free to register, but you'll need to make a deposit to purchase chickens and start playing. Different chickens have different prices, with baby chickens being the most affordable option for beginners."
                },
                {
                  question: "How do I earn real money?",
                  answer: "You earn by collecting eggs from your chickens and selling them in the marketplace. The more chickens you have and the better you manage your farm, the more you can earn. You can withdraw your earnings as USDT cryptocurrency."
                },
                {
                  question: "How often can chickens produce eggs?",
                  answer: "Each chicken type has a different cooldown period. Baby chickens produce eggs every 4 hours, regular chickens every 8 hours, and golden chickens every 24 hours. You need to ensure your chickens have water and feed to maintain production."
                },
                {
                  question: "What payment methods do you accept?",
                  answer: "Currently, we accept USDT (TRC20) for deposits. We're planning to add more cryptocurrency options in the future."
                },
                {
                  question: "How long do withdrawals take?",
                  answer: "Withdrawal requests are typically processed within 24 hours. Once approved, funds are transferred to your USDT wallet immediately."
                },
                {
                  question: "Is there a minimum withdrawal amount?",
                  answer: "Yes, the minimum withdrawal amount is 10 USDT. This helps minimize transaction fees and ensures efficient processing."
                }
              ].map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border border-amber-100 rounded-lg overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 hover:bg-amber-50 text-amber-900 font-semibold text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 text-amber-700">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-amber-400 to-amber-600 text-white relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-300 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-700 rounded-full opacity-20 blur-3xl"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Start Your Farming Journey?
              </h2>
              <p className="text-xl mb-8 text-amber-50">
                Join thousands of players already earning from their virtual farms.
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative inline-block"
              >
                <motion.div
                  animate={{
                    boxShadow: ["0px 0px 0px rgba(255, 255, 255, 0)", "0px 0px 25px rgba(255, 255, 255, 0.6)", "0px 0px 0px rgba(255, 255, 255, 0)"]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2
                  }}
                  className="absolute inset-0 rounded-full"
                />
                <Button
                  onClick={handleGetStarted}
                  size="lg"
                  className="bg-white text-amber-600 hover:bg-amber-50 px-8 text-lg rounded-full relative z-10 shadow-lg border-2 border-amber-100"
                >
                  <span className="flex items-center">
                    <span className="mr-2 text-2xl">🚀</span> Start Playing Now
                  </span>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-amber-900 text-amber-200 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src="/assets/chickfarms-logo.png" alt="ChickFarms Logo" className="h-8" />
                <span className="text-lg font-bold text-white">ChickFarms</span>
              </div>
              <p className="text-amber-300 mb-4">
                The fun farming game where you can earn real cryptocurrency.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-amber-300 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className="text-amber-300 hover:text-white transition-colors">
                  <span className="sr-only">Telegram</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.18-.04-.26-.02-.11.02-1.85 1.17-5.21 3.42-.49.33-.94.5-1.35.48-.44-.02-1.3-.25-1.93-.46-.78-.24-1.39-.38-1.33-.8.03-.21.32-.43.84-.66 3.31-1.43 5.52-2.39 6.63-2.86 3.16-1.35 3.81-1.58 4.24-1.59.09 0 .31.02.45.19.12.13.15.31.17.48z" />
                  </svg>
                </a>
                <a href="#" className="text-amber-300 hover:text-white transition-colors">
                  <span className="sr-only">Discord</span>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3847-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Game</h3>
              <ul className="space-y-2">
                <li><a href="#how-it-works" className="text-amber-300 hover:text-white transition-colors">How It Works</a></li>
                <li>
                  <Link href="/chickens" className="text-amber-300 hover:text-white transition-colors">
                    Chickens
                  </Link>
                </li>
                <li>
                  <Link href="/marketplace" className="text-amber-300 hover:text-white transition-colors">
                    Marketplace
                  </Link>
                </li>
                <li>
                  <Link href="/referral" className="text-amber-300 hover:text-white transition-colors">
                    Referral Program
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/contact-us" className="text-amber-300 hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/terms-of-service" className="text-amber-300 hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="text-amber-300 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Newsletter</h3>
              <p className="text-amber-300 mb-4">
                Subscribe to get updates about game features and promotions.
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="px-4 py-2 rounded-l-md text-amber-900 w-full"
                />
                <button className="bg-amber-500 text-white px-4 py-2 rounded-r-md hover:bg-amber-600 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-amber-800 text-center text-amber-400">
            <p>&copy; {new Date().getFullYear()} ChickFarms. All rights reserved.</p>
          </div>
        </div>
      </footer>
      <ScrollToTop />
    </div>
  );
}