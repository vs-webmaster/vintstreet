import { PackageX, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdminLayout } from './AdminLayout';

const AdminReturnsPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Returns & Refunds</h1>
            <Button variant="outline">
              <PackageX className="mr-2 h-4 w-4" />
              Export Returns
            </Button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Returns</p>
                    <p className="text-2xl font-bold text-foreground">0</p>
                  </div>
                  <PackageX className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Approved Returns</p>
                    <p className="text-2xl font-bold text-foreground">0</p>
                  </div>
                  <PackageX className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rejected Returns</p>
                    <p className="text-2xl font-bold text-foreground">0</p>
                  </div>
                  <PackageX className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Refunded</p>
                    <p className="text-2xl font-bold text-foreground">£0.00</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>
            </div>
            <div className="py-12 text-center text-muted-foreground">
              <PackageX className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No returns to display</p>
              <p className="mt-2 text-sm">Returns functionality will be implemented here</p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminReturnsPage;
