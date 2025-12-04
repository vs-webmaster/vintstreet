import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';

interface ParsedAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: ParsedAddress) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
  disabled?: boolean;
}

export const AddressAutocomplete = ({
  value,
  onChange,
  onAddressSelect,
  label = 'Address Line 1',
  placeholder = 'Start typing your address...',
  required = false,
  id = 'addressLine1',
  disabled = false,
}: AddressAutocompleteProps) => {
  const { inputRef, isLoaded } = useGooglePlacesAutocomplete(onAddressSelect);

  return (
    <div>
      {label && (
        <Label htmlFor={id}>
          {label} {required && '*'}
        </Label>
      )}
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isLoaded ? placeholder : 'Loading address autocomplete...'}
        required={required}
        disabled={disabled || !isLoaded}
        autoComplete="off"
      />
      {!isLoaded && (
        <p className="mt-1 text-xs text-muted-foreground">
          Address autocomplete is loading. Please ensure VITE_GOOGLE_MAPS_API_KEY is set.
        </p>
      )}
    </div>
  );
};
