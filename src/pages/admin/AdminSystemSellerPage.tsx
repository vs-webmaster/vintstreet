import { SystemSellerTab } from '@/components/dashboard/SystemSellerTab';
import { AdminLayout } from './AdminLayout';

const AdminSystemSellerPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">System Seller Settings</h1>
        </div>
        <SystemSellerTab />
      </div>
    </AdminLayout>
  );
};

export default AdminSystemSellerPage;
