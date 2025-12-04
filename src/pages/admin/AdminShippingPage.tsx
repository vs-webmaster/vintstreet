import { ShippingProvidersTab } from '@/components/dashboard/ShippingProvidersTab';
import { AdminLayout } from './AdminLayout';

const AdminShippingPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Shipping Providers</h1>
        </div>
        <ShippingProvidersTab />
      </div>
    </AdminLayout>
  );
};

export default AdminShippingPage;
