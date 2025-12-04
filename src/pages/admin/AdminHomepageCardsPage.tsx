import { ShopFeaturesManager } from '@/components/dashboard/ShopFeaturesManager';
import { AdminLayout } from './AdminLayout';

const AdminHomepageCardsPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Homepage Cards</h1>
          <p className="mt-2 text-muted-foreground">Manage the card section displayed on the homepage</p>
        </div>

        <ShopFeaturesManager />
      </div>
    </AdminLayout>
  );
};

export default AdminHomepageCardsPage;
