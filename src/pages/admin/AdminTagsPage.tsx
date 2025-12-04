import { TagsTab } from '@/components/dashboard/TagsTab';
import { AdminLayout } from './AdminLayout';

const AdminTagsPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tags Management</h1>
        </div>
        <TagsTab />
      </div>
    </AdminLayout>
  );
};

export default AdminTagsPage;
