import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background px-4 py-16">
        <div className="text-center space-y-6 max-w-md">
          <div className="space-y-2">
            <h1 className="text-9xl font-bold text-primary">404</h1>
            <div className="h-1 w-24 bg-primary mx-auto rounded-full" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold text-foreground">Page Not Found</h2>
            <p className="text-lg text-muted-foreground">
              Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
            </p>
          </div>
          <Button asChild size="lg" className="mt-8">
            <Link to="/">
              <Home className="mr-2 h-5 w-5" />
              Return to Homepage
            </Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
