import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ScrollToTopButton = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      const scrollTop = window.pageYOffset;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Show scroll to top if scrolled down more than 300px
      if (scrollTop > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }

      // Show scroll to bottom if not at the bottom (with 100px threshold)
      if (scrollTop + windowHeight < documentHeight - 100) {
        setShowScrollBottom(true);
      } else {
        setShowScrollBottom(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    toggleVisibility(); // Check on mount

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="animate-fade-in fixed bottom-24 right-8 z-50 h-12 w-12 rounded-full shadow-lg transition-transform hover:scale-110"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
      {showScrollBottom && (
        <Button
          onClick={scrollToBottom}
          size="icon"
          className="animate-fade-in fixed bottom-8 right-8 z-50 h-12 w-12 rounded-full shadow-lg transition-transform hover:scale-110"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="h-5 w-5" />
        </Button>
      )}
    </>
  );
};
