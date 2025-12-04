import { User, Mail, Phone, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SellerContactSidebarProps {
  sellerProfile: any;
}

export const SellerContactSidebar = ({ sellerProfile }: SellerContactSidebarProps) => {
  return (
    <div className="w-full lg:w-80">
      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="mb-3 flex items-center gap-2 font-medium text-foreground">
            <User className="h-4 w-4" />
            About
          </h3>
          <div className="whitespace-pre-wrap text-sm text-muted-foreground">
            {sellerProfile.shop_description || sellerProfile.business_name || 'Professional seller'}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 flex items-center gap-2 font-medium text-foreground">
            <Mail className="h-4 w-4" />
            Contact
          </h3>
          <div className="text-sm text-muted-foreground">{sellerProfile.contact_email || 'Contact via message'}</div>
          {sellerProfile.contact_phone && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              {sellerProfile.contact_phone}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 flex items-center gap-2 font-medium text-foreground">
            <MapPin className="h-4 w-4" />
            Location
          </h3>
          <div className="text-sm text-muted-foreground">
            {[sellerProfile.return_city, sellerProfile.return_state].filter(Boolean).join(', ') ||
              'Location not specified'}
          </div>
        </Card>
      </div>
    </div>
  );
};
