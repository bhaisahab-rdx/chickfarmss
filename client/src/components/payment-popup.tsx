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
}

export function PaymentPopup({ isOpen, onClose, onSuccess }: PaymentPopupProps) {
  const [amount, setAmount] = useState<number>(90); // Default amount is 90 USDT
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
    }
    
    // Clean up payment window if component unmounts
    return () => {
      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.close();
      }
    };
  }, [isOpen]);
  
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
          title: 'Payment Service Error',
          description: 'Payment service is not fully configured. Please try again later or contact support.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error checking payment service status:', error);
      setServiceStatus(undefined);
      
      toast({
        title: 'Error',
        description: 'Unable to check payment service status. Please try again later.',
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
          currency: 'USD'
        });
      } else {
        // Use the public test endpoint for debugging or when not authenticated
        console.log('Using test invoice endpoint (not authenticated)');
        response = await apiRequest('POST', '/api/public/payments/test-invoice');
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
      // First, try to handle the popup opening more user-friendly
      // Create a temporary button element
      const tempButton = document.createElement('button');
      tempButton.style.display = 'none';
      document.body.appendChild(tempButton);
      
      // Now setup an onclick handler - browsers are more likely to allow
      // popups that are triggered directly by user action (click events)
      tempButton.onclick = () => {
        // Open in _blank to ensure a new window/tab and not inside iframe
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        
        // Handle popup blocked case
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          // If blocked, show helpful message
          toast({
            title: 'Popup Blocked',
            description: 'Your browser blocked the payment window. Please click "Open Payment Link" below to proceed.',
            variant: 'destructive'
          });
          
          // Ensure we still have the invoice URL available for manual opening
          setInvoiceUrl(url);
          return;
        }
        
        // Successfully opened the window
        setPaymentWindow(newWindow);
        
        // Set up an interval to check if the payment window is closed
        const checkWindowClosed = setInterval(() => {
          if (newWindow.closed) {
            clearInterval(checkWindowClosed);
            handlePaymentWindowClosed();
          }
        }, 1000);
      };
      
      // Simulate a click event to trigger the window.open
      tempButton.click();
      
      // Clean up the temporary button
      document.body.removeChild(tempButton);
    } catch (error) {
      console.error('Error opening payment window:', error);
      
      // Fallback to direct method if the simulated click approach fails
      try {
        const newWindow = window.open(url, '_blank');
        
        if (!newWindow) {
          toast({
            title: 'Popup Blocked',
            description: 'Please allow popups for this site or click "Open Payment Link" below.',
            variant: 'destructive'
          });
          return;
        }
        
        setPaymentWindow(newWindow);
        
        // Monitor the window state
        const checkWindowClosed = setInterval(() => {
          if (newWindow.closed) {
            clearInterval(checkWindowClosed);
            handlePaymentWindowClosed();
          }
        }, 1000);
      } catch (secondError) {
        console.error('Fallback window opening failed:', secondError);
        toast({
          title: 'Browser Error',
          description: 'Unable to open payment window. Please click "Open Payment Link" button below.',
          variant: 'destructive'
        });
      }
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
              If the payment page doesn't open automatically, please click the button below.
            </p>
            <Button 
              onClick={openPaymentLink}
              className="w-full mb-2"
            >
              Open Payment Link
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
                : 'Pay with Crypto'}
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