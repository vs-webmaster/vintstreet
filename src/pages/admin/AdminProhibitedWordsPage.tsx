import { ProhibitedWordsTab } from '@/components/dashboard/ProhibitedWordsTab';
import { AdminLayout } from './AdminLayout';

const AdminProhibitedWordsPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Prohibited Words</h1>
        </div>
        <ProhibitedWordsTab />
      </div>
    </AdminLayout>
  );
};

export default AdminProhibitedWordsPage;
