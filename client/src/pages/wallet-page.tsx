import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import BalanceBar from "@/components/balance-bar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Copy, AlertTriangle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
// Direct payment approach used instead of popup
// import { PaymentPopup } from "@/components/payment-popup";

const rechargeSchema = z.object({
  amount: z.number().min(1, "Amount must be at least 1 USDT"),
  currency: z.string().optional(),
  payCurrency: z.string().optional(),
  useInvoice: z.boolean().optional()
});

const withdrawalSchema = z.object({
  amount: z.number().min(10, "Minimum withdrawal is 10 USDT"),
  usdtAddress: z.string().min(5, "Enter a valid USDT address"),
});

export default function WalletPage() {
  // Get URL parameter for the active tab
  const [_, setLocation] = useLocation();
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const paymentStatus = searchParams.get('payment');
  const defaultTab = searchParams.get('tab') === 'withdraw' ? 'withdraw' : 'recharge';

  // Show payment success/failure message based on URL parameter
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Check for payment status in the URL
    if (paymentStatus === 'success') {
      toast({
        title: "Payment Completed",
        description: "Your payment has been processed. Your balance will be updated shortly.",
      });
      // Remove the query parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'cancelled') {
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled. No funds were transferred.",
        variant: "destructive",
      });
      // Remove the query parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [paymentStatus]);

  // Get wallet addresses
  const walletAddressesQuery = useQuery({
    queryKey: ["/api/wallet/addresses"],
    enabled: false, // We're using NOWPayments instead
  });

  // Form setup
  const rechargeForm = useForm<z.infer<typeof rechargeSchema>>({
    resolver: zodResolver(rechargeSchema),
    defaultValues: {
      amount: 10,
      currency: "USDT",
      payCurrency: "USDTTRC20", // Explicitly use USDT on Tron network
      useInvoice: true,
    },
  });

  const withdrawalForm = useForm<z.infer<typeof withdrawalSchema>>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 0,
      usdtAddress: "",
    },
  });

  // Direct payment without using popup - removed popup state variables
  
  // Function to handle direct payment redirect to NOWPayments
  const handleDirectPayment = async () => {
    // Get the amount from the form
    const currentAmount = rechargeForm.getValues().amount;
    
    // Validate amount
    if (!currentAmount || currentAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter an amount greater than 0 USDT",
        variant: "destructive"
      });
      return;
    }
    
    console.log("Initiating direct payment with amount:", currentAmount);
    
    try {
      // Call the recharge endpoint to get payment URL
      const response = await apiRequest("POST", "/api/wallet/recharge", {
        amount: currentAmount,
        currency: "USDT", 
        payCurrency: "USDTTRC20", // Explicitly use USDT on Tron network
        useInvoice: true
      });
      
      // Check if invoiceDetails contains an error
      if (response?.transaction?.bankDetails) {
        try {
          // Parse the bank details to check for API error
          const bankDetails = JSON.parse(response.transaction.bankDetails);
          
          if (bankDetails?.invoiceDetails?.code === "INVALID_API_KEY") {
            toast({
              title: "Payment Gateway Error",
              description: "The payment system is currently unavailable. Please contact support.",
              variant: "destructive"
            });
            return;
          }
        } catch (err) {
          console.error("Error parsing bank details:", err);
        }
      }
      
      if (response?.invoice?.invoiceUrl) {
        // Redirect user to NOWPayments invoice URL
        window.location.href = response.invoice.invoiceUrl;
        
        // The toast below might not be seen due to redirect
        toast({
          title: "Redirecting to Payment Portal",
          description: "Please complete your payment on the NOWPayments page.",
        });
      } else {
        toast({
          title: "Payment Processing Error",
          description: "Could not generate payment link. The payment gateway may be temporarily unavailable.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Recharge mutation for form submission (not currently used, but kept for future reference)
  // We're using direct payment with handleDirectPayment() instead
  const rechargeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof rechargeSchema>) => {
      // Direct payment with NOWPayments portal
      console.log("NOWPayments invoice payment initiated:", data.amount, data.currency);
      return await apiRequest("POST", "/api/wallet/recharge", {
        amount: data.amount,
        currency: data.currency || "USDT",
        payCurrency: data.payCurrency || "USDTTRC20", // Explicitly use USDT on Tron network
        useInvoice: true // Always use the invoice-based payment
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });

      // With direct payment approach, we're handling the redirect in handleDirectPayment()
      // This code is kept for reference but not actively used
      toast({
        title: "Payment Initiated",
        description: "Please complete the payment to add funds to your account.",
      });
      
      // Reset the form
      rechargeForm.reset({ amount: 10, currency: "USDT", payCurrency: "USDTTRC20", useInvoice: true });
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const withdrawalMutation = useMutation({
    mutationFn: async (data: z.infer<typeof withdrawalSchema>) => {
      return await apiRequest("POST", "/api/wallet/withdraw", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Withdrawal Initiated",
        description: "Your USDT withdrawal request has been processed.",
      });
      withdrawalForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add scroll reset effect
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-amber-50/50 to-white">
      <BalanceBar />

      <div className="flex-grow space-y-4 sm:space-y-6 px-3 sm:px-4 max-w-4xl mx-auto pb-20 md:pb-16 overflow-x-hidden">
        <div className="flex justify-between items-center pt-4">
          <h1 className="text-xl sm:text-2xl font-bold">Wallet</h1>
          <div className="text-right">
            <p className="text-xs sm:text-sm text-muted-foreground">USDT Balance</p>
            <p className="text-lg sm:text-2xl font-bold flex items-center justify-end gap-1 sm:gap-2">
              <img 
                src="/assets/tether-usdt-logo.png" 
                alt="USDT" 
                className="w-5 h-5 sm:w-6 sm:h-6"
                style={{ objectFit: "contain" }} 
              />
              ${user?.usdtBalance || 0}
            </p>
          </div>
        </div>
        
        {/* First Deposit Bonus Banner */}
        <div className="bg-gradient-to-r from-amber-100 to-yellow-50 border border-amber-200 rounded-lg p-2 sm:p-3 shadow-sm">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="bg-amber-500 text-white p-1.5 sm:p-2 rounded-full shrink-0">
              <div className="text-base sm:text-xl font-bold">10%</div>
            </div>
            <div>
              <h3 className="font-bold text-amber-800 text-base sm:text-lg">First Deposit Bonus!</h3>
              <p className="text-xs sm:text-sm text-amber-700">
                New users get an extra 10% bonus on their first deposit. Bonus is credited instantly to your account!
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue={defaultTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recharge">Recharge</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>

          <TabsContent value="recharge">
            <Card>
              <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-4">
                <CardTitle className="text-base sm:text-lg">Recharge Wallet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-primary/10 p-4 rounded-lg text-center space-y-2 sm:space-y-3">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm">
                        <img 
                          src="/assets/tether-usdt-logo.png" 
                          alt="USDT Logo" 
                          className="w-10 h-10 sm:w-12 sm:h-12"
                        />
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-base sm:text-lg">
                          Deposit USDT
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                          Securely deposit USDT using our cryptocurrency payment partner NOWPayments.
                        </p>
                      </div>
                      
                      <Form {...rechargeForm}>
                        <form
                          className="space-y-3 sm:space-y-4 max-w-sm mx-auto"
                        >
                          <FormField
                            control={rechargeForm.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs sm:text-sm">Amount (USDT)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    className="h-8 sm:h-10 text-sm text-center"
                                    onChange={(e) =>
                                      field.onChange(parseFloat(e.target.value) || 0)
                                    }
                                  />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                          
                          <Button
                            type="button"
                            className="w-full h-10 text-sm sm:text-base"
                            onClick={handleDirectPayment}
                            disabled={rechargeForm.getValues().amount <= 0}
                          >
                            💳 Pay with USDT-TRC20
                          </Button>
                          
                          <p className="text-xs text-center text-muted-foreground">
                            Powered by NOWPayments - Secure Cryptocurrency Payment Processing
                          </p>
                        </form>
                      </Form>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdraw">
            <Card>
              <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-4">
                <CardTitle className="text-base sm:text-lg">Withdraw USDT</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <Form {...withdrawalForm}>
                  <form
                    onSubmit={withdrawalForm.handleSubmit((data) =>
                      withdrawalMutation.mutate(data)
                    )}
                    className="space-y-3 sm:space-y-4"
                  >
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex gap-2 items-start mb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-amber-800">
                        <p className="font-medium">Withdrawal Fee: 5%</p>
                        <p>Minimum withdrawal amount is 10 USDT. Withdrawals are processed within 24 hours.</p>
                      </div>
                    </div>
                    
                    <FormField
                      control={withdrawalForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">Amount (USDT)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              className="h-8 sm:h-10 text-sm"
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={withdrawalForm.control}
                      name="usdtAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">USDT Address (TRC20)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="h-8 sm:h-10 text-sm"
                              placeholder="Enter your USDT TRC20 address"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-8 sm:h-10 text-xs sm:text-sm"
                      disabled={withdrawalMutation.isPending}
                    >
                      {withdrawalMutation.isPending
                        ? "Processing..."
                        : "Withdraw USDT"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}