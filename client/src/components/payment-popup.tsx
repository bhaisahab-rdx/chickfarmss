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
      
      // Check if the user is authenticated
      if (auth.user) {
        // Authenticated user - use the regular endpoint
        console.log('Creating invoice for authenticated user:', auth.user.id);
        response = await apiRequest('POST', '/api/wallet/recharge', {
          amount, 
          currency: 'USD',
          payCurrency: 'USDTTRC20', // Explicitly specify USDT on Tron network for payment
          useInvoice: true // Always use the invoice system for official NOWPayments page
        });
      } else {
        // Use the public test endpoint for debugging or when not authenticated
        console.log('Using test invoice endpoint (not authenticated) with amount:', amount);
        response = await apiRequest('POST', '/api/public/payments/test-invoice', {
          amount,
          currency: 'USD',
          payCurrency: 'USDTTRC20', // Explicitly specify USDT on Tron network for payment
          useInvoice: true // Always use the invoice system for official NOWPayments page
        });
      }

      console.log('Invoice creation response:', response);
      
      if (response.success && response.invoiceUrl) {
        setInvoiceUrl(response.invoiceUrl);
        setInvoiceId(response.invoiceId);
        
        // Open the NOWPayments checkout in a new window
        openPaymentWindow(response.invoiceUrl);
      } else {
        throw new Error('Failed to create payment invoice');
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

  const openPaymentWindow = (url: string) => {
    // Close previous window if exists
    if (paymentWindow && !paymentWindow.closed) {
      paymentWindow.close();
    }
    
    try {
      // Open in _blank to ensure a new window/tab and not inside iframe
      const newWindow = window.open(
        url, 
        '_blank', 
        'noopener,noreferrer,width=450,height=600,scrollbars=yes'
      );
      
      // Handle popup blocked case
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        toast({
          title: 'Popup Blocked',
          description: 'Your browser blocked the payment window. Click "Open Payment Gateway" below.',
          variant: 'destructive'
        });
        return;
      }
      
      // Try to focus the window
      try {
        newWindow.focus();
      } catch (focusError) {
        console.log('Unable to focus payment window');
      }
      
      // Store reference and monitor window state
      setPaymentWindow(newWindow);
      const checkWindowClosed = setInterval(() => {
        if (newWindow.closed) {
          clearInterval(checkWindowClosed);
          handlePaymentWindowClosed();
        }
      }, 1000);
    } catch (error) {
      console.error('Error opening payment window:', error);
      toast({
        title: 'Browser Error',
        description: 'Unable to open payment window. Please use the "Open Payment Gateway" button below.',
        variant: 'destructive'
      });
    }
  };
  
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

  // Handle direct link opening (without popup)
  const openPaymentLink = () => {
    if (invoiceUrl) {
      // Open the link in a new tab
      window.open(invoiceUrl, '_blank');
    }
  };

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
              onClick={openPaymentLink}
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