import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { signUp, signIn, resetPasswordForEmail, onAuthStateChange } from '@/services/auth';
import { fetchProfile } from '@/services/users';
import { isFailure } from '@/types/api';
import vintStreetLogo from '@/assets/vint-street-logo.svg';
import authBackground from '@/assets/auth-background.webp';

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedUsernames, setSuggestedUsernames] = useState<string[]>([]);
  const [fullName, setFullName] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToCommunications, setAgreedToCommunications] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [prefilledEmail, setPrefilledEmail] = useState('');

  // Check for email in URL params (from email confirmation)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
      setPrefilledEmail(emailParam);
    }
  }, []);

  // Listen for auth state changes and redirect sellers after email confirmation
  useEffect(() => {
    const subscription = onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Fetch user profile to check user type
        const profileResult = await fetchProfile(session.user.id);

        if (!isFailure(profileResult) && profileResult.data) {
          const profile = profileResult.data;
          // Redirect sellers to the seller dashboard
          if (profile.user_type === 'seller' || profile.user_type === 'both') {
            navigate('/seller');
          } else {
            navigate('/shop');
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Generate username suggestions based on full name
  const generateUsernamesFromName = (name: string) => {
    if (!name.trim()) return [];

    const nameParts = name
      .trim()
      .split(' ')
      .filter((part) => part.length > 0);
    if (nameParts.length === 0) return [];

    const suggestions: string[] = [];
    const randomNum1 = Math.floor(Math.random() * 999);
    const randomNum2 = Math.floor(Math.random() * 999);
    const randomNum3 = Math.floor(Math.random() * 999);

    // Remove spaces and combine
    const combined = nameParts.join('').toLowerCase();
    suggestions.push(`${combined}${randomNum1}`);

    // First name + last initial
    if (nameParts.length > 1) {
      const firstInitial = nameParts[0].toLowerCase();
      const lastName = nameParts[nameParts.length - 1].toLowerCase();
      suggestions.push(`${firstInitial}${lastName}${randomNum2}`);
    }

    // First initial + last name
    if (nameParts.length > 1) {
      const firstInitial = nameParts[0].charAt(0).toLowerCase();
      const lastName = nameParts[nameParts.length - 1].toLowerCase();
      suggestions.push(`${firstInitial}${lastName}${randomNum3}`);
    }

    return suggestions.slice(0, 3);
  };

  useEffect(() => {
    if (fullName) {
      const suggestions = generateUsernamesFromName(fullName);
      setSuggestedUsernames(suggestions);
    }
  }, [fullName]);

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('resetEmail') as string;

    const redirectUrl = `https://vintstreet.com/auth`;

    const result = await resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (isFailure(result)) {
      setError(result.error.message || 'Failed to send reset email');
    } else {
      toast.success('Password reset link sent! Check your email.');
      setShowForgotPassword(false);
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const fullName = formData.get('fullName') as string;
    const username = formData.get('username') as string;
    const userType = formData.get('userType') as string;

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (!userType) {
      setError('Please select an account type');
      setIsLoading(false);
      return;
    }

    if (!agreedToTerms) {
      setError('You must agree to the Terms and Conditions');
      setIsLoading(false);
      return;
    }

    const redirectUrl = `https://vintstreet.com/auth?email=${encodeURIComponent(email)}`;

    const result = await signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          username: username,
          user_type: userType,
          agreed_to_communications: agreedToCommunications,
        },
      },
    });

    if (isFailure(result)) {
      const error = result.error;
      if (error.message?.includes('already registered')) {
        setError('This email is already registered. Please try signing in instead.');
      } else {
        setError(error.message || 'Failed to create account');
      }
    } else {
      toast.success('Account created! Please check your email to verify your account.');

      // Redirect to confirm email page
      setTimeout(() => {
        navigate('/confirm-email');
      }, 1000);
    }

    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const result = await signIn({
      email,
      password,
    });

    if (isFailure(result)) {
      setError(result.error.message || 'Failed to sign in');
      setIsLoading(false);
    } else {
      toast.success('Welcome back!');

      // Fetch user profile to determine redirect
      const profileResult = await fetchProfile(result.data.user.id);

      if (!isFailure(profileResult) && profileResult.data) {
        const profile = profileResult.data;
        // Redirect based on user type
        if (profile.user_type === 'seller' || profile.user_type === 'both') {
          navigate('/seller');
        } else {
          navigate('/shop');
        }
      } else {
        navigate('/shop');
      }

      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Background with blur */}
      <div className="fixed inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${authBackground})` }}>
        <div className="absolute inset-0 bg-background/30 backdrop-blur-xl" />
      </div>

      {/* Back to Shop Button */}
      <div className="absolute left-4 top-4 z-20">
        <Button variant="outline" className="bg-white text-black hover:bg-white/90" onClick={() => navigate('/shop')}>
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
            <CardHeader>
              <CardTitle className="text-center">Welcome</CardTitle>
              <CardDescription className="text-center">Join the live shopping experience</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Tabs
                defaultValue={new URLSearchParams(window.location.search).get('tab') || 'signin'}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  {showForgotPassword ? (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="resetEmail">Email</Label>
                        <Input id="resetEmail" name="resetEmail" type="email" placeholder="Enter your email" required />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        onClick={() => setShowForgotPassword(false)}
                      >
                        Back to Sign In
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input
                          id="signin-email"
                          name="email"
                          type="email"
                          placeholder="Enter your email"
                          required
                          defaultValue={prefilledEmail}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Password</Label>
                        <div className="relative">
                          <Input
                            id="signin-password"
                            name="password"
                            type={showSignInPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            required
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowSignInPassword(!showSignInPassword)}
                          >
                            {showSignInPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto p-0 text-sm"
                          onClick={() => setShowForgotPassword(true)}
                        >
                          Forgot password?
                        </Button>
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Signing in...' : 'Sign In'}
                      </Button>
                    </form>
                  )}
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input id="signup-email" name="email" type="email" placeholder="Enter your email" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" name="username" type="text" placeholder="Choose a username" required />
                      {suggestedUsernames.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Suggested usernames (click to use):</p>
                          <div className="flex flex-wrap gap-2">
                            {suggestedUsernames.map((username, index) => (
                              <Button
                                key={index}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => {
                                  const input = document.getElementById('username') as HTMLInputElement;
                                  if (input) input.value = username;
                                }}
                              >
                                {username}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userType">Account Type</Label>
                      <Select name="userType" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose your account type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buyer">Buyer - I want to shop</SelectItem>
                          <SelectItem value="seller">Seller - I want to sell</SelectItem>
                          <SelectItem value="both">Both - Buy and sell</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          name="password"
                          type={showSignUpPassword ? 'text' : 'password'}
                          placeholder="Create a password (min 6 characters)"
                          required
                          minLength={6}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        >
                          {showSignUpPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          required
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div
                        className="flex cursor-pointer items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
                        onClick={() => setAgreedToTerms(!agreedToTerms)}
                      >
                        <Label htmlFor="agreeTerms" className="flex-1 cursor-pointer pr-3 text-sm leading-tight">
                          I agree to the{' '}
                          <a
                            href="/terms"
                            target="_blank"
                            className="text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Terms and Conditions
                          </a>{' '}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Switch
                          id="agreeTerms"
                          checked={agreedToTerms}
                          onCheckedChange={setAgreedToTerms}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      <div
                        className="flex cursor-pointer items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
                        onClick={() => setAgreedToCommunications(!agreedToCommunications)}
                      >
                        <Label
                          htmlFor="agreeCommunications"
                          className="flex-1 cursor-pointer pr-3 text-sm leading-tight"
                        >
                          I agree to receive promotional emails and communications
                        </Label>
                        <Switch
                          id="agreeCommunications"
                          checked={agreedToCommunications}
                          onCheckedChange={setAgreedToCommunications}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
