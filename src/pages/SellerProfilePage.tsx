import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ContactSellerModal } from '@/components/ContactSellerModal';
import { SellerContactSidebar } from '@/components/seller-profile/SellerContactSidebar';
import { SellerProductsTab } from '@/components/seller-profile/SellerProductsTab';
import { SellerProfileHeader } from '@/components/seller-profile/SellerProfileHeader';
import { SellerReviewsTab } from '@/components/seller-profile/SellerReviewsTab';
import { SellerShowsTab } from '@/components/seller-profile/SellerShowsTab';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useSellerProfileData } from '@/hooks/useSellerProfileData';

const SellerProfilePage = () => {
  const { sellerId } = useParams();
  const { user } = useAuth();
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  const {
    sellerProfile,
    profileLoading,
    upcomingStreams,
    sellerProducts,
    reviews,
    userReview,
    isFollowing,
    followMutation,
    submitReviewMutation,
    getAverageRating,
  } = useSellerProfileData(sellerId, user?.id);

  const handleFollowToggle = () => {
    followMutation.mutate({ action: isFollowing ? 'unfollow' : 'follow' });
  };

  const handleReviewSubmit = (rating: number, comment: string) => {
    submitReviewMutation.mutate({ rating, comment });
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading seller profile...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!sellerProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="py-12 text-center">
            <User className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-2xl font-bold">Seller Not Found</h2>
            <p className="mb-4 text-muted-foreground">This seller profile doesn't exist or has been removed.</p>
            <Link to="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <SellerProfileHeader
          sellerProfile={sellerProfile}
          averageRating={getAverageRating()}
          reviewCount={reviews.length}
          isFollowing={isFollowing}
          onFollowToggle={handleFollowToggle}
          onMessageClick={() => setIsMessageModalOpen(true)}
          isFollowPending={followMutation.isPending}
        />

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Main Content - Tabs */}
          <div className="flex-1">
            <Tabs defaultValue="products" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="shows">Shows</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="products" className="mt-4">
                <SellerProductsTab products={sellerProducts} />
              </TabsContent>

              <TabsContent value="shows" className="mt-4">
                <SellerShowsTab streams={upcomingStreams} />
              </TabsContent>

              <TabsContent value="reviews" className="mt-4">
                <SellerReviewsTab
                  reviews={reviews}
                  userReview={userReview}
                  userId={user?.id}
                  sellerId={sellerId || ''}
                  onSubmitReview={handleReviewSubmit}
                  isSubmitting={submitReviewMutation.isPending}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - Contact Info */}
          <SellerContactSidebar sellerProfile={sellerProfile} />
        </div>
      </main>

      {/* Contact Seller Modal */}
      <ContactSellerModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        sellerId={sellerId || ''}
        sellerName={sellerProfile.shop_name || sellerProfile.business_name || 'Seller'}
      />
      <Footer />
    </div>
  );
};

export default SellerProfilePage;
