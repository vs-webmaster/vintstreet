import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import vintStreetLogo from '@/assets/vint-street-logo.svg';
import authBackground from '@/assets/auth-background.webp';

const ConfirmEmailPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // If user is already confirmed/logged in, redirect to shop
  useEffect(() => {
    if (user?.email_confirmed_at) {
      navigate('/shop');
    }
  }, [user, navigate]);

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendSuccess(false);
    
    // Simulate resend (in production, you'd call an edge function or use Supabase resend)
    setTimeout(() => {
      setIsResending(false);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Background with blur */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${authBackground})` }}
      >
        <div className="absolute inset-0 backdrop-blur-xl bg-background/30" />
      </div>

      {/* Back to Shop Button */}
      <div className="absolute top-4 left-4 z-20">
        <Button 
          variant="outline" 
          className="bg-white text-black hover:bg-white/90"
          onClick={() => navigate('/shop')}
        >
          Back to Shop
        </Button>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 flex items-center justify-center">
            <img src={vintStreetLogo} alt="VintStreet" className="h-20 w-auto" />
          </div>

          <Card className="w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Confirm Your Email</CardTitle>
              <CardDescription className="text-base">
                We've sent a confirmation link to your email address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 text-center text-sm text-muted-foreground">
                <p>
                  Please check your inbox and click the confirmation link to activate your account.
                </p>
                <p>
                  Once confirmed, you'll be automatically signed in and can start exploring VintStreet!
                </p>
              </div>

              <div className="space-y-3">
                {resendSuccess && (
                  <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirmation email sent!</span>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleResendEmail}
                  disabled={isResending}
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Resend Confirmation Email
                    </>
                  )}
                </Button>
              </div>

              <div className="border-t pt-6 text-center text-sm text-muted-foreground">
                <p>Didn't receive the email? Check your spam folder or try resending.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConfirmEmailPage;
