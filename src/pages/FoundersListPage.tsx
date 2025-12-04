import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { createFounderEntry, updateFounderEntry } from '@/services/founders';
import { isFailure } from '@/types/api';
import foundersHero from '@/assets/founders-hero.webp';

const FoundersListPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    intent: '',
    interests: [] as string[],
    priceRange: '',
    sellingPlans: '',
  });

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Insert basic info immediately
      const result = await createFounderEntry({
        name: formData.name,
        email: formData.email,
      });

      if (isFailure(result)) {
        if (result.error.message?.includes('unique') || result.error.message?.includes('23505')) {
          // Unique constraint violation
          toast.error('This email is already registered');
        } else {
          toast.error('Failed to save your spot. Please try again.');
        }
        return;
      }

      // Move to step 2
      setStep(2);
      toast.success('Spot saved! Just a few more questions...');
    } catch (error: any) {
      console.error('Error saving founder info:', error);
      toast.error('Failed to save your spot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.intent) {
      toast.error('Please select an option');
      return;
    }
    setStep(3);
  };

  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.interests.length === 0) {
      toast.error('Please select at least one interest');
      return;
    }
    setStep(4);
  };

  const handleStep4Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.priceRange) {
      toast.error('Please select an option');
      return;
    }
    setStep(5);
  };

  const handleStep5Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sellingPlans) {
      toast.error('Please select an option');
      return;
    }

    setLoading(true);
    try {
      // Update with all preferences
      const result = await updateFounderEntry(formData.email, {
        intent: formData.intent,
        interests: formData.interests,
        price_range: formData.priceRange,
        selling_plans: formData.sellingPlans,
      });

      if (isFailure(result)) throw result.error;

      // Show success message and redirect
      toast.success("Welcome to the Founders' List!");
      setTimeout(() => {
        navigate('/about');
      }, 2000);
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
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

      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Column - Founder Card */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <Card className="overflow-hidden rounded-xl border-none">
              <CardContent className="p-0">
                <div
                  className="relative"
                  style={{
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${foundersHero})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    minHeight: '600px',
                  }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                    <div className="mb-4">
                      <span className="inline-block rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                        Founders' List
                      </span>
                    </div>
                    <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">Become a Vint Street Founder</h2>
                    <p className="max-w-md text-lg text-white/90">
                      Be one of the very first to join our Founders' List — early members get exclusive perks, sneak
                      peeks, and a say in shaping the Street. You'll be at the heart of it all.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Form */}
          <div>
            {/* Progress Indicator */}
            <div className="mb-12">
              <div className="mb-4 flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <div
                    key={num}
                    className={`h-2 flex-1 rounded-full transition-colors ${num <= step ? 'bg-black' : 'bg-gray-200'}`}
                  />
                ))}
              </div>
              <p className="text-center text-sm text-gray-600">Step {step} of 5</p>
            </div>

            {/* Step 1: Basics */}
            {step === 1 && (
              <div className="space-y-8">
                <div className="text-center">
                  <h1 className="mb-4 text-4xl font-bold text-black">Let's get you signed up</h1>
                  <p className="text-gray-600">Founders get first dibs. Sign up now and lock in your spot.</p>
                </div>

                <form onSubmit={handleStep1Submit} className="mx-auto max-w-md space-y-6">
                  <div>
                    <Label htmlFor="name" className="text-base">
                      Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Your full name"
                      className="mt-2 p-6 text-lg"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-base">
                      Email address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                      className="mt-2 p-6 text-lg"
                      required
                    />
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button
                      type="submit"
                      size="lg"
                      className="bg-black px-12 text-white hover:bg-black/90"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Continue'}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 2: Intent */}
            {step === 2 && (
              <div className="space-y-8">
                <div className="text-center">
                  <h1 className="mb-4 text-4xl font-bold text-black">Are you mainly here to…</h1>
                </div>

                <form onSubmit={handleStep2Submit} className="space-y-8">
                  <RadioGroup
                    value={formData.intent}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, intent: value }))}
                  >
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-6 transition-all ${
                        formData.intent === 'buy'
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RadioGroupItem value="buy" id="buy" className="border-current" />
                      <Label htmlFor="buy" className="cursor-pointer text-lg font-medium">
                        Buy
                      </Label>
                    </label>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-6 transition-all ${
                        formData.intent === 'sell'
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RadioGroupItem value="sell" id="sell" className="border-current" />
                      <Label htmlFor="sell" className="cursor-pointer text-lg font-medium">
                        Sell
                      </Label>
                    </label>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-6 transition-all ${
                        formData.intent === 'both'
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RadioGroupItem value="both" id="both" className="border-current" />
                      <Label htmlFor="both" className="cursor-pointer text-lg font-medium">
                        Both
                      </Label>
                    </label>
                  </RadioGroup>

                  <div className="flex justify-center pt-4">
                    <Button type="submit" size="lg" className="bg-black px-12 text-white hover:bg-black/90">
                      Continue
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: Interests */}
            {step === 3 && (
              <div className="space-y-8">
                <div className="text-center">
                  <h1 className="mb-4 text-4xl font-bold text-black">What kinds of things are you most into?</h1>
                  <p className="text-gray-600">Select all that apply</p>
                </div>

                <form onSubmit={handleStep3Submit} className="space-y-8">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {[
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
                    ].map((interest) => (
                      <label
                        key={interest}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-all ${
                          formData.interests.includes(interest)
                            ? 'border-black bg-black text-white'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Checkbox
                          checked={formData.interests.includes(interest)}
                          onCheckedChange={() => toggleInterest(interest)}
                          className="border-current"
                        />
                        <span className="font-medium">{interest}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button type="submit" size="lg" className="bg-black px-12 text-white hover:bg-black/90">
                      Continue
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 4: Price Range */}
            {step === 4 && (
              <div className="space-y-8">
                <div className="text-center">
                  <h1 className="mb-4 text-4xl font-bold text-black">Which best matches what you're looking for?</h1>
                </div>

                <form onSubmit={handleStep4Submit} className="space-y-8">
                  <RadioGroup
                    value={formData.priceRange}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, priceRange: value }))}
                  >
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-6 transition-all ${
                        formData.priceRange === 'bargains'
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RadioGroupItem value="bargains" id="bargains" className="border-current" />
                      <Label htmlFor="bargains" className="cursor-pointer text-lg font-medium">
                        Everyday bargains
                      </Label>
                    </label>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-6 transition-all ${
                        formData.priceRange === 'mid-range'
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RadioGroupItem value="mid-range" id="mid-range" className="border-current" />
                      <Label htmlFor="mid-range" className="cursor-pointer text-lg font-medium">
                        Mid-range gems
                      </Label>
                    </label>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-6 transition-all ${
                        formData.priceRange === 'high-value'
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RadioGroupItem value="high-value" id="high-value" className="border-current" />
                      <Label htmlFor="high-value" className="cursor-pointer text-lg font-medium">
                        Rare / high-value finds
                      </Label>
                    </label>
                  </RadioGroup>

                  <div className="flex justify-center pt-4">
                    <Button type="submit" size="lg" className="bg-black px-12 text-white hover:bg-black/90">
                      Continue
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 5: Selling Plans */}
            {step === 5 && (
              <div className="space-y-8">
                <div className="text-center">
                  <h1 className="mb-4 text-4xl font-bold text-black">Do you have items you'd like to list?</h1>
                </div>

                <form onSubmit={handleStep5Submit} className="space-y-8">
                  <RadioGroup
                    value={formData.sellingPlans}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, sellingPlans: value }))}
                  >
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-6 transition-all ${
                        formData.sellingPlans === 'yes-immediately'
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RadioGroupItem value="yes-immediately" id="yes-immediately" className="border-current" />
                      <Label htmlFor="yes-immediately" className="cursor-pointer text-lg font-medium">
                        Yes, right away
                      </Label>
                    </label>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-6 transition-all ${
                        formData.sellingPlans === 'yes-browsing'
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RadioGroupItem value="yes-browsing" id="yes-browsing" className="border-current" />
                      <Label htmlFor="yes-browsing" className="cursor-pointer text-lg font-medium">
                        Yes, but browsing for now
                      </Label>
                    </label>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-6 transition-all ${
                        formData.sellingPlans === 'no'
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RadioGroupItem value="no" id="no" className="border-current" />
                      <Label htmlFor="no" className="cursor-pointer text-lg font-medium">
                        Not planning to sell
                      </Label>
                    </label>
                  </RadioGroup>

                  <div className="flex justify-center pt-4">
                    <Button
                      type="submit"
                      size="lg"
                      className="bg-black px-12 text-white hover:bg-black/90"
                      disabled={loading}
                    >
                      {loading ? 'Submitting...' : 'Count me in as a Founder'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FoundersListPage;
