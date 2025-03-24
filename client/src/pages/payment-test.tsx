import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function PaymentTestPage() {
  const [serviceStatus, setServiceStatus] = useState<{
    apiConfigured: boolean;
    ipnConfigured: boolean;
    serviceStatus: string;
    timeStamp: string;
  } | undefined>(undefined);
  
  const [isLoading, setIsLoading] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  
  useEffect(() => {
    checkServiceStatus();
  }, []);
  
  const checkServiceStatus = async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      
      const data = await apiRequest('GET', '/api/public/payments/service-status');
      setServiceStatus(data);
      
      console.log('Service status:', data);
      
      if (!data.apiConfigured) {
        setError('NOWPayments API is not configured. Please add the API key to your environment variables.');
      }
    } catch (error) {
      console.error('Error checking service status:', error);
      setError('Failed to check payment service status');
    } finally {
      setIsLoading(false);
    }
  };
  
  const createTestInvoice = async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      
      const result = await apiRequest('POST', '/api/public/payments/test-invoice');
      
      console.log('Test invoice created:', result);
      
      if (result.success && result.invoiceUrl) {
        setInvoiceUrl(result.invoiceUrl);
        
        // Open the payment window in a new tab
        window.open(result.invoiceUrl, 'NOWPayments Checkout', 'width=600,height=800');
        
        toast({
          title: 'Test Invoice Created',
          description: 'Payment window opened in a new tab.',
        });
      } else {
        throw new Error('Failed to create test invoice');
      }
    } catch (error: any) {
      console.error('Error creating test invoice:', error);
      setError('Failed to create test invoice');
      toast({
        title: 'Error',
        description: error.message || 'Failed to create test invoice',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>NOWPayments API Test</CardTitle>
          <CardDescription>
            Test the NOWPayments API integration
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="border rounded-md p-4">
            <h3 className="text-sm font-medium mb-2">Service Status:</h3>
            
            {isLoading && !serviceStatus ? (
              <div className="flex justify-center py-2">
                <Loader />
              </div>
            ) : serviceStatus ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Configured:</span>
                  <Badge className={serviceStatus.apiConfigured ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {serviceStatus.apiConfigured ? 'Yes' : 'No'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">IPN Configured:</span>
                  <Badge className={serviceStatus.ipnConfigured ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {serviceStatus.ipnConfigured ? 'Yes' : 'No'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Status:</span>
                  <Badge className={serviceStatus.serviceStatus === 'ok' ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                    {serviceStatus.serviceStatus}
                  </Badge>
                </div>
                
                <div className="text-xs text-muted-foreground mt-2">
                  Last checked: {new Date(serviceStatus.timeStamp).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="text-sm text-destructive">
                {error || 'Failed to load service status'}
              </div>
            )}
          </div>
          
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {error}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            onClick={checkServiceStatus} 
            variant="outline" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? <Loader size="sm" className="mr-2" /> : null}
            Refresh Status
          </Button>
          
          <Button 
            onClick={createTestInvoice} 
            className="w-full"
            disabled={isLoading || (serviceStatus && !serviceStatus.apiConfigured)}
          >
            {isLoading ? <Loader size="sm" className="mr-2" /> : null}
            Create Test Invoice
          </Button>
          
          {invoiceUrl && (
            <Button 
              onClick={() => window.open(invoiceUrl, 'NOWPayments Checkout', 'width=600,height=800')}
              variant="secondary"
              className="w-full mt-2"
            >
              Open Payment Window Again
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}