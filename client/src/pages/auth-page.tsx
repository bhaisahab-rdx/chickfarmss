import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Redirect, useLocation, useNavigate } from "wouter";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [location, setLocation] = useLocation();

  // Get referral code and redirect path from URL if present
  const params = new URLSearchParams(window.location.search);
  const referralCode = params.get('ref');
  const redirectPath = params.get('redirect') || '/home'; // Default to '/home' if no redirect is specified

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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="grid md:grid-cols-2 gap-4 sm:gap-8 w-full max-w-4xl">
        <Card className="shadow-md">
          <CardHeader className="pb-2 sm:pb-4">
            <div className="flex flex-col items-center space-y-2 sm:space-y-4 mb-2 sm:mb-4">
              <img src="/assets/chickfarms-logo.png" className="h-16 sm:h-24 w-auto" alt="ChickFarms" />
              <CardTitle className="text-center text-lg sm:text-xl">Welcome to ChickFarms</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form 
                    onSubmit={loginForm.handleSubmit(async (data) => {
                      await loginMutation.mutateAsync(data);
                      handleLoginSuccess();
                    })} 
                    className="space-y-3 sm:space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">Username</FormLabel>
                          <FormControl>
                            <Input {...field} className="h-9 sm:h-10 text-sm" />
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
                          <FormLabel className="text-xs sm:text-sm">Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} className="h-9 sm:h-10 text-sm" />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full h-9 sm:h-10 text-sm mt-2">Login</Button>
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
                    className="space-y-3 sm:space-y-4"
                  >
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">Username</FormLabel>
                          <FormControl>
                            <Input {...field} className="h-9 sm:h-10 text-sm" />
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
                          <FormLabel className="text-xs sm:text-sm">Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} className="h-9 sm:h-10 text-sm" />
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
                          <FormLabel className="text-xs sm:text-sm">Referral Code (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} className="h-9 sm:h-10 text-sm" />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full h-9 sm:h-10 text-sm mt-2">Register</Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="hidden md:block bg-primary/10 rounded-lg p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Start Your Farming Journey</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Build your chicken farm empire! Buy and manage different types of chickens,
            gather resources, and earn profits through egg production.
          </p>
          <div className="bg-background/50 p-4 rounded">
            <h3 className="text-base sm:text-lg font-semibold mb-2">Referral Program</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Share your referral code with friends and earn 10% commission on their deposits!
              Start building your network and increase your earnings today.
            </p>
          </div>
        </div>

        {/* Mobile version of info panel */}
        <div className="md:hidden bg-primary/10 rounded-lg p-4 mt-2">
          <h3 className="text-base font-semibold mb-2">Referral Program</h3>
          <p className="text-xs text-muted-foreground">
            Share your referral code with friends and earn 10% commission on their deposits!
          </p>
        </div>
      </div>
    </div>
  );
}