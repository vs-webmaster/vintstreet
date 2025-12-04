import { useEffect, useState } from 'react';

interface GoogleMapsLoaderProps {
  apiKey: string;
  libraries?: string[];
  children: React.ReactNode;
}

export const GoogleMapsLoader = ({ apiKey, libraries = ['places'], children }: GoogleMapsLoaderProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      existingScript.addEventListener('error', () => setLoadError('Failed to load Google Maps'));
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    const librariesParam = libraries.length > 0 ? `&libraries=${libraries.join(',')}` : '';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}${librariesParam}&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      setLoadError('Failed to load Google Maps API');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script if component unmounts (optional)
      // Note: We usually don't remove it as it might be used by other components
    };
  }, [apiKey, libraries]);

  if (loadError) {
    console.error('Google Maps API Error:', loadError);
    // Still render children, but autocomplete won't work
    return <>{children}</>;
  }

  return <>{children}</>;
};
