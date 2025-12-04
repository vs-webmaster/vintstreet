import { OffersTab } from '@/components/dashboard/OffersTab';
import { AdminLayout } from './AdminLayout';

export default function AdminVintOffersPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Vint Street Offers</h1>
          <p className="text-muted-foreground">Manage offers on Vint Street master listing products</p>
        </div>

        <OffersTab />
      </div>
    </AdminLayout>
  );
}
