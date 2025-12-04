import { BrandsTab } from '@/components/dashboard/BrandsTab';
import { AdminLayout } from './AdminLayout';

const AdminBrandsPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Brands Management</h1>
        </div>
        <BrandsTab />
      </div>
    </AdminLayout>
  );
};

export default AdminBrandsPage;
