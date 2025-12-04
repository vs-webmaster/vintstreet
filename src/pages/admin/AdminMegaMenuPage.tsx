import { MegaMenuTab } from '@/components/dashboard/MegaMenuTab';
import { AdminLayout } from './AdminLayout';

const AdminMegaMenuPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Mega Menu Configuration</h1>
        </div>
        <MegaMenuTab />
      </div>
    </AdminLayout>
  );
};

export default AdminMegaMenuPage;
