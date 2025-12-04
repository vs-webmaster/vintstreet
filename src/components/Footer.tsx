import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/hooks/useApp';
import { useToast } from '@/hooks/useToast';
import vintStreetLogo from '@/assets/vint-street-logo.svg';

export default function Footer({ hideLinks = false }: { hideLinks?: boolean }) {
  const { footerColumns, footerLinks } = useApp();
  const { toast } = useToast();
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast({
        title: 'Subscribed!',
        description: 'Thank you for joining our newsletter.',
      });
      setEmail('');
    }
  };

  return (
    <footer className="bg-black text-white">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid items-center gap-8 md:grid-cols-[auto,1fr]">
            <div className="flex items-center gap-2">
              <img src={vintStreetLogo} alt="Vint Street" className="h-16 md:h-20" />
            </div>

            <div>
              <h2 className="mb-2 text-2xl font-bold md:text-3xl">Have you heard the word on the street...</h2>
              <p className="mb-4 text-sm text-white/80 md:text-base">
                Be the first to hear about exciting drops, cheeky discounts and more.
                <br />
                Sign up now for 10% off your next order
              </p>

              <form onSubmit={handleSubscribe} className="flex max-w-2xl flex-col gap-3 sm:flex-row">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 border-white/30 bg-transparent text-white placeholder:text-white/50"
                  required
                />
                <Button
                  type="submit"
                  variant="outline"
                  className="border-white bg-transparent text-white hover:bg-white hover:text-black"
                >
                  Subscribe
                </Button>
              </form>

              <p className="mt-3 text-xs text-white/60">
                By signing up to our newsletter, you agree to receive marketing messages via email. Please refer to our
                Privacy Policy for more information.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Links Section */}
      {!hideLinks && (
        <div className="border-b border-white/10">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {footerColumns.map((column) => {
                const columnLinks = footerLinks.filter((link) => link.column_id === column.id);
                return (
                  <div key={column.id}>
                    <h3 className="mb-4 text-lg font-bold">{column.title}</h3>
                    <ul className="space-y-2">
                      {columnLinks.map((link) => (
                        <li key={link.id}>
                          {link.url.startsWith('http') ? (
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-white/80 transition-colors hover:text-white"
                            >
                              {link.label}
                            </a>
                          ) : (
                            <Link to={link.url} className="text-sm text-white/80 transition-colors hover:text-white">
                              {link.label}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Social and Copyright */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex gap-6">
            <a
              href="https://www.instagram.com/vintstreet_/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 transition-colors hover:text-white"
            >
              <Instagram className="h-6 w-6" />
            </a>
          </div>

          <p className="max-w-3xl text-center text-xs text-white/60 md:text-right">
            All company names, logos, and registered and unregistered trade marks displayed on this website are the
            property of their respective owners. The use of any trade name or trade mark is for identification,
            suitability and reference purposes only. Vint Street is not affiliated, associated, endorsed by or in any
            way connected with the trade mark owners and does not claim any rights to these trade marks.
          </p>
        </div>
      </div>
    </footer>
  );
}
