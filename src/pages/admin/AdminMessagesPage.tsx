import { AdminMessagesTab } from '@/components/dashboard/AdminMessagesTab';
import { AdminLayout } from './AdminLayout';

const AdminMessagesPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Messages</h1>
        </div>
        <AdminMessagesTab />
      </div>
    </AdminLayout>
  );
};

export default AdminMessagesPage;
