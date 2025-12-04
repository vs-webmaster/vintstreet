import { BannersTab } from '@/components/dashboard/BannersTab';
import { AdminLayout } from './AdminLayout';

const AdminBannersPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Shop Banners</h1>
        </div>
        <BannersTab />
      </div>
    </AdminLayout>
  );
};

export default AdminBannersPage;
