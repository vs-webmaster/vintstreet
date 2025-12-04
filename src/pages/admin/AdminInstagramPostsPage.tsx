import { InstagramPostsManager } from '@/components/dashboard/InstagramPostsManager';
import { AdminLayout } from './AdminLayout';

const AdminInstagramPostsPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Instagram Posts</h1>
          <p className="mt-2 text-muted-foreground">Manage Instagram embed posts displayed on the homepage</p>
        </div>

        <InstagramPostsManager />
      </div>
    </AdminLayout>
  );
};

export default AdminInstagramPostsPage;
