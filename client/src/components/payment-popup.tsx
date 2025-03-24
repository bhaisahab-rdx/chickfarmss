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
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);
  const [serviceStatus, setServiceStatus] = useState<{
    apiConfigured: boolean;
    ipnConfigured: boolean;
    serviceStatus: string;
  } | null>(null);
  const { toast } = useToast();
  const auth = useAuth();
  
  // Check NOWPayments service status when the component is opened
  useEffect(() => {
    if (isOpen) {
      checkPaymentServiceStatus();
    }
  }, [isOpen]);
  
  // Function to check the NOWPayments service status
  const checkPaymentServiceStatus = async () => {
    try {
      // Using apiRequest so we get logging and error handling
      const data = await apiRequest('GET', '/api/public/payments/service-status');
      setServiceStatus(data);
      
      if (!data.apiConfigured) {
        toast({
          title: 'Payment Service Error',
          description: 'Payment service is not fully configured. Please try again later or contact support.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error checking payment service status:', error);
      setServiceStatus(null);
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
      // Use the proper method to ensure authentication headers are included
      const response = await apiRequest('POST', '/api/payments/create-invoice', {
        amount, 
        currency: 'USD'
      });

      if (response.success && response.invoiceUrl) {
        setInvoiceUrl(response.invoiceUrl);
        
        // Open the NOWPayments checkout in a new window
        const payWindow = window.open(
          response.invoiceUrl,
          'NOWPayments Checkout',
          'width=600,height=800,top=100,left=100'
        );
        
        if (payWindow) {
          setPaymentWindow(payWindow);
          
          // Set up an interval to check if the popup is closed
          const checkWindowClosed = setInterval(() => {
            if (payWindow.closed) {
              clearInterval(checkWindowClosed);
              
              // Fetch the latest user data to update the balance
              auth.loginMutation.mutate({ 
                username: auth.user?.username || '', 
                password: '' // Password isn't needed for refresh
              }, {
                onSuccess: () => {
                  if (onSuccess) onSuccess();
                  toast({
                    title: 'Payment Processed',
                    description: 'Your payment has been processed. If your balance has not updated yet, it will be updated shortly.',
                  });
                  resetForm();
                }
              });
            }
          }, 1000);
        } else {
          toast({
            title: 'Popup Blocked',
            description: 'Please allow popups for this site to complete your payment',
            variant: 'destructive'
          });
        }
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

  const resetForm = () => {
    setInvoiceUrl(null);
    setPaymentWindow(null);
    onClose();
  };

  const closePaymentWindow = () => {
    if (paymentWindow && !paymentWindow.closed) {
      paymentWindow.close();
    }
    resetForm();
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
                serviceStatus.apiConfigured && serviceStatus.serviceStatus === 'ok' 
                  ? 'bg-green-50 text-green-700'
                  : 'bg-amber-50 text-amber-700'
              }`}>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    serviceStatus.apiConfigured && serviceStatus.serviceStatus === 'ok'
                      ? 'bg-green-500'
                      : 'bg-amber-500'
                  }`}></div>
                  <span>
                    {serviceStatus.apiConfigured && serviceStatus.serviceStatus === 'ok'
                      ? 'Payment service connected and ready'
                      : 'Payment service status: ' + (serviceStatus.serviceStatus || 'unknown')}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="mb-2">Your payment is being processed.</p>
            <p className="mb-4 text-sm text-muted-foreground">
              If the payment window doesn't open automatically, please click the button below.
            </p>
            <Button 
              onClick={() => {
                window.open(invoiceUrl, 'NOWPayments Checkout', 'width=600,height=800,top=100,left=100');
              }}
              className="w-full"
            >
              Open Payment Window
            </Button>
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