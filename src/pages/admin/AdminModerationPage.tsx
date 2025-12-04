import { ModerationTab } from '@/components/dashboard/ModerationTab';
import { AdminLayout } from './AdminLayout';

const AdminModerationPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">HIVE Moderation</h1>
        </div>
        <ModerationTab />
      </div>
    </AdminLayout>
  );
};

export default AdminModerationPage;
