import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { createSellerRegistration } from '@/services/sellerRegistrations';
import { upsertSellerProfile, updateUserType } from '@/services/users';
import { isFailure } from '@/types/api';

const categories = [
  "Men's Fashion",
  "Women's Fashion",
  'Junior Fashion',
  'Shoes',
  'Accessories',
  'Games & consoles',
  'Vinyl',
  'Comic Books',
  'Trading Cards',
  'VeeFriends',
];

const BecomeSellerSignupPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sellingMethods, setSellingMethods] = useState<string[]>([]);
  const [email, setEmail] = useState(user?.email || '');
  const [shopName, setShopName] = useState('');

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );
  };

  const handleMethodToggle = (method: string) => {
    setSellingMethods((prev) => (prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]));
  };

  const handleNext = async () => {
    if (step === 1 && selectedCategories.length === 0) return;
    if (step === 2 && sellingMethods.length === 0) return;
    // Skip email step for logged-in users
    if (!user && step === 3 && (!email.trim() || !email.includes('@'))) return;

    if ((user && step === 3) || (!user && step === 4)) {
      // Save to database
      try {
        if (user) {
          // For logged-in users, create or update seller profile
          const profileResult = await upsertSellerProfile(user.id, {
            shop_name: shopName.trim() || null,
            business_name: shopName.trim() || null,
            shop_tagline: null,
          });

          if (isFailure(profileResult)) throw profileResult.error;

          // Update user type to seller or both
          const newUserType = profile?.user_type === 'buyer' ? 'both' : 'seller';
          const updateResult = await updateUserType(user.id, newUserType as 'seller' | 'both');

          if (isFailure(updateResult)) throw updateResult.error;

          toast({
            title: 'Success!',
            description: 'Your seller account has been set up.',
          });

          // Redirect to seller dashboard
          navigate('/seller');
          return;
        } else {
          // For non-logged-in users, save to seller_registrations
          const registrationResult = await createSellerRegistration({
            email: email.trim(),
            shop_name: shopName.trim() || null,
            categories: selectedCategories,
            selling_methods: sellingMethods,
          });

          if (isFailure(registrationResult)) throw registrationResult.error;
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to save registration. Please try again.',
          variant: 'destructive',
        });
        return;
      }
    }

    if (step < (user ? 3 : 5)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    if (step === 1) return selectedCategories.length > 0;
    if (step === 2) return sellingMethods.length > 0;
    if (step === 3) {
      // For logged-in users, shop name is required
      if (user) return shopName.trim().length > 0;
      return email.trim().length > 0 && email.includes('@');
    }
    if (step === 4) return true; // Shop name is optional for non-logged-in users
    return false;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="bg-black py-4">
        <div className="container mx-auto flex items-center px-4">
          <Button
            variant="ghost"
            onClick={() => (step === 1 ? navigate('/') : handleBack())}
            className="text-white hover:bg-white/10 hover:text-white/80"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </nav>

      <div className="container mx-auto max-w-3xl px-4 py-12">
        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="mb-4 flex items-center justify-center gap-2">
            {(user ? [1, 2, 3] : [1, 2, 3, 4, 5]).map((num) => (
              <div
                key={num}
                className={`h-2 flex-1 rounded-full transition-colors ${num <= step ? 'bg-black' : 'bg-gray-200'}`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-gray-600">
            Step {step} of {user ? 3 : 5}
          </p>
        </div>

        {/* Step 1: Categories */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="mb-4 text-4xl font-bold text-black">What type of things would you like to sell?</h1>
              <p className="text-gray-600">Select all that apply</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {categories.map((category) => (
                <label
                  key={category}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                    selectedCategories.includes(category)
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Checkbox
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                    className="border-current"
                  />
                  <span className="font-medium">{category}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-center pt-4">
              <Button
                size="lg"
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-black px-12 text-white hover:bg-black/90"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Selling Methods */}
        {step === 2 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="mb-4 text-4xl font-bold text-black">How would you like to sell?</h1>
              <p className="text-gray-600">You can choose one or both</p>
            </div>

            <div className="mx-auto grid max-w-md grid-cols-1 gap-4">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-6 transition-all ${
                  sellingMethods.includes('Upload listings')
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Checkbox
                  checked={sellingMethods.includes('Upload listings')}
                  onCheckedChange={() => handleMethodToggle('Upload listings')}
                  className="border-current"
                />
                <div>
                  <span className="text-lg font-medium">Upload listings</span>
                  <p
                    className={`text-sm ${
                      sellingMethods.includes('Upload listings') ? 'text-white/80' : 'text-gray-600'
                    }`}
                  >
                    Create product listings to sell anytime
                  </p>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-6 transition-all ${
                  sellingMethods.includes('Livestream')
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Checkbox
                  checked={sellingMethods.includes('Livestream')}
                  onCheckedChange={() => handleMethodToggle('Livestream')}
                  className="border-current"
                />
                <div>
                  <span className="text-lg font-medium">Livestream</span>
                  <p className={`text-sm ${sellingMethods.includes('Livestream') ? 'text-white/80' : 'text-gray-600'}`}>
                    Sell live and engage with buyers in real-time
                  </p>
                </div>
              </label>
            </div>

            <div className="flex justify-center pt-4">
              <Button
                size="lg"
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-black px-12 text-white hover:bg-black/90"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Shop Name OR Email (depending on if user is logged in) */}
        {step === 3 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="mb-4 text-4xl font-bold text-black">{user ? 'Your shop name' : "What's your email?"}</h1>
              <p className="text-gray-600">
                {user ? 'Choose a memorable name for your shop' : "We'll use this to keep you updated"}
              </p>
            </div>

            <div className="mx-auto max-w-md space-y-4">
              <div>
                {user ? (
                  <>
                    <Label htmlFor="shopName" className="text-base">
                      Shop name
                    </Label>
                    <Input
                      id="shopName"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="Enter your shop name"
                      className="mt-2 p-6 text-lg"
                      maxLength={50}
                    />
                    <p className="mt-2 text-sm text-gray-500">{shopName.length}/50 characters</p>
                  </>
                ) : (
                  <>
                    <Label htmlFor="email" className="text-base">
                      Email address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="mt-2 p-6 text-lg"
                    />
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Button
                size="lg"
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-black px-12 text-white hover:bg-black/90"
              >
                {user ? 'Complete Setup' : 'Continue'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Shop Name (only for non-logged-in users) OR Success (for logged-in users) */}
        {step === 4 && !user && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="mb-4 text-4xl font-bold text-black">Your shop name</h1>
              <p className="text-gray-600">Choose a memorable name for your shop (optional - you can set this later)</p>
            </div>

            <div className="mx-auto max-w-md space-y-4">
              <div>
                <Label htmlFor="shopName" className="text-base">
                  Shop name
                </Label>
                <Input
                  id="shopName"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Enter your shop name"
                  className="mt-2 p-6 text-lg"
                  maxLength={50}
                />
                <p className="mt-2 text-sm text-gray-500">{shopName.length}/50 characters</p>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-4 pt-4 sm:flex-row">
              <Button size="lg" variant="outline" onClick={handleNext} className="px-12">
                Skip for now
              </Button>
              <Button size="lg" onClick={handleNext} className="bg-black px-12 text-white hover:bg-black/90">
                Complete Setup
              </Button>
            </div>
          </div>
        )}

        {/* Success Page - Only for non-logged-in users */}
        {!user && step === 5 && (
          <div className="space-y-8 text-center">
            <div className="rounded-lg bg-black p-12 text-white">
              <h1 className="mb-6 text-4xl font-bold md:text-5xl">Congrats! 🎉</h1>
              <p className="mb-8 text-2xl">You'll be one of the first sellers on Vint Street</p>

              <div className="mb-8 rounded-lg bg-white/10 p-8">
                <h2 className="mb-4 text-2xl font-bold">Special Launch Offer</h2>
                <p className="text-lg">
                  Once you upload your first 10 items and sell one, we'll give you{' '}
                  <span className="text-2xl font-bold">£20</span>
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-lg">
                  Email: <span className="font-bold">{email}</span>
                </p>
                {shopName && (
                  <p className="text-lg">
                    Shop name: <span className="font-bold">{shopName}</span>
                  </p>
                )}
                <p className="text-sm text-white/80">Categories: {selectedCategories.join(', ')}</p>
                <p className="text-sm text-white/80">Methods: {sellingMethods.join(', ')}</p>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                onClick={() => navigate('/seller')}
                className="bg-black px-8 text-white hover:bg-black/90"
              >
                Go to Dashboard
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/')} className="px-8">
                Return to Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BecomeSellerSignupPage;
