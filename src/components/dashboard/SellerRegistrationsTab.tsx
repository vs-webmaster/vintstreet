import { useEffect, useState } from 'react';
import { Store, Calendar, Tag, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchSellerRegistrations } from '@/services/sellerRegistrations';
import { isFailure } from '@/types/api';

interface SellerRegistration {
  id: string;
  email: string;
  shop_name: string | null;
  categories: string[];
  selling_methods: string[];
  created_at: string;
}

export const SellerRegistrationsTab = () => {
  const [registrations, setRegistrations] = useState<SellerRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellerRegistrationsData();
  }, []);

  const fetchSellerRegistrationsData = async () => {
    try {
      const result = await fetchSellerRegistrations();
      if (isFailure(result)) {
        console.error('Error fetching seller registrations:', result.error);
        setRegistrations([]);
      } else {
        setRegistrations(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching seller registrations:', error);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Seller Pre-Registrations
          </CardTitle>
          <CardDescription>
            {registrations.length} {registrations.length === 1 ? 'seller has' : 'sellers have'} pre-registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No seller registrations yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Shop Name</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Selling Methods</TableHead>
                  <TableHead>Registered Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell className="font-medium">{registration.email}</TableCell>
                    <TableCell>
                      {registration.shop_name || <span className="italic text-muted-foreground">Not set</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {registration.categories.map((category) => (
                          <Badge key={category} variant="secondary" className="text-xs">
                            <Tag className="mr-1 h-3 w-3" />
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {registration.selling_methods.map((method) => (
                          <Badge key={method} variant="outline" className="text-xs">
                            <ShoppingBag className="mr-1 h-3 w-3" />
                            {method}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(registration.created_at), 'PPp')}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
