import { GuideManager } from '@/components/admin/GuideManager';
import { AdminLayout } from './AdminLayout';

const AdminGradingGuidesPage = () => {
  return (
    <AdminLayout>
      <GuideManager
        tableName="grading_guides"
        queryKey="grading-guides"
        guideType="grading"
        title="Grading Guides"
        addButtonText="Add Grading Guide"
        namePlaceholder="e.g., Vintage Clothing Grading"
        contentPlaceholder="Enter grading guide content..."
      />
    </AdminLayout>
  );
};

export default AdminGradingGuidesPage;
