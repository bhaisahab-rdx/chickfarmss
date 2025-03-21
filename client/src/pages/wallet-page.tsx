import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, Copy } from "lucide-react";
import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';
import BalanceBar from "@/components/balance-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const rechargeSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("USD"),
  payCurrency: z.string().default("USDT"),
});

const withdrawalSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  usdtAddress: z.string().min(5, "USDT address is required").max(100, "USDT address too long"),
});

interface WalletAddress {
  network: string;
  address: string;
}

export default function WalletPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedNetwork, setSelectedNetwork] = useState("ethereum");

  // Get tab from URL if present
  const params = new URLSearchParams(window.location.search);
  const defaultTab = params.get('tab') || 'recharge';

  const walletAddressesQuery = useQuery<{
    ethereumAddress: string;
    tronAddress: string;
    bnbAddress: string;
  }>({
    queryKey: ["/api/admin/wallet-addresses"],
  });

  const rechargeForm = useForm({
    resolver: zodResolver(rechargeSchema),
    defaultValues: {
      amount: 0,
      currency: "USD",
      payCurrency: "USDT",
    },
  });

  const withdrawalForm = useForm({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 0,
      usdtAddress: "",
    },
  });

  const networkAddresses = {
    ethereum: walletAddressesQuery.data?.ethereumAddress || "0x2468BD1f5B493683b6550Fe331DC39CC854513D2",
    tron: walletAddressesQuery.data?.tronAddress || "TS59qaK6YfN7fvWwffLuvKzzpXDGTBh4dq",
    bnb: walletAddressesQuery.data?.bnbAddress || "bnb1uljaarnxpaug9uvxhln6dyg6w0zeasctn4puvp",
  };

  const networkLabels = {
    ethereum: "USDT (ERC20) - Ethereum",
    tron: "USDT (TRC20) - Tron",
    bnb: "USDT (BEP2) - BNB Beacon Chain",
  };

  // Add state to track payment information
  const [paymentDetails, setPaymentDetails] = useState<{
    paymentId: string;
    address: string;
    amount: number;
    currency: string;
  } | null>(null);
  
  // Add state to track payment status
  const [checkingPayment, setCheckingPayment] = useState(false);

  const rechargeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof rechargeSchema>) => {
      return await apiRequest("POST", "/api/wallet/recharge", data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });

      // Store payment details for QR code and display
      if (response?.payment) {
        setPaymentDetails({
          paymentId: response.payment.paymentId,
          address: response.payment.address,
          amount: response.payment.amount,
          currency: response.payment.currency,
        });
        
        // Set up payment status polling (every 15 seconds)
        const checkPaymentStatus = async () => {
          try {
            setCheckingPayment(true);
            const statusResponse = await apiRequest(
              "GET", 
              `/api/payments/${response.payment.paymentId}/status`
            );
            
            if (statusResponse?.payment?.status === 'finished') {
              queryClient.invalidateQueries({ queryKey: ["/api/user"] });
              toast({
                title: "Payment Completed",
                description: "Your payment has been confirmed and your balance has been updated.",
              });
              setPaymentDetails(null);
              rechargeForm.reset();
              // Clear the polling interval
              return true;
            } else if (
              statusResponse?.payment?.status === 'failed' || 
              statusResponse?.payment?.status === 'expired'
            ) {
              toast({
                title: "Payment Failed",
                description: "Your payment could not be processed. Please try again.",
                variant: "destructive",
              });
              setPaymentDetails(null);
              // Clear the polling interval
              return true;
            }
            setCheckingPayment(false);
            return false;
          } catch (error) {
            console.error("Error checking payment status:", error);
            setCheckingPayment(false);
            return false;
          }
        };
        
        // Check immediately
        checkPaymentStatus();
        
        // Then check every 15 seconds
        const interval = setInterval(async () => {
          const shouldClearInterval = await checkPaymentStatus();
          if (shouldClearInterval) {
            clearInterval(interval);
          }
        }, 15000);
        
        // Clear the interval when component unmounts
        return () => clearInterval(interval);
      }

      toast({
        title: "Payment Initiated",
        description: "Please complete the payment to add funds to your account.",
      });
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

  // No longer needed with NOWPayments but keeping as a placeholder in case we need manual deposit option in the future
  const handleCopyAddress = () => {
    // This function is not used anymore since we're using NOWPayments
    toast({
      title: "Using NOWPayments",
      description: "We now use automatic payment processing with NOWPayments.",
    });
  };

  const [qrCodeData, setQrCodeData] = useState("");

  useEffect(() => {
    // If we have payment details, show payment QR code
    if (paymentDetails) {
      setQrCodeData(`${paymentDetails.currency}:${paymentDetails.address}?amount=${paymentDetails.amount}`);
    } else {
      // Just show a preview based on the form amount
      const amount = rechargeForm.watch("amount");
      setQrCodeData(`usdt:preview?amount=${amount}`);
    }
  }, [rechargeForm.watch("amount"), paymentDetails]);

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-primary/10 p-2 sm:p-4 rounded-lg text-center space-y-1 sm:space-y-2">
                      {paymentDetails ? (
                        <>
                          <QRCodeSVG
                            value={qrCodeData}
                            size={150}
                            className="mx-auto bg-white p-2 rounded-md"
                          />
                          <p className="text-xs sm:text-sm font-medium">Scan QR to pay with {paymentDetails.currency}</p>
                          <p className="text-xs text-muted-foreground">
                            Send exactly {paymentDetails.amount} {paymentDetails.currency} to complete your payment
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="relative mx-auto w-[150px] h-[150px] flex items-center justify-center bg-white/70 p-2 rounded-md">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <p className="text-xs text-muted-foreground p-4 text-center">
                                Enter an amount and click "Create Payment" to generate a QR code
                              </p>
                            </div>
                            <QRCodeSVG
                              value={qrCodeData}
                              size={150}
                              className="mx-auto opacity-20"
                            />
                          </div>
                          <p className="text-xs sm:text-sm font-medium">NOWPayments Cryptocurrency Gateway</p>
                          <p className="text-xs text-muted-foreground">
                            Secure, fast, and automated cryptocurrency payments
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {paymentDetails ? (
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="text-center">
                        <h3 className="font-semibold text-sm sm:text-base mb-1">Payment in Progress</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {checkingPayment 
                            ? "Checking payment status..." 
                            : "Please complete payment to the address below"}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="bg-white p-2 rounded border border-gray-200">
                          <p className="text-xs text-muted-foreground">Payment Amount</p>
                          <p className="font-mono font-medium">{paymentDetails.amount} {paymentDetails.currency}</p>
                        </div>
                        
                        <div className="bg-white p-2 rounded border border-gray-200">
                          <p className="text-xs text-muted-foreground">Payment Address</p>
                          <div className="flex items-center">
                            <code className="font-mono text-xs sm:text-sm flex-1 break-all">
                              {paymentDetails.address}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              className="ml-2 h-7 w-7"
                              onClick={() => {
                                navigator.clipboard.writeText(paymentDetails.address);
                                toast({
                                  title: "Address Copied",
                                  description: "The payment address has been copied to your clipboard."
                                });
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="bg-white p-2 rounded border border-gray-200">
                          <p className="text-xs text-muted-foreground">Payment ID</p>
                          <p className="font-mono text-xs">{paymentDetails.paymentId}</p>
                        </div>
                      </div>
                      
                      <div className="text-center text-xs text-muted-foreground pt-2">
                        <p>Once payment is sent, we'll automatically detect it and update your balance.</p>
                        <Button 
                          variant="link" 
                          className="text-xs p-0 h-auto"
                          onClick={() => setPaymentDetails(null)}
                        >
                          Cancel and start over
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Form {...rechargeForm}>
                      <form
                        onSubmit={rechargeForm.handleSubmit((data) =>
                          rechargeMutation.mutate(data)
                        )}
                        className="space-y-3 sm:space-y-4"
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
                                  className="h-8 sm:h-10 text-sm"
                                  onChange={(e) =>
                                    field.onChange(parseFloat(e.target.value))
                                  }
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full h-8 sm:h-10 text-xs sm:text-sm mt-2"
                          disabled={rechargeMutation.isPending}
                        >
                          Create Payment
                        </Button>
                        
                        <p className="text-xs text-center text-muted-foreground">
                          Powered by NOWPayments - Secure Cryptocurrency Payment Processing
                        </p>
                      </form>
                    </Form>
                  )}
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
                                field.onChange(parseFloat(e.target.value))
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
                      className="w-full h-8 sm:h-10 text-xs sm:text-sm mt-2"
                      disabled={withdrawalMutation.isPending}
                    >
                      Withdraw USDT
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