import { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const hasConsent = localStorage.getItem('cookieConsent');
    if (!hasConsent) {
      // Show banner after a short delay
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 duration-500 animate-in slide-in-from-bottom-5 md:p-6">
      <Card className="shadow-elegant mx-auto max-w-4xl border-border bg-card/95 p-6 backdrop-blur-sm">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
          <div className="flex flex-1 items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Cookie className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-foreground">Cookie Notice</h3>
              <p className="text-sm text-muted-foreground">
                We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
                By clicking "Accept", you consent to our use of cookies.
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
            <Button variant="outline" onClick={handleDecline} className="w-full sm:w-auto">
              Decline
            </Button>
            <Button onClick={handleAccept} className="w-full sm:w-auto">
              Accept
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
