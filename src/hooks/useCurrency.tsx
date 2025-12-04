import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { fetchCurrencyRates } from '@/services/settings';
import { updateProfile } from '@/services/users';
import { isFailure } from '@/types/api';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  convertPrice: (gbpPrice: number) => number;
  formatPrice: (amount: number) => string;
  rates: Record<string, number>;
  isLoading: boolean;
}

const detectUserCurrency = (): string => {
  const locale = navigator.language;
  const currencyMap: Record<string, string> = {
    'en-US': 'USD',
    'en-GB': 'GBP',
    'en-CA': 'CAD',
    'en-AU': 'AUD',
    ja: 'JPY',
    'ja-JP': 'JPY',
    de: 'EUR',
    'de-DE': 'EUR',
    fr: 'EUR',
    'fr-FR': 'EUR',
    es: 'EUR',
    'es-ES': 'EUR',
    it: 'EUR',
    'it-IT': 'EUR',
  };
  return currencyMap[locale] || 'GBP';
};

const getLocaleForCurrency = (currency: string): string => {
  const localeMap: Record<string, string> = {
    USD: 'en-US',
    GBP: 'en-GB',
    EUR: 'de-DE',
    CAD: 'en-CA',
    AUD: 'en-AU',
    JPY: 'ja-JP',
  };
  return localeMap[currency] || 'en-GB';
};

const roundPrice = (price: number, currency: string): number => {
  // Round to nearest .99 for psychological pricing
  if (currency === 'JPY') {
    return Math.round(price / 100) * 100; // Round to nearest 100 yen
  }
  return Math.ceil(price) - 0.01; // e.g., 49.99 instead of 50.23
};

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useAuth();

  const [currency, setCurrencyState] = useState<string>(() => {
    const fromProfile = profile?.preferred_currency?.toUpperCase();
    const fromStorage = localStorage.getItem('preferredCurrency')?.toUpperCase() || undefined;
    return fromProfile || fromStorage || detectUserCurrency();
  });

  // Update currency when profile loads
  useEffect(() => {
    const pref = profile?.preferred_currency?.toUpperCase();
    if (pref && pref !== currency) {
      setCurrencyState(pref);
      localStorage.setItem('preferredCurrency', pref);
    }
  }, [profile?.preferred_currency, currency]);

  // Fetch rates from service
  const { data: ratesData, isLoading } = useQuery({
    queryKey: ['currency-rates'],
    queryFn: async () => {
      const result = await fetchCurrencyRates();
      if (isFailure(result)) {
        throw result.error;
      }
      return result.data || { GBP: 1 };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 60 * 1000, // 1 hour
    initialData: { GBP: 1 },
  });

  const rates = ratesData || { GBP: 1 };

  const setCurrency = async (newCurrency: string) => {
    const code = newCurrency?.toUpperCase?.() || 'GBP';
    setCurrencyState(code);
    localStorage.setItem('preferredCurrency', code);

    // Save to database if user is logged in
    if (user?.id) {
      try {
        const result = await updateProfile(user.id, { preferred_currency: code });
        if (isFailure(result)) {
          console.error('Error saving currency preference:', result.error);
        }
      } catch (error) {
        console.error('Error saving currency preference:', error);
      }
    }
  };

  const convertPrice = (gbpPrice: number): number => {
    const code = currency?.toUpperCase?.() || 'GBP';
    if (code === 'GBP') return gbpPrice;

    const rate = rates[code];

    if (!rate) {
      return gbpPrice;
    }

    const converted = gbpPrice * rate;
    return roundPrice(converted, code);
  };

  const formatPrice = (amount: number): string => {
    const code = currency?.toUpperCase?.() || 'GBP';
    try {
      return new Intl.NumberFormat(getLocaleForCurrency(code), {
        style: 'currency',
        currency: code,
        minimumFractionDigits: code === 'JPY' ? 0 : 2,
        maximumFractionDigits: code === 'JPY' ? 0 : 2,
      }).format(amount);
    } catch (error) {
      console.error('Error formatting price:', error);
      return `${code} ${amount.toFixed(2)}`;
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        convertPrice,
        formatPrice,
        rates,
        isLoading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};
