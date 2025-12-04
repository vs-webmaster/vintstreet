import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  User,
  ShoppingCart,
  Bell,
  LogOut,
  Shield,
  HandHeart,
  MessageSquare,
  LayoutDashboard,
  Menu,
  Heart,
  MapPin,
  Phone,
  HelpCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useSellerProfile } from '@/hooks/useSellerProfile';
import vintStreetLogo from '@/assets/vint-street-logo.svg';
import MobileCategoryNav from './MobileCategoryNav';
import SmartSearch from './SmartSearch';

export default function Header() {
  const location = useLocation();
  const { promoMessage } = useApp();
  const { user, profile, signOut, isSuperAdmin, isSeller, isBuyer } = useAuth();
  const { hasSellerProfile, loading: sellerProfileLoading } = useSellerProfile();
  const { getTotalItems } = useCart();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  // Check if we're on the home page or showcase page
  const isHomePage = location.pathname === '/';
  const isShowcasePage = location.pathname === '/showcase';
  const isSellerDashboard = location.pathname === '/seller';

  return (
    <header className="sticky top-0 z-50">
      {/* Very thin top bar with Blog and Contact */}
      {!isSellerDashboard && (
        <div className="border-b border-white bg-black">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between gap-6 py-1 text-sm">
              <div className="flex items-center gap-4">
                <Badge className="border border-white/20 bg-black/50 px-3 py-1 text-xs font-semibold text-white">
                  {promoMessage}
                </Badge>
              </div>
              <div className="flex items-center gap-6">
                <Link to="/blog" className="hidden font-semibold text-white hover:text-white/90 md:inline">
                  Blog
                </Link>
                <a
                  href="tel:+1234567890"
                  className="hidden items-center gap-1.5 font-semibold text-white hover:text-white/90 md:flex"
                >
                  <Phone className="h-3.5 w-3.5" />
                  +1 (234) 567-890
                </a>
                <Link
                  to="/support"
                  className={`${promoMessage ? 'hidden md:flex' : 'flex'} items-center gap-1.5 font-semibold text-white hover:text-white/90`}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main header */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          {/* Top bar */}
          <div className="flex h-16 items-stretch justify-between gap-4">
            <div className="flex items-center py-2">
              <Link to="/shop">
                <img src={vintStreetLogo} alt="Vint Street" className="h-24 md:h-14" />
              </Link>
            </div>

            {/* Mobile Navigation Buttons */}
            <div className="flex flex-1 items-center justify-center gap-2 md:hidden">
              <Link to="/shop">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Marketplace
                </Button>
              </Link>
              <Link to="/live">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Live
                </Button>
              </Link>
            </div>

            {/* Desktop search and navigation */}
            <div className="hidden flex-1 items-center gap-8 md:flex">
              {!isSellerDashboard && (
                <div className="max-w-xl flex-1 lg:flex">
                  <SmartSearch className="w-full" key="desktop-search" />
                </div>
              )}
            </div>

            {/* Navigation Links - Hidden on mobile */}
            <div className="hidden h-full items-stretch border-l border-r border-primary-foreground/20 md:flex">
              <Link
                to="/shop"
                className="flex items-center border-r border-primary-foreground/20 px-6 font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10"
              >
                Marketplace
              </Link>
              <Link
                to="/auctions"
                className="flex items-center border-r border-primary-foreground/20 px-6 font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10"
              >
                Auctions
              </Link>
              <Link
                to="/live"
                className="flex items-center px-8 font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10"
              >
                Live
              </Link>
            </div>

            {/* Action buttons */}
            <div className="ml-8 flex items-center space-x-4">
              {user && isHomePage && (
                <Button
                  variant="outline"
                  className="hidden border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary md:flex"
                  asChild
                >
                  <Link to="/shop">Go to Shop</Link>
                </Button>
              )}

              {/* Cart icon - shown to all users */}
              <Button
                variant="ghost"
                size="icon"
                className="relative text-primary-foreground hover:bg-background/10"
                asChild
              >
                <Link to="/basket">
                  <ShoppingCart className="h-5 w-5 text-white" />
                  {getTotalItems() > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
                      {getTotalItems()}
                    </span>
                  )}
                </Link>
              </Button>

              {user ? (
                <>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden text-primary-foreground hover:bg-background/10 md:flex"
                    asChild
                  >
                    <Link to="/wishlist">
                      <Heart className="h-5 w-5 text-white" />
                    </Link>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden text-primary-foreground hover:bg-background/10 md:flex"
                    asChild
                  >
                    <Link to="/notifications">
                      <Bell className="h-5 w-5 text-white" />
                    </Link>
                  </Button>

                  <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-background/10">
                        <Menu className="h-6 w-6 text-white" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-80">
                      <SheetHeader>
                        <SheetTitle className="text-left">
                          {profile?.full_name || profile?.username || user?.email}
                        </SheetTitle>
                      </SheetHeader>

                      <div className="mt-6 flex flex-col gap-2">
                        <Link to="/basket" onClick={() => setMenuOpen(false)}>
                          <Button variant="ghost" className="h-14 w-full justify-start text-lg md:hidden">
                            <ShoppingCart className="mr-3 h-5 w-5" />
                            <span>Basket</span>
                            {getTotalItems() > 0 && (
                              <Badge variant="destructive" className="ml-auto">
                                {getTotalItems()}
                              </Badge>
                            )}
                          </Button>
                        </Link>

                        <Link to="/my-orders" onClick={() => setMenuOpen(false)}>
                          <Button variant="ghost" className="h-14 w-full justify-start text-lg">
                            <ShoppingCart className="mr-3 h-5 w-5" />
                            <span>My Orders</span>
                          </Button>
                        </Link>

                        <Link to="/my-offers" onClick={() => setMenuOpen(false)}>
                          <Button variant="ghost" className="h-14 w-full justify-start text-lg">
                            <HandHeart className="mr-3 h-5 w-5" />
                            <span>My Offers</span>
                          </Button>
                        </Link>

                        <Link to="/my-messages" onClick={() => setMenuOpen(false)}>
                          <Button variant="ghost" className="h-14 w-full justify-start text-lg">
                            <MessageSquare className="mr-3 h-5 w-5" />
                            <span>My Messages</span>
                          </Button>
                        </Link>

                        <Link to="/wishlist" onClick={() => setMenuOpen(false)}>
                          <Button variant="ghost" className="h-14 w-full justify-start text-lg">
                            <Heart className="mr-3 h-5 w-5" />
                            <span>My Wishlist</span>
                          </Button>
                        </Link>

                        <Link to="/my-addresses" onClick={() => setMenuOpen(false)}>
                          <Button variant="ghost" className="h-14 w-full justify-start text-lg">
                            <MapPin className="mr-3 h-5 w-5" />
                            <span>My Addresses</span>
                          </Button>
                        </Link>

                        <Link to="/profile" onClick={() => setMenuOpen(false)}>
                          <Button variant="ghost" className="h-14 w-full justify-start text-lg">
                            <User className="mr-3 h-5 w-5" />
                            <span>Profile</span>
                          </Button>
                        </Link>

                        {isSeller && !sellerProfileLoading && hasSellerProfile && (
                          <>
                            <div className="my-2 border-t" />
                            <Link to="/seller" onClick={() => setMenuOpen(false)}>
                              <Button variant="ghost" className="h-14 w-full justify-start text-lg">
                                <LayoutDashboard className="mr-3 h-5 w-5" />
                                <span>Seller Dashboard</span>
                              </Button>
                            </Link>

                            <Link to="/seller#products" onClick={() => setMenuOpen(false)}>
                              <Button variant="ghost" className="h-14 w-full justify-start text-lg">
                                <ShoppingCart className="mr-3 h-5 w-5" />
                                <span>My Listings</span>
                              </Button>
                            </Link>
                          </>
                        )}

                        {isSeller && !sellerProfileLoading && !hasSellerProfile && (
                          <>
                            <div className="my-2 border-t" />
                            <Link to="/become-seller" onClick={() => setMenuOpen(false)}>
                              <Button variant="ghost" className="h-14 w-full justify-start text-lg">
                                <LayoutDashboard className="mr-3 h-5 w-5" />
                                <span>Complete Profile</span>
                              </Button>
                            </Link>
                          </>
                        )}

                        {isBuyer && (
                          <>
                            <div className="my-2 border-t" />
                            <Link to="/become-seller" onClick={() => setMenuOpen(false)}>
                              <Button variant="ghost" className="h-14 w-full justify-start text-lg">
                                <LayoutDashboard className="mr-3 h-5 w-5" />
                                <span>Set Up Seller Account</span>
                              </Button>
                            </Link>
                          </>
                        )}

                        {isSuperAdmin && (
                          <>
                            <div className="my-2 border-t" />
                            <Link to="/admin" onClick={() => setMenuOpen(false)}>
                              <Button variant="ghost" className="h-14 w-full justify-start text-lg">
                                <Shield className="mr-3 h-5 w-5" />
                                <span>Admin Panel</span>
                              </Button>
                            </Link>
                          </>
                        )}

                        <div className="my-2 border-t" />

                        <Button
                          variant="ghost"
                          className="h-14 w-full justify-start text-lg text-destructive hover:text-destructive"
                          onClick={() => {
                            signOut();
                            setMenuOpen(false);
                          }}
                        >
                          <LogOut className="mr-3 h-5 w-5" />
                          Sign Out
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </>
              ) : (
                <>
                  {/* Desktop buttons */}
                  <Link to="/auth?tab=signup" className="hidden md:block">
                    <Button
                      variant="outline"
                      className="mr-2 border-primary-foreground text-black hover:bg-primary-foreground hover:text-primary"
                    >
                      Become a Seller
                    </Button>
                  </Link>
                  <Link to="/auth" className="hidden md:block">
                    <Button
                      variant="outline"
                      className="border-primary-foreground text-black hover:bg-primary-foreground hover:text-primary"
                    >
                      Sign In
                    </Button>
                  </Link>

                  {/* Mobile account menu */}
                  <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-background/10 md:hidden">
                        <User className="h-6 w-6 text-white" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-80">
                      <SheetHeader>
                        <SheetTitle className="text-left">Account</SheetTitle>
                      </SheetHeader>

                      <div className="mt-6 flex flex-col gap-2">
                        <Link to="/auth" onClick={() => setMenuOpen(false)}>
                          <Button variant="ghost" className="h-14 w-full justify-start text-lg">
                            <User className="mr-3 h-5 w-5" />
                            <span>Sign In</span>
                          </Button>
                        </Link>

                        <Link to="/auth?tab=signup" onClick={() => setMenuOpen(false)}>
                          <Button variant="ghost" className="h-14 w-full justify-start text-lg">
                            <LayoutDashboard className="mr-3 h-5 w-5" />
                            <span>Become a Seller</span>
                          </Button>
                        </Link>
                      </div>
                    </SheetContent>
                  </Sheet>
                </>
              )}
            </div>
          </div>

          {/* Mobile Search Bar and Category Nav - Below main nav (hidden on showcase page and seller dashboard) */}
          {!isShowcasePage && !isSellerDashboard && isMobile && (
            <div className="space-y-2 pb-3">
              <div className="flex items-center gap-2">
                <MobileCategoryNav />
                <SmartSearch className="flex-1" key="mobile-search" />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
