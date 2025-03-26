import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';

export function ApiTest() {
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testApi = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test');
      const data = await response.json();
      setApiResponse(data);
      console.log('API test response:', data);
    } catch (err) {
      console.error('API test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle>API Test</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={testApi} 
          disabled={loading}
          className="mb-4"
        >
          {loading ? 'Testing API...' : 'Test API Endpoint'}
        </Button>
        
        {error && (
          <div className="p-3 bg-red-100 text-red-800 rounded mb-4">
            Error: {error}
          </div>
        )}
        
        {apiResponse && (
          <div className="p-3 bg-green-100 text-green-800 rounded">
            <h3 className="font-bold">API Response:</h3>
            <pre className="whitespace-pre-wrap text-sm mt-2">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}