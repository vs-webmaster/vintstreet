// Basket Country Selection Dialog
// Allows users to select shipping destination

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BasketCountryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shippingCountry: string;
  onCountryChange: (country: string) => void;
  ukRegion: string;
  onUkRegionChange: (region: string) => void;
}

export const BasketCountryDialog = ({
  open,
  onOpenChange,
  shippingCountry,
  onCountryChange,
  ukRegion,
  onUkRegionChange,
}: BasketCountryDialogProps) => {
  const handleCountrySelect = (value: string) => {
    onCountryChange(value);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Shipping Destination</DialogTitle>
          <DialogDescription>Please select your shipping country to see available shipping options</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="dialog-shipping-country">Country *</Label>
            <Select value={shippingCountry} onValueChange={handleCountrySelect}>
              <SelectTrigger id="dialog-shipping-country" className="mt-2">
                <SelectValue placeholder="Select shipping country" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="GB">United Kingdom</SelectItem>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
                <SelectItem value="AU">Australia</SelectItem>
                <SelectItem value="DE">Germany</SelectItem>
                <SelectItem value="FR">France</SelectItem>
                <SelectItem value="ES">Spain</SelectItem>
                <SelectItem value="IT">Italy</SelectItem>
                <SelectItem value="NL">Netherlands</SelectItem>
                <SelectItem value="BE">Belgium</SelectItem>
                <SelectItem value="IE">Ireland</SelectItem>
                <SelectItem value="SE">Sweden</SelectItem>
                <SelectItem value="NO">Norway</SelectItem>
                <SelectItem value="DK">Denmark</SelectItem>
                <SelectItem value="FI">Finland</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {shippingCountry === 'GB' && (
            <div className="space-y-3">
              <Label>Is your shipping address located in:</Label>
              <RadioGroup value={ukRegion} onValueChange={onUkRegionChange}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="region-none" />
                  <Label htmlFor="region-none" className="cursor-pointer font-normal">
                    None of these
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scottish" id="region-scottish" />
                  <Label htmlFor="region-scottish" className="cursor-pointer font-normal">
                    Scottish Highlands & Islands
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="northern-ireland" id="region-northern-ireland" />
                  <Label htmlFor="region-northern-ireland" className="cursor-pointer font-normal">
                    Northern Ireland
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="isle-of-man" id="region-isle-of-man" />
                  <Label htmlFor="region-isle-of-man" className="cursor-pointer font-normal">
                    Isle of Man
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
