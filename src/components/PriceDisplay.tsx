import { useCurrency } from '@/hooks/useCurrency';

interface PriceDisplayProps {
  gbpPrice: number;
  className?: string;
  showOriginal?: boolean;
}

export const PriceDisplay = ({ gbpPrice, className, showOriginal }: PriceDisplayProps) => {
  const { currency, convertPrice, formatPrice } = useCurrency();
  const convertedPrice = convertPrice(gbpPrice);

  return (
    <div className={className}>
      <span className="font-bold">{formatPrice(convertedPrice)}</span>
      {showOriginal && currency !== 'GBP' && (
        <span className="ml-2 text-sm text-muted-foreground">(£{gbpPrice.toFixed(2)} GBP)</span>
      )}
    </div>
  );
};
