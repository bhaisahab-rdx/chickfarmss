import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader } from '@/components/ui/loader';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface PaymentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialAmount?: number;
}

export function PaymentPopup({ isOpen, onClose, onSuccess, initialAmount = 10 }: PaymentPopupProps) {
  const [amount, setAmount] = useState<number>(initialAmount);
  const [isLoading, setIsLoading] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string | undefined>(undefined);
  const [invoiceId, setInvoiceId] = useState<string | undefined>(undefined);
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);
  const [serviceStatus, setServiceStatus] = useState<{
    apiConfigured: boolean;
    ipnConfigured: boolean;
    serviceStatus: string;
    error?: string;
    ready?: boolean;
  } | undefined>(undefined);
  const { toast } = useToast();
  const auth = useAuth();
  
  // Check NOWPayments service status when the component is opened
  useEffect(() => {
    if (isOpen) {
      // Check payment service status
      checkPaymentServiceStatus();
      
      // Update amount when popup opens (to sync with parent component)
      if (initialAmount && initialAmount > 0) {
        console.log('Setting initial amount from props:', initialAmount);
        setAmount(initialAmount);
      } else {
        // Default to 10 if no valid amount is provided
        console.log('No valid initial amount, using default of 10');
        setAmount(10);
      }
    }
    
    // Clean up payment window if component unmounts
    return () => {
      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.close();
      }
    };
  }, [isOpen, initialAmount]);
  
  // Function to check the NOWPayments service status
  const checkPaymentServiceStatus = async () => {
    try {
      // Using apiRequest so we get logging and error handling
      // This endpoint is now public and doesn't require authentication
      const data = await apiRequest('GET', '/api/public/payments/service-status');
      setServiceStatus(data);
      
      console.log('Payment service status:', data);
      
      if (!data.apiConfigured) {
        toast({
          title: 'Payment Service Notice',
          description: 'Crypto payment service requires configuration. Please contact support for assistance.',
          variant: 'destructive'
        });
      } else if (data.error) {
        toast({
          title: 'Payment Service Error',
          description: `Connection issue: ${data.error}. Please try again later.`,
          variant: 'destructive'
        });
      } else if (data.serviceStatus !== 'OK' && data.serviceStatus !== 'ok') {
        toast({
          title: 'Payment Service Status',
          description: `Payment service is currently ${data.serviceStatus}. You may experience delays in processing.`,
          variant: 'destructive'
        });
      } else if (data.ready) {
        // Service is configured and running properly
        toast({
          title: 'Payment Service Ready',
          description: 'Cryptocurrency payment service is active and ready to accept payments.',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Error checking payment service status:', error);
      setServiceStatus(undefined);
      
      toast({
        title: 'Connection Error',
        description: 'Unable to verify payment service status. Please check your connection and try again.',
        variant: 'destructive'
      });
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setAmount(isNaN(value) ? 0 : value);
  };

  const createInvoice = async () => {
    if (!amount || amount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount greater than 0',
        variant: 'destructive'
      });
      return;
    }

    console.log('Creating invoice with amount:', amount);
    setIsLoading(true);

    try {
      let response;
      console.log('Step 1: Initiating payment request process');
      
      // Check if the user is authenticated
      if (auth.user) {
        // Authenticated user - use the regular endpoint
        console.log('Creating invoice for authenticated user:', auth.user.id);
        try {
          console.log('Sending request to /api/wallet/recharge with data:', {
            amount, 
            currency: 'USD',
            payCurrency: 'USDTTRC20',
            useInvoice: true,
            useFallback: true // Enable fallback to dev mode if API fails
          });
          
          response = await apiRequest('POST', '/api/wallet/recharge', {
            amount, 
            currency: 'USD',
            payCurrency: 'USDTTRC20', // Explicitly specify USDT on Tron network for payment
            useInvoice: true, // Always use the invoice system for official NOWPayments page
            useFallback: true // Enable fallback to dev mode if API fails
          });
          
          console.log('Step 2: Received response from server:', response);
        } catch (error) {
          console.error('Error in API request:', error);
          
          // If the API request fails, try the fallback test payment
          try {
            console.log('API request failed, trying fallback test payment');
            // Create a fallback URL directly rather than making another API call
            const fallbackTxId = `TEST-${auth.user.id}-${Date.now()}`;
            const fallbackUrl = `/dev-payment.html?invoice=${fallbackTxId}&amount=${amount}&currency=USD&success=${encodeURIComponent('/wallet?payment=success')}&cancel=${encodeURIComponent('/wallet?payment=cancelled')}`;
            
            // Return a mock response that matches the expected format
            response = {
              success: true,
              fallbackTxId,
              fallbackUrl,
              message: 'Using fallback test payment due to API error'
            };
            
            console.log('Created fallback payment URL:', fallbackUrl);
          } catch (fallbackError) {
            console.error('Error creating fallback payment:', fallbackError);
            throw error; // Throw the original error if fallback fails
          }
        }
      } else {
        // Use the public test endpoint for debugging or when not authenticated
        console.log('Using test invoice endpoint (not authenticated) with amount:', amount);
        try {
          response = await apiRequest('POST', '/api/public/payments/test-invoice', {
            amount,
            currency: 'USD',
            payCurrency: 'USDTTRC20', // Explicitly specify USDT on Tron network for payment
            useInvoice: true // Always use the invoice system for official NOWPayments page
          });
          console.log('Step 2: Received response from test endpoint:', response);
        } catch (error) {
          console.error('Error in API request to test endpoint:', error);
          throw error;
        }
      }

      console.log('Invoice creation response:', response);
      
      if (response && response.invoice && response.invoice.invoiceUrl) {
        // Set the invoice URL from the nested invoice object
        setInvoiceUrl(response.invoice.invoiceUrl);
        setInvoiceId(response.invoice.id);
        
        // Save payment info in localStorage before redirecting
        localStorage.setItem('paymentStarted', Date.now().toString());
        localStorage.setItem('paymentAmount', amount.toString());
        if (response.invoice.id) {
          localStorage.setItem('paymentInvoiceId', response.invoice.id);
        }
        
        console.log('Redirecting to payment URL:', response.invoice.invoiceUrl);
        
        if (response.invoice.invoiceUrl.includes('dev-payment.html')) {
          // Mock payment mode (for development environment)
          // Shows the invoice in a new window instead of redirecting
          console.log('DEVELOPMENT MODE: Opening mock payment page instead of redirecting');
          setPaymentWindow(window.open(response.invoice.invoiceUrl, '_blank'));
          
          // Notify user this is a test mode 
          toast({
            title: 'Development Mode',
            description: 'Using test payment system. In production, you would be redirected to NOWPayments.',
            duration: 5000,
          });
        } else {
          // Direct page redirect - this is the key change that fixes the redirect issue
          // We use setTimeout to ensure all state is saved before redirecting
          setTimeout(() => {
            window.location.href = response.invoice.invoiceUrl;
          }, 300);
        }
      } else if (response && response.fallbackUrl) {
        // Fallback for when real API fails but we have a test payment URL
        console.log('Using fallback test payment URL:', response.fallbackUrl);
        setInvoiceUrl(response.fallbackUrl);
        setInvoiceId(response.fallbackTxId || 'test-tx');
        
        // Save test payment info
        localStorage.setItem('paymentStarted', Date.now().toString());
        localStorage.setItem('paymentAmount', amount.toString());
        localStorage.setItem('paymentInvoiceId', response.fallbackTxId || 'test-tx');
        
        // Open in new window instead of redirect for test payments
        setPaymentWindow(window.open(response.fallbackUrl, '_blank'));
        
        toast({
          title: 'Test Payment Mode',
          description: 'Using test payment system since the payment provider is unavailable.',
          duration: 5000,
        });
      } else {
        console.error('Invalid invoice response format:', response);
        throw new Error('Failed to create payment invoice: Invalid response format from server');
      }
    } catch (error) {
      console.error('Error creating payment invoice:', error);
      
      // Provide more specific error messages based on common error types
      if (error instanceof Error) {
        if (error.message.includes('minimum amount')) {
          toast({
            title: 'Minimum Amount Error',
            description: 'Amount is below the minimum required for cryptocurrency payments. Please enter a higher amount.',
            variant: 'destructive'
          });
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
          toast({
            title: 'Network Error',
            description: 'Unable to connect to payment provider. Please check your internet connection and try again.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Payment Error',
            description: error.message,
            variant: 'destructive'
          });
        }
      } else {
        toast({
          title: 'Payment Service Error',
          description: 'Failed to create payment. Our payment service may be experiencing issues. Please try again later.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // In-page redirect happens automatically in the createInvoice function
  // We no longer need multiple functions to handle window/tab opening
  
  const handlePaymentWindowClosed = async () => {
    // Only check status and refresh user data if authenticated and we have an invoice ID
    if (auth.user && invoiceId) {
      try {
        setIsLoading(true);
        
        // Check if the payment was completed successfully
        const statusResponse = await apiRequest('GET', `/api/payments/status/${invoiceId}`);
        
        if (statusResponse && statusResponse.status === 'completed') {
          // Payment was successful
          toast({
            title: 'Payment Completed',
            description: `Your deposit of $${amount} was successful and has been added to your balance.`,
            variant: 'default'
          });
          
          // Refresh user data to update balance display
          auth.loginMutation.mutate({ 
            username: auth.user.username || '', 
            password: '' // Password isn't needed for refresh
          });
          
          if (onSuccess) onSuccess();
          resetForm(); // Close the dialog
        } else if (statusResponse && statusResponse.status === 'pending') {
          // Payment is still pending
          toast({
            title: 'Payment Pending',
            description: 'Your payment is being processed. Your balance will update once confirmed.',
            variant: 'default'
          });
          
          // Refresh user data anyway in case it's been updated
          auth.loginMutation.mutate({ 
            username: auth.user.username || '', 
            password: '' // Password isn't needed for refresh
          });
        } else {
          // Payment failed or was cancelled
          toast({
            title: 'Payment Incomplete',
            description: 'The payment window was closed before completing the payment.',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        
        // Refresh user data anyway in case it's been updated
        auth.loginMutation.mutate({ 
          username: auth.user.username || '', 
          password: '' // Password isn't needed for refresh
        }, {
          onSuccess: () => {
            if (onSuccess) onSuccess();
          }
        });
        
        toast({
          title: 'Payment Window Closed',
          description: 'If you completed the payment, your balance will be updated shortly.',
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // For test payments or anonymous users
      toast({
        title: 'Payment Window Closed',
        description: 'The payment window has been closed. If you completed the payment, your account will be updated shortly.',
      });
    }
  };

  const resetForm = () => {
    setInvoiceUrl(undefined);
    setInvoiceId(undefined);
    setPaymentWindow(null);
    onClose();
  };

  const closePaymentWindow = () => {
    if (paymentWindow && !paymentWindow.closed) {
      paymentWindow.close();
    }
    resetForm();
  };

  // No need for this function anymore as we use an inline function in the Button onClick

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) closePaymentWindow();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Deposit Funds</DialogTitle>
          <DialogDescription>
            Enter the amount you want to deposit. You'll be redirected to our secure payment processor.
          </DialogDescription>
        </DialogHeader>
        
        {!invoiceUrl ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount (USD)
              </Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={handleAmountChange}
                className="col-span-3"
                min={1}
                step={1}
                disabled={isLoading}
              />
            </div>
            
            {/* Payment method information */}
            <div className="bg-blue-50 text-blue-700 p-3 rounded-md text-sm">
              <p className="font-medium mb-1">💳 About Cryptocurrency Payments</p>
              <p className="text-xs">
                We use NOWPayments, a secure cryptocurrency payment processor. 
                Your deposit will be converted to USDT in your game wallet.
              </p>
              <p className="text-xs mt-1.5 font-medium">
                Preferred payment: USDT on Tron Network (TRC20)
              </p>
              <p className="text-xs mt-1 italic">
                Also accepts: BTC, ETH, LTC, DOGE, and 50+ other cryptocurrencies
              </p>
            </div>
            
            {/* Payment service status indicator */}
            {serviceStatus && (
              <div className={`text-xs px-3 py-2 rounded-md ${
                serviceStatus.ready ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
              }`}>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    serviceStatus.ready ? 'bg-green-500' : 'bg-amber-500'
                  }`}></div>
                  <span>
                    {serviceStatus.ready
                      ? 'Payment service connected and ready'
                      : serviceStatus.error 
                        ? `Payment service issue: ${serviceStatus.error}`
                        : 'Payment service status: ' + (serviceStatus.serviceStatus || 'unknown')}
                  </span>
                </div>
              </div>
            )}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-center items-center py-2">
                <Loader size="sm" className="mr-2" />
                <span className="text-sm">Connecting to payment service...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="mb-2 font-medium text-lg">Your payment gateway is ready</p>
            <p className="mb-4 text-sm text-muted-foreground">
              The official NOWPayments checkout window should have opened automatically.
              If it didn't, click the button below.
            </p>
            
            <div className="bg-amber-50 text-amber-700 p-3 rounded-md mb-4 text-sm">
              <p className="font-medium">💡 Important Payment Information</p>
              <p className="text-xs mt-1">Your payment will be securely processed by NOWPayments, our official payment partner.</p>
              <p className="text-xs mt-1.5 font-medium">USDT on Tron Network (TRC20) is the primary currency.</p>
              <p className="text-xs mt-1">The payment gateway will credit your game wallet automatically after payment confirmation.</p>
            </div>
            
            <Button 
              onClick={() => invoiceUrl && window.open(invoiceUrl, '_blank')}
              className="w-full mb-2"
              variant="default"
              size="lg"
            >
              Open Payment Gateway
            </Button>
            
            <div className="text-xs text-muted-foreground mt-3 bg-slate-50 p-2 rounded">
              {invoiceId && (
                <p className="mb-1">Transaction ID: <span className="font-mono">{invoiceId}</span></p>
              )}
              <p className="text-xs">After completing payment, your balance will update automatically.</p>
            </div>
            
            <div className="mt-4 text-xs text-muted-foreground">
              <p>Having trouble? Close this window and try again.</p>
            </div>
          </div>
        )}

        <DialogFooter>
          {!invoiceUrl ? (
            <Button 
              onClick={createInvoice} 
              disabled={isLoading || amount <= 0 || (serviceStatus && !serviceStatus.ready)}
              className="w-full sm:w-auto"
              size="lg"
            >
              {isLoading ? <Loader size="sm" className="mr-2" /> : null}
              {serviceStatus && !serviceStatus.ready 
                ? 'Payment Service Unavailable' 
                : isLoading ? 'Creating Payment...' : 'Pay with Any Cryptocurrency'}
            </Button>
          ) : (
            <Button variant="outline" onClick={closePaymentWindow}>
              Cancel Payment
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}