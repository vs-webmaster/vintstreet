import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '@/components/Footer';
import { ContactDialog } from '@/components/ContactDialog';
import { Button } from '@/components/ui/button';
import logo from '@/assets/vint-street-logo.svg';

const AboutPage = () => {
  const navigate = useNavigate();
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <header className="bg-primary py-4 text-primary-foreground">
        <div className="container mx-auto flex items-center justify-between px-4">
          <img src={logo} alt="Vint Street" className="h-12 cursor-pointer" onClick={() => navigate('/')} />
          <Button
            variant="outline"
            className="border-primary-foreground text-black hover:bg-primary-foreground hover:text-primary"
            onClick={() => setContactOpen(true)}
          >
            Contact Us
          </Button>
        </div>
      </header>

      <ContactDialog open={contactOpen} onOpenChange={setContactOpen} />

      {/* Success Banner */}
      <section className="bg-black py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">Nice one! 🧥💿🎮</h1>
          <p className="mx-auto max-w-3xl text-xl text-white/90">
            You're officially one of the first to set up shop on Vint Street. We're building something different here —
            and you're here from day one.
          </p>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-8 text-center text-4xl font-bold text-black md:text-5xl">About Vint Street</h2>

          <div className="space-y-6 text-lg text-gray-700">
            <p>
              We're Vint Street, and we're on a mission to make shopping and selling circular. Founded in 2023, we're a
              team of people who care deeply about sustainable shopping and selling.
            </p>

            <p>
              We rescue vintage clothing, accessories, games, and records from landfill, bringing them to savvy shoppers
              like you instead. From your favourite brands to hidden gems you've never discovered before, we've got it
              all.
            </p>

            <p className="font-semibold text-black">We're not about fast fashion here. We're making things circular.</p>

            <div className="my-8 rounded-lg bg-gray-50 p-6">
              <h3 className="mb-4 text-2xl font-bold text-black">What to expect:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-2xl">✨</span>
                  <span>Be first to discover surprise drops of exclusive vintage finds</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-2xl">🎯</span>
                  <span>Early access to the best items before anyone else</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-2xl">💫</span>
                  <span>Buy and sell the things you love in a sustainable way</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-2xl">🌟</span>
                  <span>Join a community of like-minded sustainable shoppers</span>
                </li>
              </ul>
            </div>

            <p className="text-center text-xl font-semibold text-black">
              So don't just buy, buy, buy. We want you to sell, sell, sell too.
            </p>

            <p className="text-center text-gray-600">Great for the world and great for your wallet.</p>
          </div>

          <div className="mt-12 text-center">
            <Button
              size="lg"
              className="bg-black px-8 py-6 text-lg text-white hover:bg-black/90"
              onClick={() => navigate('/')}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default AboutPage;
