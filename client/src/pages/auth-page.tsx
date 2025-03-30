import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Redirect, useLocation } from "wouter";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const [showAnimation, setShowAnimation] = useState(false);

  // Get referral code and redirect path from URL if present
  const params = new URLSearchParams(window.location.search);
  const referralCode = params.get('ref');
  const redirectPath = params.get('redirect') || '/home'; // Default to '/home' if no redirect is specified

  // Show animation after a brief delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimation(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const loginForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      referredBy: referralCode || "",
      telegramId: "",
    },
  });

  const handleLoginSuccess = () => {
    setLocation(redirectPath);
  };

  const handleRegisterSuccess = () => {
    setLocation(redirectPath);
  };

  if (user) {
    return <Redirect to={redirectPath} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      backgroundImage: 'linear-gradient(135deg, #fff8e1 0%, #fef0cc 100%)',
      backgroundSize: 'cover',
      backgroundAttachment: 'fixed'
    }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Decorative elements */}
        <motion.div 
          animate={{ y: [0, -10, 0], scale: [1, 1.02, 1] }}
          transition={{ duration: 5, repeat: Infinity, repeatType: 'reverse', ease: "easeInOut" }}
          className="absolute top-[10%] left-[15%] w-24 h-24 opacity-40"
        >
          <img src="/assets/orange-cloud.svg" alt="Decorative cloud" />
        </motion.div>
        
        <motion.div 
          animate={{ y: [0, 12, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 8, repeat: Infinity, repeatType: 'reverse', ease: "easeInOut" }}
          className="absolute bottom-[20%] right-[10%] w-32 h-32 opacity-30"
        >
          <img src="/assets/orange-cloud.svg" alt="Decorative cloud" />
        </motion.div>
      </div>
      
      <motion.div 
        className="grid md:grid-cols-2 gap-4 sm:gap-8 w-full max-w-4xl relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="shadow-xl border-2 border-amber-200 overflow-hidden">
            <CardHeader className="pb-2 sm:pb-4 bg-gradient-to-br from-amber-100 to-amber-50">
              <motion.div 
                className="flex flex-col items-center space-y-2 sm:space-y-4 mb-2 sm:mb-4"
                animate={{ scale: showAnimation ? [1, 1.02, 1] : 1 }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
              >
                <img src="/assets/chickfarms-logo.svg" className="h-20 sm:h-28 w-auto" alt="ChickFarms" />
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <CardTitle className="text-center text-xl sm:text-2xl font-bold text-amber-800">Welcome to ChickFarms</CardTitle>
                </motion.div>
              </motion.div>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login" className="text-base font-medium rounded-md">Login</TabsTrigger>
                  <TabsTrigger value="register" className="text-base font-medium rounded-md">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form 
                      onSubmit={loginForm.handleSubmit(async (data) => {
                        await loginMutation.mutateAsync(data);
                        handleLoginSuccess();
                      })} 
                      className="space-y-4 sm:space-y-5"
                    >
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm sm:text-base font-medium text-amber-900">Username</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-10 sm:h-12 text-base rounded-md" placeholder="Enter your username" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm sm:text-base font-medium text-amber-900">Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} className="h-10 sm:h-12 text-base rounded-md" placeholder="Enter your password" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full h-11 sm:h-12 text-base font-semibold mt-4 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <span className="flex items-center justify-center">
                            <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-50 border-t-white rounded-full"></span>
                            Logging in...
                          </span>
                        ) : "Login"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form 
                      onSubmit={registerForm.handleSubmit(async (data) => {
                        await registerMutation.mutateAsync(data);
                        handleRegisterSuccess();
                      })} 
                      className="space-y-4 sm:space-y-5"
                    >
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm sm:text-base font-medium text-amber-900">Username</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-10 sm:h-12 text-base rounded-md" placeholder="Choose a username" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm sm:text-base font-medium text-amber-900">Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} className="h-10 sm:h-12 text-base rounded-md" placeholder="Create a password" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="referredBy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm sm:text-base font-medium text-amber-900">Referral Code (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-10 sm:h-12 text-base rounded-md" placeholder="Enter referral code if you have one" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="telegramId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm sm:text-base font-medium text-amber-900">Telegram ID</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-10 sm:h-12 text-base rounded-md" placeholder="Enter your Telegram ID (e.g., @username)" />
                            </FormControl>
                            <FormMessage className="text-xs" />
                            <div className="text-xs text-amber-700 mt-1">
                              Required for important notifications and withdrawals
                            </div>
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full h-11 sm:h-12 text-base font-semibold mt-4 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <span className="flex items-center justify-center">
                            <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-50 border-t-white rounded-full"></span>
                            Creating Account...
                          </span>
                        ) : "Register"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="hidden md:block"
        >
          <Card className="h-full shadow-lg border-2 border-amber-200 overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50">
            <CardContent className="p-6 sm:p-8 h-full flex flex-col justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-amber-800 flex items-center">
                  <span className="mr-2">🐔</span> Start Your Farming Journey
                </h2>
                <p className="text-base text-amber-700 mb-6">
                  Build your chicken farm empire! Buy and manage different types of chickens,
                  gather resources, and earn profits through egg production.
                </p>
                
                <div className="grid gap-4 mb-8">
                  <motion.div 
                    className="bg-white p-4 rounded-lg shadow-md border border-amber-100"
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <h3 className="text-lg font-semibold mb-2 text-amber-800 flex items-center">
                      <span className="mr-2">💰</span> Earn Real Money
                    </h3>
                    <p className="text-sm text-amber-700">
                      Convert your in-game earnings to real USDT cryptocurrency!
                    </p>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-white p-4 rounded-lg shadow-md border border-amber-100"
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <h3 className="text-lg font-semibold mb-2 text-amber-800 flex items-center">
                      <span className="mr-2">🥚</span> Hatch and Collect
                    </h3>
                    <p className="text-sm text-amber-700">
                      Hatch eggs, collect resources, and upgrade your farm efficiently.
                    </p>
                  </motion.div>
                </div>
              </div>
              
              <motion.div 
                className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 p-4 rounded-lg border border-amber-200"
                animate={{ scale: showAnimation ? [1, 1.02, 1] : 1 }}
                transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
              >
                <h3 className="text-xl font-bold mb-2 text-amber-800">Referral Program</h3>
                <p className="text-sm text-amber-700">
                  Share your referral code with friends and earn 10% commission on their deposits!
                  Start building your network and increase your earnings today.
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Mobile version of info panel */}
        <motion.div 
          className="md:hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="border-2 border-amber-200 overflow-hidden bg-gradient-to-r from-orange-50 to-amber-50">
            <CardContent className="p-4">
              <h3 className="text-lg font-bold mb-2 text-amber-800 flex items-center">
                <span className="mr-2">🔥</span> Referral Program
              </h3>
              <p className="text-sm text-amber-700">
                Share your referral code with friends and earn 10% commission on their deposits!
                Build your network and boost your earnings.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}