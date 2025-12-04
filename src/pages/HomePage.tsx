import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import landingImage4 from '@/assets/blue-jacket.webp';
import heroBackground from '@/assets/hero-background.webp';
import landingImage3 from '@/assets/gameboy.webp';
import phoneMockup from '@/assets/phone-mockup-2.webp';
import landingImage5 from '@/assets/purple-hoodie.webp';
import landingImage2 from '@/assets/trainers.webp';
import vintStreetLogo from '@/assets/vint-street-logo.svg';
import { useApp } from '@/hooks/useApp';

const HomePage = () => {
  const navigate = useNavigate();
  const { siteContent } = useApp();
  const { user } = useAuth();

  useEffect(() => {
    // Load Instagram embed script
    if (!(window as any).instgrm) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.instagram.com/embed.js';
      document.body.appendChild(script);
    } else {
      (window as any).instgrm.Embeds.process();
    }
  }, [siteContent]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed left-0 right-0 top-0 z-50 bg-black/90 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <img src={vintStreetLogo} alt="Vint Street" className="h-8" />
          <div className="hidden md:flex">
            {user ? (
              <Button className="bg-white text-black hover:bg-white/90" onClick={() => navigate('/shop')}>
                Go to Shop
              </Button>
            ) : (
              <div className="flex flex-row items-center gap-4">
                <Button
                  variant="outline"
                  className="border-white bg-transparent text-white hover:bg-white hover:text-black"
                  onClick={() => navigate('/become-seller')}
                >
                  Set Up Shop
                </Button>
                <Button className="bg-white text-black hover:bg-white/90" onClick={() => navigate('/founders')}>
                  Join the Founders' List
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="relative flex min-h-screen items-center"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Black overlay */}
        <div className="absolute inset-0 bg-black/90" />

        {/* Content */}
        <div className="container relative z-10 mx-auto px-4 py-8 pt-24 md:pt-8">
          <div className="grid items-center gap-8 md:grid-cols-2">
            {/* Left side - Content */}
            <div className="flex flex-col items-center justify-center space-y-8 text-center md:pl-12">
              <img src={vintStreetLogo} alt="Vint Street" className="h-16 md:h-20" />

              <h1 className="text-5xl font-bold text-white md:text-7xl">Become a Founder</h1>

              <p className="text-2xl font-semibold text-white md:text-3xl">Coming Soon</p>

              {user ? (
                <Button
                  size="lg"
                  className="bg-white px-8 py-6 text-lg text-black hover:bg-white/90"
                  onClick={() => navigate('/shop')}
                >
                  Go to Shop
                </Button>
              ) : (
                <div className="flex flex-col justify-center gap-4 sm:flex-row">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white bg-transparent px-8 py-6 text-lg text-white hover:bg-white hover:text-black"
                    onClick={() => navigate('/become-seller')}
                  >
                    Set Up Shop
                  </Button>
                  <Button
                    size="lg"
                    className="bg-white px-8 py-6 text-lg text-black hover:bg-white/90"
                    onClick={() => navigate('/founders')}
                  >
                    Join the Founders' List
                  </Button>
                </div>
              )}
            </div>

            {/* Right side - Phone mockup */}
            <div className="flex h-full items-end justify-center md:pr-0">
              <img
                src={phoneMockup}
                alt="Vint Street App"
                className="h-[450px] object-contain object-bottom md:h-[550px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Instagram Feed Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold text-black md:text-5xl">Follow @vintstreet_</h2>
            <p className="mb-8 text-lg text-gray-600">See what's trending in our community</p>
            <Button
              size="lg"
              className="bg-black text-white hover:bg-black/90"
              onClick={() => window.open('https://www.instagram.com/vintstreet_/', '_blank')}
            >
              Follow us on Instagram
            </Button>
          </div>

          {/* Instagram Embeds - 3 Column Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {siteContent?.instagram_post_1 && (
              <div
                className="instagram-post-container"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(siteContent.instagram_post_1) }}
              />
            )}
            {siteContent?.instagram_post_2 && (
              <div
                className="instagram-post-container"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(siteContent.instagram_post_2) }}
              />
            )}
            {siteContent?.instagram_post_3 && (
              <div
                className="instagram-post-container"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(siteContent.instagram_post_3) }}
              />
            )}
          </div>
        </div>
      </section>

      {/* Buy and Sell Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="mb-20 grid items-center gap-12 md:grid-cols-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-[1/2] overflow-hidden rounded-lg">
                <img src={landingImage2} alt="Vintage clothing" className="h-full w-full object-cover" />
              </div>
              <div className="aspect-[1/2] overflow-hidden rounded-lg">
                <img src={landingImage4} alt="Vintage items" className="h-full w-full object-cover" />
              </div>
            </div>
            <div>
              <h2 className="mb-6 text-4xl font-bold text-black md:text-5xl">Welcome to Vint Street</h2>
              <p className="mb-6 text-lg text-gray-700">
                Hey there, and welcome to Vint Street — your soon-to-be favourite spot for pre-loved and brand new
                finds, right here in the UK. If you're reading this, chances are you're a bit tired of the same old
                options currently on offer. Or maybe you're just curious about what all the fuss is about in the world
                of vintage and cult collectibles. Either way, you're in the right place.
              </p>
              <p className="mb-6 text-lg text-gray-700">
                Vint Street isn't just another marketplace. We're an indie, community-driven platform that's all about
                making sustainable shopping not just doable, but actually enjoyable. Because let's be honest, buying
                pre-loved can at times be a chore, a gamble, or a treasure hunt with zero clues.
              </p>
              <p className="text-lg font-semibold text-black">
                We're here to change that — and we want you to be part of it.
              </p>
            </div>
          </div>

          {/* Games Section */}
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="order-2 md:order-1">
              <h2 className="mb-6 text-4xl font-bold text-black md:text-5xl">How Vint Street Works</h2>
              <p className="mb-6 text-lg text-gray-700">
                At our core, Vint Street is a marketplace, but one with a heart and a clear mission. We bring together
                pre-loved gems alongside carefully curated brand-new pieces that fit our ethos. This isn't about dusty
                thrift shops and old tat. We've got an eye for quality, the unique, and the things that tell a story.
              </p>
              <p className="mb-6 text-lg text-gray-700">
                Our platform is designed to be as slick and fuss-free as possible. Whether you want to browse one item
                or bulk upload your whole wardrobe, we've got tools to make that happen. List your jumper on our
                website, sell your retro games on your own live channel, and connect with buyers through our app — all
                at the same time and across every platform.
              </p>
              <p className="mb-6 text-lg text-gray-700">
                Sellers can get started in seconds with detailed descriptions, photos, and measurements. If you're a
                buyer, browsing is a breeze. You can explore unique stock curated by real people who care about what
                they sell. And when you find something you love, purchasing is secure and quick, guaranteed.
              </p>
            </div>
            <div className="order-1 grid grid-cols-2 gap-4 md:order-2">
              <div className="aspect-[1/2] overflow-hidden rounded-lg">
                <img src={landingImage3} alt="Vintage games" className="h-full w-full object-cover" />
              </div>
              <div className="aspect-[1/2] overflow-hidden rounded-lg">
                <img src={landingImage5} alt="Vintage clothing" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-8 text-4xl font-bold text-white md:text-5xl">Ready to join?</h2>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              variant="outline"
              className="border-white bg-transparent px-8 py-6 text-lg text-white hover:bg-white hover:text-black"
              onClick={() => navigate('/become-seller')}
            >
              Set Up Shop
            </Button>
            <Button
              size="lg"
              className="bg-white px-8 py-6 text-lg text-black hover:bg-white/90"
              onClick={() => navigate('/founders')}
            >
              Join the Founders' List
            </Button>
          </div>
        </div>
      </section>
      <Footer hideLinks />
    </div>
  );
};

export default HomePage;
