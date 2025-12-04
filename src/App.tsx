import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CookieConsent } from '@/components/CookieConsent';
import { GoogleMapsLoader } from '@/components/GoogleMapsLoader';
import { ScrollToTop } from '@/components/ScrollToTop';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import HomePage from '@/pages/HomePage';
import LivePage from '@/pages/LivePage';
import AboutPage from '@/pages/AboutPage';
import BecomeSellerSignupPage from '@/pages/BecomeSellerSignupPage';
import StreamPage from '@/pages/StreamPage';
import StartStreamPage from '@/pages/StartStreamPage';
import SellerDashboard from '@/pages/SellerDashboard';
import BuyerDashboard from '@/pages/BuyerDashboard';
import ScheduleStreamPage from '@/pages/ScheduleStreamPage';
import AddProductPage from '@/pages/AddProductPage';
import AuthPage from '@/pages/AuthPage';
import ConfirmEmailPage from '@/pages/ConfirmEmailPage';
import ShopPage from '@/pages/ShopPage';
import AuctionsPage from '@/pages/AuctionsPage';
import ProductPage from '@/pages/ProductPage';
import BasketPage from '@/pages/BasketPage';
import CheckoutPage from '@/pages/CheckoutPage';
import PaymentSuccessPage from '@/pages/PaymentSuccessPage';
import ProfilePage from '@/pages/ProfilePage';
import MyOrdersPage from '@/pages/MyOrdersPage';
import MyOffersPage from '@/pages/MyOffersPage';
import MyMessagesPage from '@/pages/MyMessagesPage';
import NotificationsPage from '@/pages/NotificationsPage';
import SellerProfilePage from '@/pages/SellerProfilePage';
import DeveloperApiDocs from '@/pages/DeveloperApiDocs';
import FoundersListPage from '@/pages/FoundersListPage';
import WishlistPage from '@/pages/WishlistPage';
import SharedWishlistPage from '@/pages/SharedWishlistPage';
import AdminProductsPage from '@/pages/AdminProductsPage';
import AdminOverviewPage from '@/pages/admin/AdminOverviewPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminFoundersPage from '@/pages/admin/AdminFoundersPage';
import AdminSellerRegistrationsPage from '@/pages/admin/AdminSellerRegistrationsPage';
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage';
import AdminMarketplaceOrdersPage from '@/pages/admin/AdminMarketplaceOrdersPage';
import AdminVintMessagesPage from '@/pages/admin/AdminVintMessagesPage';
import AdminVintOffersPage from '@/pages/admin/AdminVintOffersPage';
import AdminReturnsPage from '@/pages/admin/AdminReturnsPage';
import AdminShippingPage from '@/pages/admin/AdminShippingPage';
import AdminBuyerProtectionPage from '@/pages/admin/AdminBuyerProtectionPage';
import AdminSellerFeesPage from '@/pages/admin/AdminSellerFeesPage';
import AdminCategoriesPage from '@/pages/admin/AdminCategoriesPage';
import AdminCategoryFiltersPage from '@/pages/admin/AdminCategoryFiltersPage';
import AdminAttributesPage from '@/pages/admin/AdminAttributesPage';
import AdminManageAttributesPage from '@/pages/admin/AdminManageAttributesPage';
import AdminBrandsPage from '@/pages/admin/AdminBrandsPage';
import AdminTagsPage from '@/pages/admin/AdminTagsPage';
import AdminSystemSellerPage from '@/pages/admin/AdminSystemSellerPage';
import AdminContentPage from '@/pages/admin/AdminContentPage';
import AdminContentEditorPage from '@/pages/admin/AdminContentEditorPage';
import AdminFooterPage from '@/pages/admin/AdminFooterPage';
import AdminSupportPage from '@/pages/admin/AdminSupportPage';
import AdminMegaMenuPage from '@/pages/admin/AdminMegaMenuPage';
import AdminBannersPage from '@/pages/admin/AdminBannersPage';
import AdminHomepageCardsPage from '@/pages/admin/AdminHomepageCardsPage';
import AdminShopVideoPage from '@/pages/admin/AdminShopVideoPage';
import AdminShopSectionsPage from '@/pages/admin/AdminShopSectionsPage';
import AdminShopBrandSectionPage from '@/pages/admin/AdminShopBrandSectionPage';
import AdminProhibitedWordsPage from '@/pages/admin/AdminProhibitedWordsPage';
import AdminPromoMessagePage from '@/pages/admin/AdminPromoMessagePage';
import AdminModerationPage from '@/pages/admin/AdminModerationPage';
import AdminMessagesPage from '@/pages/admin/AdminMessagesPage';
import AdminNoProductsSettingsPage from '@/pages/admin/AdminNoProductsSettingsPage';
import AdminCategoryGridImagesPage from '@/pages/admin/AdminCategoryGridImagesPage';
import AdminShopHeroImagesPage from '@/pages/admin/AdminShopHeroImagesPage';
import ContentPage from '@/pages/ContentPage';
import AdminSoldProductsPage from '@/pages/AdminSoldProductsPage';
import AdminDraftProductsPage from '@/pages/AdminDraftProductsPage';
import AdminPrivateProductsPage from '@/pages/AdminPrivateProductsPage';
import AdminPublishedProductsPage from '@/pages/AdminPublishedProductsPage';
import AdminMissingImagesProductsPage from '@/pages/AdminMissingImagesProductsPage';
import AdminArchivedProductsPage from '@/pages/AdminArchivedProductsPage';
import AdminMarketplaceProductsPage from '@/pages/AdminMarketplaceProductsPage';
import BulkEditProductsPage from '@/pages/BulkEditProductsPage';
import MyAddressesPage from '@/pages/MyAddressesPage';
import BlogPage from '@/pages/BlogPage';
import BlogPostPage from '@/pages/BlogPostPage';
import AdminBlogPage from '@/pages/admin/AdminBlogPage';
import AdminBlogEditorPage from '@/pages/admin/AdminBlogEditorPage';
import AdminBlogCategoriesPage from '@/pages/admin/AdminBlogCategoriesPage';
import AdminBlogTagsPage from '@/pages/admin/AdminBlogTagsPage';
import AdminSizeGuidesPage from '@/pages/admin/AdminSizeGuidesPage';
import AdminGradingGuidesPage from '@/pages/admin/AdminGradingGuidesPage';
import AdminAppContentPage from '@/pages/admin/AdminAppContentPage';
import AdminInstagramPostsPage from '@/pages/admin/AdminInstagramPostsPage';
import AdminDataRecoveryPage from '@/pages/admin/AdminDataRecoveryPage';
import TagPage from '@/pages/TagPage';
import SearchPage from '@/pages/SearchPage';
import SupportPage from '@/pages/SupportPage';
import NotFound from '@/pages/NotFound';
import { AppProvider } from '@/hooks/useApp';
import { AuthProvider } from '@/hooks/useAuth';
import { CartProvider } from '@/hooks/useCart';
import { CurrencyProvider } from '@/hooks/useCurrency';
import { WishlistProvider } from '@/hooks/useWishlist';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const SellerRoute = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const App = () => {
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  return (
    <GoogleMapsLoader apiKey={googleMapsApiKey}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppProvider>
            <AuthProvider>
              <CurrencyProvider>
                <CartProvider>
                  <WishlistProvider>
                    <ScrollToTop />
                    <CookieConsent />
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/live" element={<LivePage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/become-seller" element={<BecomeSellerSignupPage />} />
                      <Route path="/stream/:id" element={<StreamPage />} />
                      <Route
                        path="/seller"
                        element={
                          <SellerRoute>
                            <SellerDashboard />
                          </SellerRoute>
                        }
                      />
                      <Route
                        path="/start-stream"
                        element={
                          <SellerRoute>
                            <StartStreamPage />
                          </SellerRoute>
                        }
                      />
                      <Route
                        path="/start-stream/:streamId"
                        element={
                          <SellerRoute>
                            <StartStreamPage />
                          </SellerRoute>
                        }
                      />
                      <Route
                        path="/schedule-stream"
                        element={
                          <SellerRoute>
                            <ScheduleStreamPage />
                          </SellerRoute>
                        }
                      />
                      <Route
                        path="/add-product"
                        element={
                          <SellerRoute>
                            <AddProductPage />
                          </SellerRoute>
                        }
                      />
                      <Route
                        path="/edit-product/:id"
                        element={
                          <SellerRoute>
                            <AddProductPage />
                          </SellerRoute>
                        }
                      />
                      <Route
                        path="/buyer"
                        element={
                          <ProtectedRoute>
                            <BuyerDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute>
                            <Navigate to="/admin/overview" replace />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/overview"
                        element={
                          <ProtectedRoute>
                            <AdminOverviewPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/users"
                        element={
                          <ProtectedRoute>
                            <AdminUsersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/founders"
                        element={
                          <ProtectedRoute>
                            <AdminFoundersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/seller-registrations"
                        element={
                          <ProtectedRoute>
                            <AdminSellerRegistrationsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/orders"
                        element={
                          <ProtectedRoute>
                            <AdminOrdersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/vint-messages"
                        element={
                          <ProtectedRoute>
                            <AdminVintMessagesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/vint-offers"
                        element={
                          <ProtectedRoute>
                            <AdminVintOffersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/marketplace-orders"
                        element={
                          <ProtectedRoute>
                            <AdminMarketplaceOrdersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/returns"
                        element={
                          <ProtectedRoute>
                            <AdminReturnsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/shipping"
                        element={
                          <ProtectedRoute>
                            <AdminShippingPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/buyer-protection"
                        element={
                          <ProtectedRoute>
                            <AdminBuyerProtectionPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/seller-fees"
                        element={
                          <ProtectedRoute>
                            <AdminSellerFeesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/categories"
                        element={
                          <ProtectedRoute>
                            <AdminCategoriesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/category-filters"
                        element={
                          <ProtectedRoute>
                            <AdminCategoryFiltersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/attributes"
                        element={
                          <ProtectedRoute>
                            <AdminAttributesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/manage-attributes"
                        element={
                          <ProtectedRoute>
                            <AdminManageAttributesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/brands"
                        element={
                          <ProtectedRoute>
                            <AdminBrandsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/tags"
                        element={
                          <ProtectedRoute>
                            <AdminTagsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/system-seller"
                        element={
                          <ProtectedRoute>
                            <AdminSystemSellerPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/content"
                        element={
                          <ProtectedRoute>
                            <AdminContentPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/content/:id/edit"
                        element={
                          <ProtectedRoute>
                            <AdminContentEditorPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/footer"
                        element={
                          <ProtectedRoute>
                            <AdminFooterPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/support"
                        element={
                          <ProtectedRoute>
                            <AdminSupportPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/mega-menu"
                        element={
                          <ProtectedRoute>
                            <AdminMegaMenuPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/banners"
                        element={
                          <ProtectedRoute>
                            <AdminBannersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/homepage-cards"
                        element={
                          <ProtectedRoute>
                            <AdminHomepageCardsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/shop-video"
                        element={
                          <ProtectedRoute>
                            <AdminShopVideoPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/shop-sections"
                        element={
                          <ProtectedRoute>
                            <AdminShopSectionsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/instagram-posts"
                        element={
                          <ProtectedRoute>
                            <AdminInstagramPostsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/shop-brand-section"
                        element={
                          <ProtectedRoute>
                            <AdminShopBrandSectionPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/prohibited-words"
                        element={
                          <ProtectedRoute>
                            <AdminProhibitedWordsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/promo-message"
                        element={
                          <ProtectedRoute>
                            <AdminPromoMessagePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/moderation"
                        element={
                          <ProtectedRoute>
                            <AdminModerationPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/messages"
                        element={
                          <ProtectedRoute>
                            <AdminMessagesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/no-products-settings"
                        element={
                          <ProtectedRoute>
                            <AdminNoProductsSettingsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/blog"
                        element={
                          <ProtectedRoute>
                            <AdminBlogPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/blog/categories"
                        element={
                          <ProtectedRoute>
                            <AdminBlogCategoriesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/blog/tags"
                        element={
                          <ProtectedRoute>
                            <AdminBlogTagsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/size-guides"
                        element={
                          <ProtectedRoute>
                            <AdminSizeGuidesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/grading-guides"
                        element={
                          <ProtectedRoute>
                            <AdminGradingGuidesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/app-content"
                        element={
                          <ProtectedRoute>
                            <AdminAppContentPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/category-grid-images"
                        element={
                          <ProtectedRoute>
                            <AdminCategoryGridImagesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/shop-hero-images"
                        element={
                          <ProtectedRoute>
                            <AdminShopHeroImagesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/data-recovery"
                        element={
                          <ProtectedRoute>
                            <AdminDataRecoveryPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/blog/:id"
                        element={
                          <ProtectedRoute>
                            <AdminBlogEditorPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/products"
                        element={
                          <ProtectedRoute>
                            <AdminProductsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/products/bulk-edit"
                        element={
                          <ProtectedRoute>
                            <BulkEditProductsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/products/sold"
                        element={
                          <ProtectedRoute>
                            <AdminSoldProductsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/products/published"
                        element={
                          <ProtectedRoute>
                            <AdminPublishedProductsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/products/draft"
                        element={
                          <ProtectedRoute>
                            <AdminDraftProductsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/products/private"
                        element={
                          <ProtectedRoute>
                            <AdminPrivateProductsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/products/missing-images"
                        element={
                          <ProtectedRoute>
                            <AdminMissingImagesProductsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/products/archived"
                        element={
                          <ProtectedRoute>
                            <AdminArchivedProductsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/marketplace-products"
                        element={
                          <ProtectedRoute>
                            <AdminMarketplaceProductsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/auth"
                        element={
                          <PublicRoute>
                            <AuthPage />
                          </PublicRoute>
                        }
                      />
                      <Route path="/confirm-email" element={<ConfirmEmailPage />} />
                      <Route path="/shop" element={<ShopPage />} />
                      <Route path="/search" element={<SearchPage />} />
                      <Route path="/auctions" element={<AuctionsPage />} />
                      <Route path="/support" element={<SupportPage />} />
                      <Route path="/shop/tag/:tagSlug" element={<TagPage />} />
                      <Route path="/shop/:categorySlug" element={<ShopPage />} />
                      <Route path="/shop/:categorySlug/:subcategorySlug" element={<ShopPage />} />
                      <Route path="/shop/:categorySlug/:subcategorySlug/:subSubcategorySlug" element={<ShopPage />} />
                      <Route
                        path="/shop/:categorySlug/:subcategorySlug/:subSubcategorySlug/:subSubSubcategorySlug"
                        element={<ShopPage />}
                      />
                      <Route path="/blog" element={<BlogPage />} />
                      <Route path="/blog/:slug" element={<BlogPostPage />} />
                      <Route path="/product/:id" element={<ProductPage />} />
                      <Route
                        path="/basket"
                        element={
                          <ProtectedRoute>
                            <BasketPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/checkout"
                        element={
                          <ProtectedRoute>
                            <CheckoutPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/payment-success"
                        element={
                          <ProtectedRoute>
                            <PaymentSuccessPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <ProfilePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/my-orders"
                        element={
                          <ProtectedRoute>
                            <MyOrdersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/my-offers"
                        element={
                          <ProtectedRoute>
                            <MyOffersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/my-messages"
                        element={
                          <ProtectedRoute>
                            <MyMessagesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/notifications"
                        element={
                          <ProtectedRoute>
                            <NotificationsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/seller/:sellerId"
                        element={
                          <ProtectedRoute>
                            <SellerProfilePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/developer/api-docs"
                        element={
                          <ProtectedRoute>
                            <DeveloperApiDocs />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/founders" element={<FoundersListPage />} />
                      <Route path="/shared-wishlist/:token" element={<SharedWishlistPage />} />
                      <Route
                        path="/wishlist"
                        element={
                          <ProtectedRoute>
                            <WishlistPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/my-addresses"
                        element={
                          <ProtectedRoute>
                            <MyAddressesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/page/:slug" element={<ContentPage />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </WishlistProvider>
                </CartProvider>
              </CurrencyProvider>
            </AuthProvider>
          </AppProvider>
        </BrowserRouter>
      </TooltipProvider>
    </GoogleMapsLoader>
  );
};

export default App;
