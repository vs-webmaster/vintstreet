import { useState, useEffect, useRef } from 'react';

interface UseSequentialImageLoaderProps {
  src: string;
  index: number;
  totalImages: number;
}

export const useSequentialImageLoader = ({ src, index, totalImages }: UseSequentialImageLoaderProps) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Set up visibility detection
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      {
        rootMargin: '200px',
        threshold: 0.01,
      },
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Controlled sequential loading
  useEffect(() => {
    // Visible images get immediate priority
    if (isVisible) {
      setShouldLoad(true);
      return;
    }

    // First 8 images load sequentially with short delays
    if (index < 8) {
      const loadDelay = index * 100;
      const timer = setTimeout(() => {
        setShouldLoad(true);
      }, loadDelay);
      return () => clearTimeout(timer);
    }

    // Images beyond the first 8 wait until they become visible
    // or load with a longer delay
    const loadDelay = 800 + (index - 8) * 150;
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, loadDelay);

    return () => clearTimeout(timer);
  }, [index, isVisible]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return {
    imgRef,
    shouldLoad,
    isLoaded,
    isVisible,
    handleLoad,
  };
};
