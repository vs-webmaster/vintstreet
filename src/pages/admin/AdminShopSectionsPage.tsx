import { ShopSectionsTab } from '@/components/dashboard/ShopSectionsTab';
import { AdminLayout } from './AdminLayout';

const AdminShopSectionsPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Shop Sections</h1>
        </div>
        <ShopSectionsTab />
      </div>
    </AdminLayout>
  );
};

export default AdminShopSectionsPage;
