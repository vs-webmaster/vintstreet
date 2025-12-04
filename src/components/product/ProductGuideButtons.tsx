import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ruler, Award } from 'lucide-react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchGuidesByCategoryHierarchy } from '@/services/guides';
import { isFailure } from '@/types/api';

interface ProductGuideButtonsProps {
  categoryId?: string;
  subcategoryId?: string;
  subSubcategoryId?: string;
  subSubSubcategoryId?: string;
}

export const ProductGuideButtons = ({
  categoryId,
  subcategoryId,
  subSubcategoryId,
  subSubSubcategoryId,
}: ProductGuideButtonsProps) => {
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [gradingGuideOpen, setGradingGuideOpen] = useState(false);

  // Fetch guides based on category hierarchy (check all levels using junction tables)
  const { data: guides } = useQuery({
    queryKey: ['product-guides', categoryId, subcategoryId, subSubcategoryId, subSubSubcategoryId],
    queryFn: async () => {
      const result = await fetchGuidesByCategoryHierarchy({
        categoryId: categoryId || undefined,
        subcategoryId: subcategoryId || undefined,
        subSubcategoryId: subSubcategoryId || undefined,
        subSubSubcategoryId: subSubSubcategoryId || undefined,
      });

      if (isFailure(result)) {
        return { sizeGuide: null, gradingGuide: null };
      }

      return result.data;
    },
    enabled: !!(categoryId || subcategoryId || subSubcategoryId || subSubSubcategoryId),
  });

  if (!guides?.sizeGuide && !guides?.gradingGuide) {
    return null;
  }

  return (
    <div className="flex gap-2">
      {guides.sizeGuide && (
        <>
          <Button variant="outline" onClick={() => setSizeGuideOpen(true)} className="flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            Size Guide
          </Button>
          <Dialog open={sizeGuideOpen} onOpenChange={setSizeGuideOpen}>
            <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{guides.sizeGuide.name}</DialogTitle>
              </DialogHeader>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(guides.sizeGuide.content) }}
              />
            </DialogContent>
          </Dialog>
        </>
      )}

      {guides.gradingGuide && (
        <>
          <Button variant="outline" onClick={() => setGradingGuideOpen(true)} className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Grading Guide
          </Button>
          <Dialog open={gradingGuideOpen} onOpenChange={setGradingGuideOpen}>
            <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{guides.gradingGuide.name}</DialogTitle>
              </DialogHeader>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(guides.gradingGuide.content) }}
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};
