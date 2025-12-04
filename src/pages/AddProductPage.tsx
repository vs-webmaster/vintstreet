import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AIAnalysisIndicator } from '@/components/product-form/AIAnalysisIndicator';
import { CategorySelectionForm } from '@/components/product-form/CategorySelectionForm';
import { DynamicAttributesForm } from '@/components/product-form/DynamicAttributesForm';
import { ImageRejectionDialog } from '@/components/product-form/ImageRejectionDialog';
import { ImageUploadSection } from '@/components/product-form/ImageUploadSection';
import { MarketplaceVisibilityCard } from '@/components/product-form/MarketplaceVisibilityCard';
import { ProductFormHeader } from '@/components/product-form/ProductFormHeader';
import { ProductFormLayout } from '@/components/product-form/ProductFormLayout';
import { ProductInfoForm } from '@/components/product-form/ProductInfoForm';
import { StockManagementForm } from '@/components/product-form/StockManagementForm';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useAIImageAnalysis } from '@/hooks/useAIImageAnalysis';
import { useCategorySelection } from '@/hooks/useCategorySelection';
import { useDynamicAttributes } from '@/hooks/useDynamicAttributes';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useProductForm } from '@/hooks/useProductForm';
import { useProductSubmission } from '@/hooks/useProductSubmission';
import { useProhibitedWordsValidation } from '@/hooks/useProhibitedWordsValidation';
import {
  fetchCategories,
  fetchSubcategories,
  fetchSubSubcategories,
  fetchSubSubSubcategories,
} from '@/services/categories';
import { fetchAuctionDataByListingId } from '@/services/auctions';
import { isSuccess, isFailure } from '@/types/api';

const AddProductPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const { user } = useAuth();
  const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionType, setRejectionType] = useState<'rejected' | 'uncertain'>('rejected');
  const [needsModeration, setNeedsModeration] = useState(false);
  const [listingType, setListingType] = useState<'marketplace' | 'auction'>('marketplace');
  const [auctionData, setAuctionData] = useState({
    reservePrice: '',
    startingBid: '',
    duration: '7',
  });

  const {
    formData,
    dynamicAttributes,
    productImages,
    isLoading: isLoadingProduct,
    updateFormData,
    updateDynamicAttribute,
    resetDynamicAttributes,
  } = useProductForm(id);

  const {
    images,
    currentImages,
    mainImageIndex,
    addImages,
    removeImage,
    removeCurrentImage,
    uploadImages,
    setInitialImages,
    setMainImageIndex,
  } = useImageUpload(user?.id || '');

  const { attributes, saveAttributeValues } = useDynamicAttributes(
    formData.categoryId,
    formData.subcategoryId,
    formData.subSubcategoryId,
  );

  const { nameErrors, descriptionErrors } = useProhibitedWordsValidation({
    productName: formData.name,
    productDescription: formData.description,
  });

  const { analyzeImage, isAnalyzing } = useAIImageAnalysis({
    formData,
    updateFormData,
    onImageRejected: (reason, type) => {
      setRejectionReason(reason);
      setRejectionType(type);
      setRejectionDialogOpen(true);
    },
  });

  const { handleCategorySelect, handleSubcategorySelect, handleSubSubcategorySelect, handleSubSubSubcategorySelect } =
    useCategorySelection({
      updateFormData,
      resetDynamicAttributes,
    });

  const { submitProduct, isSubmitting } = useProductSubmission({
    userId: user?.id || '',
    isEditMode,
    productId: id,
    formData,
    dynamicAttributes,
    uploadImages,
    saveAttributeValues,
    needsModeration,
    listingType,
    auctionData,
  });

  // Load existing images when editing
  useEffect(() => {
    if (isEditMode && productImages.length > 0) {
      setInitialImages(productImages);
    }
  }, [productImages, isEditMode, setInitialImages]);

  // Load auction type and data when editing
  useEffect(() => {
    if (isEditMode && id && formData.auctionType === 'timed') {
      setListingType('auction');

      // Fetch auction data
      const fetchAuctionData = async () => {
        const result = await fetchAuctionDataByListingId(id);
        if (isSuccess(result) && result.data) {
          setAuctionData({
            reservePrice: result.data.reserve_price?.toString() || '',
            startingBid: result.data.starting_bid?.toString() || '',
            duration: result.data.auction_duration?.toString() || '7',
          });
        }
      };

      fetchAuctionData();
    } else if (formData.auctionType === null) {
      setListingType('marketplace');
    }
  }, [isEditMode, id, formData.auctionType]);

  // Fetch categories with caching
  const { data: categoriesData = [] } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const result = await fetchCategories();
      if (isFailure(result)) throw result.error;
      if (isSuccess(result)) return result.data;
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Sort categories to match marketplace navigation order
  const categories = [...categoriesData].sort((a, b) => {
    const order = ['men', 'women', 'kids', 'accessories', 'collectibles', 'home'];
    const aIndex = order.findIndex((cat) => a.name.toLowerCase().includes(cat));
    const bIndex = order.findIndex((cat) => b.name.toLowerCase().includes(cat));

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return 0;
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ['product-subcategories', formData.categoryId],
    queryFn: async () => {
      if (!formData.categoryId) return [];

      const result = await fetchSubcategories(formData.categoryId);
      if (isFailure(result)) throw result.error;
      if (isSuccess(result)) return result.data;
      return [];
    },
    enabled: !!formData.categoryId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: subSubcategories = [] } = useQuery({
    queryKey: ['product-sub-subcategories', formData.subcategoryId],
    queryFn: async () => {
      if (!formData.subcategoryId) return [];

      const result = await fetchSubSubcategories(formData.subcategoryId);
      if (isFailure(result)) throw result.error;
      if (isSuccess(result)) return result.data;
      return [];
    },
    enabled: !!formData.subcategoryId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: subSubSubcategories = [] } = useQuery({
    queryKey: ['product-sub-sub-subcategories', formData.subSubcategoryId],
    queryFn: async () => {
      if (!formData.subSubcategoryId) return [];

      const result = await fetchSubSubSubcategories(formData.subSubcategoryId);
      if (isFailure(result)) throw result.error;
      if (isSuccess(result)) return result.data;
      return [];
    },
    enabled: !!formData.subSubcategoryId,
    staleTime: 5 * 60 * 1000,
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      addImages(files);

      // Only analyze if this is the first image and we're not editing
      if (images.length === 0 && currentImages.length === 0 && !isEditMode) {
        const firstImage = files[0];
        await analyzeImage(firstImage);
      }
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-4xl p-6">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-4xl p-6">
        <ProductFormHeader isEditMode={isEditMode} onBack={() => navigate('/seller#products')} />

        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <ProductFormLayout
            sidebar={
              <MarketplaceVisibilityCard
                isMarketplaceListed={formData.isMarketplaceListed}
                onToggle={(value) => updateFormData('isMarketplaceListed', value)}
                isSubmitting={isSubmitting}
                isEditMode={isEditMode}
                listingType={listingType}
                onSaveDraft={async () => {
                  const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
                  await submitProduct(syntheticEvent, 'draft');
                }}
                onPublish={async () => {
                  const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
                  await submitProduct(syntheticEvent, 'publish');
                }}
              />
            }
          >
            <ImageUploadSection
              currentImages={currentImages}
              newImages={images}
              onImageUpload={handleImageUpload}
              onRemoveImage={removeImage}
              onRemoveCurrentImage={removeCurrentImage}
              mainImageIndex={mainImageIndex}
              onSetMainImage={setMainImageIndex}
            />

            {isAnalyzing && <AIAnalysisIndicator />}

            <ProductInfoForm
              formData={formData}
              onInputChange={updateFormData}
              onSelectBrand={(brandId, brandName) => {
                updateFormData('brand_id', brandId || '');
              }}
              nameErrors={nameErrors}
              descriptionErrors={descriptionErrors}
              listingType={listingType}
              onListingTypeChange={setListingType}
              auctionData={auctionData}
              onAuctionDataChange={(field, value) => {
                setAuctionData((prev) => ({ ...prev, [field]: value }));
              }}
            />

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold">Category & Attributes</h3>
              <div className="space-y-4">
                <CategorySelectionForm
                  categories={categories}
                  subcategories={subcategories}
                  subSubcategories={subSubcategories}
                  subSubSubcategories={subSubSubcategories}
                  selectedCategoryId={formData.categoryId}
                  selectedSubcategoryId={formData.subcategoryId}
                  selectedSubSubcategoryId={formData.subSubcategoryId}
                  selectedSubSubSubcategoryId={formData.subSubSubcategoryId}
                  isOpen={isCategorySelectorOpen}
                  onOpenChange={setIsCategorySelectorOpen}
                  onCategorySelect={handleCategorySelect}
                  onSubcategorySelect={handleSubcategorySelect}
                  onSubSubcategorySelect={handleSubSubcategorySelect}
                  onSubSubSubcategorySelect={handleSubSubSubcategorySelect}
                  onComplete={() => setIsCategorySelectorOpen(false)}
                  productId={id}
                  isEditMode={isEditMode}
                />

                {attributes.length > 0 && (
                  <DynamicAttributesForm
                    attributes={attributes}
                    dynamicAttributes={dynamicAttributes}
                    onAttributeChange={updateDynamicAttribute}
                  />
                )}
              </div>
            </Card>

            <StockManagementForm
              itemType={formData.itemType}
              stockQuantity={formData.stockQuantity}
              onItemTypeChange={(value) => updateFormData('itemType', value)}
              onStockQuantityChange={(value) => updateFormData('stockQuantity', value)}
            />
          </ProductFormLayout>
        </form>
      </div>

      <ImageRejectionDialog
        open={rejectionDialogOpen}
        onOpenChange={setRejectionDialogOpen}
        reason={rejectionReason}
        type={rejectionType}
        onOverride={() => {
          setNeedsModeration(rejectionType === 'rejected');
        }}
      />

      <Footer />
    </div>
  );
};

export default AddProductPage;
