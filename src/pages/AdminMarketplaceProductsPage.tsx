import { MarketplaceProductsTable } from '@/components/dashboard/MarketplaceProductsTable';
import { AdminLayout } from './admin/AdminLayout';

const AdminMarketplaceProductsPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Marketplace Products</h1>
          <p className="mt-2 text-muted-foreground">
            View and manage all seller marketplace listings. Suspend products that violate marketplace policies.
          </p>
        </div>
        <MarketplaceProductsTable />
      </div>
    </AdminLayout>
  );
};

export default AdminMarketplaceProductsPage;
