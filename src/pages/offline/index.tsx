import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';

export default function OfflinePage() {
  const handleRetry = () => {
    // Check if online and reload
    if (navigator.onLine) {
      window.location.reload();
    }
  };

  React.useEffect(() => {
    // Listen for online event
    const handleOnline = () => {
      window.location.reload();
    };

    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="mb-6">
          <WifiOff className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
          You're Offline
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          It looks like you've lost your internet connection. Don't worry, you can still access cached content.
        </p>

        <div className="space-y-4">
          <Button
            onClick={handleRetry}
            className="w-full"
            variant="default"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Available Offline:
            </h2>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Previously viewed news articles</li>
              <li>• Saved government services</li>
              <li>• Cached tourism information</li>
              <li>• Your saved preferences</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-500 dark:text-gray-500">
          We'll automatically refresh when you're back online
        </div>
      </Card>
    </div>
  );
}