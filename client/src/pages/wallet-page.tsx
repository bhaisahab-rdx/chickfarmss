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
import { Copy, AlertTriangle, Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const rechargeSchema = z.object({
  amount: z.number().min(10, "Amount must be at least 10 USDT")
});

const withdrawalSchema = z.object({
  amount: z.number().min(10, "Minimum withdrawal is 10 USDT"),
  usdtAddress: z.string().min(5, "Enter a valid USDT address"),
});

// Payment status mapping
const paymentStatusColors: Record<string, string> = {
  waiting: "bg-blue-100 text-blue-800 border-blue-200",
  confirming: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  sending: "bg-violet-100 text-violet-800 border-violet-200",
  partially_paid: "bg-amber-100 text-amber-800 border-amber-200",
  finished: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  refunded: "bg-gray-100 text-gray-800 border-gray-200",
  expired: "bg-gray-100 text-gray-800 border-gray-200",
};

const paymentStatusLabels: Record<string, string> = {
  waiting: "Waiting for Payment",
  confirming: "Confirming Transaction",
  confirmed: "Payment Confirmed",
  sending: "Processing Payment",
  partially_paid: "Partially Paid",
  finished: "Payment Complete",
  failed: "Payment Failed",
  refunded: "Payment Refunded",
  expired: "Payment Expired",
};

export default function WalletPage() {
  // State for payment flow
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<any>(null);
  const [paymentPollingInterval, setPaymentPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Get URL parameter for the active tab
  const [_, setLocation] = useLocation();
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const paymentStatus = searchParams.get('payment');
  const paymentId = searchParams.get('payment_id');
  const defaultTab = searchParams.get('tab') === 'withdraw' ? 'withdraw' : 'recharge';

  // Show payment success/failure message based on URL parameter
  const { toast } = useToast();
  const { user } = useAuth();

  // Check payment service status
  const paymentServiceQuery = useQuery({
    queryKey: ["/api/public/payments/service-status"],
    refetchOnWindowFocus: false,
  });

  const isPaymentServiceReady = paymentServiceQuery.data?.ready === true;
  const minPaymentAmount = paymentServiceQuery.data?.minAmount || 10;

  // Transaction query - used when returning from payment
  const transactionQuery = useQuery({
    queryKey: ["/api/payments/status", paymentId],
    enabled: !!paymentId,
    refetchInterval: paymentId ? 5000 : false, // Poll every 5 seconds if we have a payment ID
  });

  // Form setup with dynamic minimum amount from API
  const rechargeForm = useForm<z.infer<typeof rechargeSchema>>({
    resolver: zodResolver(rechargeSchema),
    defaultValues: {
      amount: minPaymentAmount
    },
  });

  // Update the minimum amount when we get it from the API
  useEffect(() => {
    if (paymentServiceQuery.isSuccess && paymentServiceQuery.data?.minAmount) {
      rechargeForm.setValue('amount', paymentServiceQuery.data.minAmount);
    }
  }, [paymentServiceQuery.isSuccess, paymentServiceQuery.data?.minAmount]);

  const withdrawalForm = useForm<z.infer<typeof withdrawalSchema>>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 10,
      usdtAddress: "",
    },
  });

  // Mutation for creating a new payment
  const createPaymentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof rechargeSchema>) => {
      return await apiRequest("POST", "/api/payments/create-invoice", data);
    },
    onSuccess: (data) => {
      // Open payment dialog with the payment details
      // The server returns invoiceId and invoiceUrl, so we need to format it for our UI
      const payment = {
        id: data.invoiceId,
        paymentUrl: data.invoiceUrl,
        status: "pending",
        amount: rechargeForm.getValues().amount.toString()
      };
      
      setCurrentPayment(payment);
      setPaymentDialogOpen(true);
      
      // Start polling for payment status
      if (paymentPollingInterval) clearInterval(paymentPollingInterval);
      const interval = setInterval(() => {
        checkPaymentStatus(data.invoiceId);
      }, 10000); // Check every 10 seconds
      setPaymentPollingInterval(interval);
      
      // Invalidate user data query to refresh balance
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Automatically open the payment URL in a new tab
      window.open(data.invoiceUrl, '_blank');
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Creation Failed",
        description: error.message || "Failed to create payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Check payment status directly
  const checkPaymentStatus = async (paymentId: string) => {
    try {
      const response = await apiRequest("GET", `/api/payments/status/${paymentId}`);
      console.log("[API Response] Status Data:", response);
      
      // The response comes directly as payment data, not nested under a 'payment' property
      setCurrentPayment({
        ...currentPayment,
        ...response,
        id: paymentId // Ensure we keep the ID
      });
      
      // If payment is completed, stop polling and show success message
      if (response.status === "finished" || response.status === "completed") {
        if (paymentPollingInterval) clearInterval(paymentPollingInterval);
        toast({
          title: "Payment Completed",
          description: "Your payment has been processed successfully!",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      }
      
      return response;
    } catch (error) {
      console.error("Error checking payment status:", error);
      return null;
    }
  };

  // Handle manual refresh of payment status
  const handleRefreshPaymentStatus = () => {
    if (currentPayment?.id) {
      checkPaymentStatus(currentPayment.id);
    }
  };

  // Effect to check URL parameters for payment status
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
    
    // Check for payment ID in the URL
    if (paymentId) {
      // Show payment dialog with the payment details from transaction query
      if (transactionQuery.isSuccess && transactionQuery.data) {
        // The transaction data comes directly, not nested under 'payment'
        const paymentData = {
          ...transactionQuery.data,
          id: paymentId // Ensure we have the ID
        };
        
        setCurrentPayment(paymentData);
        setPaymentDialogOpen(true);
        
        // Start polling for payment status
        if (paymentPollingInterval) clearInterval(paymentPollingInterval);
        const interval = setInterval(() => {
          checkPaymentStatus(paymentId);
        }, 10000); // Check every 10 seconds
        setPaymentPollingInterval(interval);
      }
    }
  }, [paymentStatus, paymentId, transactionQuery.isSuccess, transactionQuery.data]);

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (paymentPollingInterval) clearInterval(paymentPollingInterval);
    };
  }, [paymentPollingInterval]);

  // Handle close of payment dialog
  const handlePaymentDialogClose = () => {
    if (paymentPollingInterval) clearInterval(paymentPollingInterval);
    setPaymentDialogOpen(false);
    setCurrentPayment(null);
    
    // Remove payment_id from URL if present
    if (paymentId) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Withdrawal mutation
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

  // Scroll to top on page load
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
                          USDT Deposit (TRC20)
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                          Add funds to your wallet using USDT TRC20. Minimum deposit amount is {minPaymentAmount} USDT.
                        </p>
                      </div>
                      
                      {/* Status indicator */}
                      {paymentServiceQuery.isLoading ? (
                        <div className="bg-gray-100 text-gray-700 px-4 py-3 rounded-lg border border-gray-200 flex items-center gap-2 justify-center">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Checking payment service status...</span>
                        </div>
                      ) : !isPaymentServiceReady ? (
                        <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg border border-red-200">
                          <p className="text-sm font-medium">Payment Service Unavailable</p>
                          <p className="text-xs mt-1">Please try again later or contact support for assistance.</p>
                        </div>
                      ) : (
                        <Form {...rechargeForm}>
                          <form
                            onSubmit={rechargeForm.handleSubmit((data) =>
                              createPaymentMutation.mutate(data)
                            )}
                            className="space-y-4"
                          >
                            <FormField
                              control={rechargeForm.control}
                              name="amount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs sm:text-sm">Deposit Amount (USDT)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      className="h-8 sm:h-10 text-sm"
                                      onChange={(e) =>
                                        field.onChange(parseFloat(e.target.value) || minPaymentAmount)
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            
                            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-800 text-left">
                              <p className="font-medium">Important Information:</p>
                              <ul className="list-disc pl-4 mt-1 space-y-1">
                                <li>Use only USDT on the Tron (TRC20) network</li>
                                <li>Minimum deposit: {minPaymentAmount} USDT</li>
                                <li>Deposits are typically credited within 10-30 minutes</li>
                                <li>Save the payment link for your records</li>
                              </ul>
                            </div>
                            
                            <Button
                              type="submit"
                              className="w-full h-10 text-sm sm:text-base"
                              disabled={createPaymentMutation.isPending || !isPaymentServiceReady}
                            >
                              {createPaymentMutation.isPending ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Creating Payment...
                                </>
                              ) : (
                                "Create USDT Deposit"
                              )}
                            </Button>
                          </form>
                        </Form>
                      )}
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
      
      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={(open) => {
        // Only allow closing if we're not in the middle of processing
        if (!createPaymentMutation.isPending) {
          setPaymentDialogOpen(open);
          // Reset state when closing dialog
          if (!open) {
            setCurrentPayment(null);
            if (paymentPollingInterval) clearInterval(paymentPollingInterval);
          }
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">USDT Payment</DialogTitle>
            <DialogDescription className="text-center">
              Complete your payment to add funds to your account
            </DialogDescription>
          </DialogHeader>
          
          {/* Show loading spinner when payment is being created */}
          {createPaymentMutation.isPending && (
            <div className="py-8 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-center">Creating payment...</p>
            </div>
          )}
          
          {/* Show payment details once payment is created */}
          {!createPaymentMutation.isPending && currentPayment && (
            <div className="space-y-4">
              {/* Payment Status */}
              <div className="text-center space-y-2">
                <Badge 
                  className={`${paymentStatusColors[currentPayment.status] || 'bg-gray-100 text-gray-800 border-gray-200'} py-1 px-4 text-sm border`}
                >
                  {paymentStatusLabels[currentPayment.status] || currentPayment.status}
                </Badge>
                
                <p className="text-sm text-gray-500">
                  Amount: <span className="font-semibold">{currentPayment.amount} USDT</span>
                </p>
              </div>
              
              {/* QR Code and Payment Address (if available) */}
              {currentPayment.payAddress && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-center">
                    <QRCodeSVG 
                      value={`tron:${currentPayment.payAddress}?amount=${currentPayment.amount}`}
                      size={180}
                      className="mx-auto border-4 border-white rounded-lg"
                    />
                  </div>
                  
                  <div className="text-center space-y-1">
                    <p className="text-xs text-gray-500">Send exactly <span className="font-semibold">{currentPayment.amount} USDT</span> to:</p>
                    <p className="text-xs bg-white p-2 rounded-md border overflow-hidden overflow-ellipsis font-mono">
                      {currentPayment.payAddress}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs h-7"
                      onClick={() => {
                        navigator.clipboard.writeText(currentPayment.payAddress);
                        toast({
                          title: "Address Copied",
                          description: "Payment address copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy Address
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Payment Link */}
              {currentPayment.paymentUrl && (
                <div className="space-y-2">
                  <p className="text-xs text-center text-gray-500">Or complete your payment through our payment processor:</p>
                  <Button
                    className="w-full text-xs h-9"
                    onClick={() => window.open(currentPayment.paymentUrl, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" /> Open Payment Page
                  </Button>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={handleRefreshPaymentStatus}
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Refresh Status
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs"
                  onClick={handlePaymentDialogClose}
                >
                  Close
                </Button>
              </div>
              
              {/* Help Text */}
              <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
                <p className="font-medium">Need help?</p>
                <p>
                  If you've already sent the payment but it's not showing up, please wait a few minutes for the transaction to be confirmed on the blockchain.
                </p>
                <p>
                  For technical assistance, please contact support with your payment ID: <span className="font-mono bg-gray-100 px-1 rounded">{currentPayment.id}</span>
                </p>
              </div>
            </div>
          )}
          
          {/* Error state */}
          {!createPaymentMutation.isPending && !currentPayment && createPaymentMutation.isError && (
            <div className="py-6 flex flex-col items-center justify-center gap-4">
              <div className="bg-red-100 text-red-800 p-4 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <p className="text-sm">Failed to create payment. Please try again.</p>
              </div>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={handlePaymentDialogClose}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}