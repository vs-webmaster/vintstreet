import { ShopBrandSectionManager } from '@/components/dashboard/ShopBrandSectionManager';
import { AdminLayout } from './AdminLayout';

const AdminShopBrandSectionPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Shop Brand Section</h1>
          <p className="mt-2 text-muted-foreground">Manage brand links displayed on the shop page</p>
        </div>

        <ShopBrandSectionManager />
      </div>
    </AdminLayout>
  );
};

export default AdminShopBrandSectionPage;
