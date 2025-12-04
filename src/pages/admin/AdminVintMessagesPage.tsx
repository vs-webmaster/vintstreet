import { MessagesTab } from '@/components/dashboard/MessagesTab';
import { AdminLayout } from './AdminLayout';

export default function AdminVintMessagesPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Vint Street Messages</h1>
          <p className="text-muted-foreground">Manage messages related to Vint Street master listing products</p>
        </div>

        <MessagesTab />
      </div>
    </AdminLayout>
  );
}
