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
  } | undefined>(undefined);
  const { toast } = useToast();
  const auth = useAuth();
  
  // Check NOWPayments service status when the component is opened
  useEffect(() => {
    if (isOpen) {
      checkPaymentServiceStatus();
      // Update amount when popup opens (to sync with parent component)
      setAmount(initialAmount);
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
      } else if (data.serviceStatus !== 'OK' && data.serviceStatus !== 'ok') {
        toast({
          title: 'Payment Service Status',
          description: `Payment service is currently ${data.serviceStatus}. You may experience delays in processing.`,
          variant: 'destructive'
        });
      } else {
        // Service is configured and running
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
    if (amount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount greater than 0',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      let response;
      
      // Check if the user is authenticated
      if (auth.user) {
        // Authenticated user - use the regular endpoint
        console.log('Creating invoice for authenticated user:', auth.user.id);
        response = await apiRequest('POST', '/api/payments/create-invoice', {
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
      toast({
        title: 'Payment Error',
        description: error instanceof Error ? error.message : 'Failed to create payment. Please try again later.',
        variant: 'destructive'
      });
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
  
  const handlePaymentWindowClosed = () => {
    // Only refresh user data if authenticated
    if (auth.user) {
      // Fetch the latest user data to update the balance
      auth.loginMutation.mutate({ 
        username: auth.user.username || '', 
        password: '' // Password isn't needed for refresh
      }, {
        onSuccess: () => {
          if (onSuccess) onSuccess();
          toast({
            title: 'Payment Window Closed',
            description: 'If you completed the payment, your balance will be updated shortly.',
          });
        }
      });
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
            
            {/* Payment service status indicator */}
            {serviceStatus && (
              <div className={`text-xs px-3 py-2 rounded-md ${
                serviceStatus.apiConfigured ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
              }`}>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    serviceStatus.apiConfigured ? 'bg-green-500' : 'bg-amber-500'
                  }`}></div>
                  <span>
                    {serviceStatus.apiConfigured
                      ? 'Payment service connected and ready'
                      : 'Payment service status: ' + (serviceStatus.serviceStatus || 'unknown')}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="mb-2">Your payment link is ready.</p>
            <p className="mb-4 text-sm text-muted-foreground">
              You can pay with multiple cryptocurrencies including BTC, ETH, USDT, and many others.
              The payment page will display all available options.
            </p>
            <div className="bg-amber-50 text-amber-700 p-3 rounded-md mb-4 text-sm">
              <p className="font-medium">💡 Payment Options Available</p>
              <p className="text-xs mt-1">Your deposit amount will be converted to USDT in your game wallet regardless of which cryptocurrency you use for payment.</p>
            </div>
            <Button 
              onClick={openPaymentLink}
              className="w-full mb-2"
            >
              Open Payment Gateway
            </Button>
            <div className="text-xs text-muted-foreground mt-2">
              {invoiceId && (
                <p>Transaction ID: {invoiceId}</p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {!invoiceUrl ? (
            <Button 
              onClick={createInvoice} 
              disabled={isLoading || amount <= 0 || (serviceStatus && !serviceStatus.apiConfigured)}
            >
              {isLoading ? <Loader size="sm" className="mr-2" /> : null}
              {serviceStatus && !serviceStatus.apiConfigured 
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