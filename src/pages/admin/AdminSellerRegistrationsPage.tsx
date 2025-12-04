import { SellerRegistrationsTab } from '@/components/dashboard/SellerRegistrationsTab';
import { AdminLayout } from './AdminLayout';

const AdminSellerRegistrationsPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Seller Pre-Registrations</h1>
        </div>
        <SellerRegistrationsTab />
      </div>
    </AdminLayout>
  );
};

export default AdminSellerRegistrationsPage;
