import { FoundersListTab } from '@/components/dashboard/FoundersListTab';
import { AdminLayout } from './AdminLayout';

const AdminFoundersPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Founders List</h1>
        </div>
        <FoundersListTab />
      </div>
    </AdminLayout>
  );
};

export default AdminFoundersPage;
