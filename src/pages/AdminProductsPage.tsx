import { MasterListingsTab } from '@/components/dashboard/MasterListingsTab';
import { AdminLayout } from './admin/AdminLayout';

const AdminProductsPage = () => {
  return (
    <AdminLayout>
      <MasterListingsTab />
    </AdminLayout>
  );
};

export default AdminProductsPage;
