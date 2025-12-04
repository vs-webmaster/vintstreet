import { ShopVideoSectionManager } from '@/components/dashboard/ShopVideoSectionManager';
import { AdminLayout } from './AdminLayout';

const AdminShopVideoPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Shop Video Section</h1>
          <p className="mt-2 text-muted-foreground">Manage the video showcase section on the shop page</p>
        </div>

        <ShopVideoSectionManager />
      </div>
    </AdminLayout>
  );
};

export default AdminShopVideoPage;
