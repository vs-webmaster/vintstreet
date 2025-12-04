import { GuideManager } from '@/components/admin/GuideManager';
import { AdminLayout } from './AdminLayout';

const AdminSizeGuidesPage = () => {
  return (
    <AdminLayout>
      <GuideManager
        tableName="size_guides"
        queryKey="size-guides"
        guideType="size"
        title="Size Guides"
        addButtonText="Add Size Guide"
        namePlaceholder="e.g., Jeans Size Guide"
        contentPlaceholder="Enter size guide content..."
      />
    </AdminLayout>
  );
};

export default AdminSizeGuidesPage;
