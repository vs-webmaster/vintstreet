import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import { MasterProductsTable } from '@/components/dashboard/MasterProductsTable';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { fetchSystemSellerProfile } from '@/services/users';
import { isFailure } from '@/types/api';

const AdminPublishedProductsPage = () => {
  const navigate = useNavigate();

  // Fetch system seller profile
  const { data: systemSeller } = useQuery({
    queryKey: ['system-seller'],
    queryFn: async () => {
      const result = await fetchSystemSellerProfile();
      if (isFailure(result)) throw result.error;
      return result.data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6 p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/products')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Button>
            <h1 className="text-2xl font-bold">Published Products</h1>
            <div className="w-24"></div>
          </div>
        </Card>

        <MasterProductsTable systemSellerId={systemSeller?.user_id} showPublishedProducts={true} />
      </main>
    </div>
  );
};

export default AdminPublishedProductsPage;
