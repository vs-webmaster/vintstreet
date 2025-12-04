import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Users,
  ShoppingBag,
  PackageX,
  Truck,
  FolderTree,
  Sliders,
  GitBranch,
  Tag as TagIcon,
  Settings,
  FileText,
  Menu,
  Shield,
  MessageSquare,
  Store,
  LayoutGrid,
  X,
  List,
  Image,
  AlertTriangle,
  ChevronDown,
  BookOpen,
  ShoppingCart,
  Filter,
  Smartphone,
  HelpCircle,
  History,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/useIsMobile';
import { getAdminOrderCountByDeliveryStatus } from '@/services/orders';
import { fetchFlaggedMessages } from '@/services/messages';
import { isSuccess } from '@/types/api';

export default function AdminSidebar() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch counts for badges
  const { data: counts } = useQuery({
    queryKey: ['admin-sidebar-counts', user?.id],
    queryFn: async () => {
      const [ordersResult, messagesResult] = await Promise.all([
        getAdminOrderCountByDeliveryStatus('processing'),
        fetchFlaggedMessages(),
      ]);

      return {
        pendingOrders: isSuccess(ordersResult) ? ordersResult.data : 0,
        flaggedMessages: isSuccess(messagesResult) ? messagesResult.data.length : 0,
      };
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  type MenuItem = {
    label: string;
    icon: unknown;
    href: string;
    count?: number;
  };

  const menuGroups: {
    overview: MenuItem[];
    vintStreet: MenuItem[];
    marketplaceOrders: MenuItem[];
    masterListings: MenuItem[];
    marketplaceProducts: MenuItem[];
    users: MenuItem[];
    fulfilment: MenuItem[];
    manageProducts: MenuItem[];
    homepageDesign: MenuItem[];
    content: MenuItem[];
    messaging: MenuItem[];
    system: MenuItem[];
  } = {
    overview: [{ label: 'Overview', icon: BarChart3, href: '/admin/overview' }],
    vintStreet: [
      { label: 'Vint Street Orders', icon: ShoppingBag, href: '/admin/orders', count: counts?.pendingOrders },
      { label: 'Messages', icon: MessageSquare, href: '/admin/vint-messages' },
      { label: 'Offers', icon: TagIcon, href: '/admin/vint-offers' },
      { label: 'Returns', icon: PackageX, href: '/admin/returns' },
    ],
    marketplaceOrders: [{ label: 'Marketplace Orders', icon: ShoppingBag, href: '/admin/marketplace-orders' }],
    masterListings: [{ label: 'Master Listings', icon: List, href: '/admin/products' }],
    marketplaceProducts: [{ label: 'Marketplace Products', icon: ShoppingCart, href: '/admin/marketplace-products' }],
    users: [{ label: 'All Users', icon: Users, href: '/admin/users' }],
    fulfilment: [
      { label: 'Shipping', icon: Truck, href: '/admin/shipping' },
      { label: 'Buyer Protection', icon: Shield, href: '/admin/buyer-protection' },
      { label: 'Seller Fees', icon: TagIcon, href: '/admin/seller-fees' },
    ],
    manageProducts: [
      { label: 'Categories', icon: FolderTree, href: '/admin/categories' },
      { label: 'Category Filters', icon: Filter, href: '/admin/category-filters' },
      { label: 'Attributes', icon: Sliders, href: '/admin/attributes' },
      { label: 'Manage Attrs', icon: GitBranch, href: '/admin/manage-attributes' },
      { label: 'Brands', icon: Store, href: '/admin/brands' },
      { label: 'Tags', icon: TagIcon, href: '/admin/tags' },
      { label: 'System Seller', icon: Settings, href: '/admin/system-seller' },
    ],
    homepageDesign: [
      { label: 'Shop Hero Images', icon: Image, href: '/admin/shop-hero-images' },
      { label: 'Shop Banners', icon: Image, href: '/admin/banners' },
      { label: 'Shop Video Section', icon: Image, href: '/admin/shop-video' },
      { label: 'Shop Brand Section', icon: LayoutGrid, href: '/admin/shop-brand-section' },
      { label: 'Homepage Cards', icon: LayoutGrid, href: '/admin/homepage-cards' },
      { label: 'Instagram Posts', icon: Image, href: '/admin/instagram-posts' },
      { label: 'Shop Sections', icon: LayoutGrid, href: '/admin/shop-sections' },
      { label: 'Promo Message', icon: Settings, href: '/admin/promo-message' },
    ],
    content: [
      { label: 'Content Pages', icon: FileText, href: '/admin/content' },
      { label: 'Blog', icon: BookOpen, href: '/admin/blog' },
      { label: 'Footer Links', icon: FileText, href: '/admin/footer' },
      { label: 'Support Page', icon: HelpCircle, href: '/admin/support' },
      { label: 'Mega Menu', icon: LayoutGrid, href: '/admin/mega-menu' },
      { label: 'Category Grid Images', icon: Image, href: '/admin/category-grid-images' },
      { label: 'App Content', icon: Smartphone, href: '/admin/app-content' },
      { label: 'No Products Settings', icon: Settings, href: '/admin/no-products-settings' },
      { label: 'Prohibited Words', icon: AlertTriangle, href: '/admin/prohibited-words' },
      { label: 'Moderation', icon: Shield, href: '/admin/moderation' },
    ],
    messaging: [
      { label: 'All Messages', icon: MessageSquare, href: '/admin/messages', count: counts?.flaggedMessages },
      { label: 'Founders', icon: Users, href: '/admin/founders' },
      { label: 'Seller Pre-Reg', icon: Users, href: '/admin/seller-registrations' },
    ],
    system: [{ label: 'Data Recovery', icon: History, href: '/admin/data-recovery' }],
  };

  const allItems = [
    ...menuGroups.overview,
    ...menuGroups.vintStreet,
    ...menuGroups.marketplaceOrders,
    ...menuGroups.masterListings,
    ...menuGroups.marketplaceProducts,
    ...menuGroups.users,
    ...menuGroups.fulfilment,
    ...menuGroups.manageProducts,
    ...menuGroups.homepageDesign,
    ...menuGroups.content,
    ...menuGroups.messaging,
    ...menuGroups.system,
  ];

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-primary/20 text-primary font-semibold border-l-2 border-primary' : 'hover:bg-muted/50';

  // Mobile view
  if (isMobile) {
    return (
      <>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="fixed left-4 top-4 z-50 lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex h-full flex-col py-6">
              <div className="mb-6 flex items-center justify-between px-4">
                <h2 className="text-lg font-semibold">Admin Panel</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto px-2">
                {allItems.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                        isActive
                          ? 'bg-muted font-medium text-primary'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {item.count}
                      </Badge>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop view
  return (
    <>
      <Sidebar className={isCollapsed ? 'w-14' : 'w-60'}>
        <SidebarTrigger className="m-2 self-end" />
        <SidebarContent className="gap-1 pt-[60px]">
          {/* Overview */}
          <SidebarGroup className="py-1">
            <SidebarGroupContent>
              <SidebarMenu>
                {menuGroups.overview.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.href} className={getNavCls}>
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Separator */}
          {!isCollapsed && <div className="mx-2 border-t" />}

          {/* Vint Street Section */}
          <SidebarGroup className="py-1">
            <SidebarGroupContent>
              <SidebarMenu>
                {menuGroups.vintStreet.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.href} className={getNavCls}>
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.label}</span>}
                        {!isCollapsed && item.count !== undefined && item.count > 0 && (
                          <Badge variant="destructive" className="ml-auto">
                            {item.count}
                          </Badge>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Separator */}
          {!isCollapsed && <div className="mx-2 border-t" />}

          {/* Marketplace Orders */}
          <SidebarGroup className="py-1">
            <SidebarGroupContent>
              <SidebarMenu>
                {menuGroups.marketplaceOrders.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.href} className={getNavCls}>
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Separator */}
          {!isCollapsed && <div className="mx-2 border-t" />}

          {/* Master Listings */}
          <SidebarGroup className="py-1">
            <SidebarGroupContent>
              <SidebarMenu>
                {menuGroups.masterListings.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.href} className={getNavCls}>
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Separator */}
          {!isCollapsed && <div className="mx-2 border-t" />}

          {/* Marketplace Products */}
          <SidebarGroup className="py-1">
            <SidebarGroupContent>
              <SidebarMenu>
                {menuGroups.marketplaceProducts.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.href} className={getNavCls}>
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Separator */}
          {!isCollapsed && <div className="mx-2 border-t" />}

          {/* All Users */}
          <SidebarGroup className="py-1">
            <SidebarGroupContent>
              <SidebarMenu>
                {menuGroups.users.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.href} className={getNavCls}>
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Separator before collapsible sections */}
          {!isCollapsed && <div className="mx-2 my-2 border-t" />}

          {/* Fulfilment - Collapsible */}
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup className="py-1">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1 hover:bg-muted/50">
                  <span>Fulfilment</span>
                  {!isCollapsed && (
                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  )}
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {menuGroups.fulfilment.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.href} className={getNavCls}>
                            <item.icon className="h-4 w-4" />
                            {!isCollapsed && <span>{item.label}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>

          {/* Manage Products - Collapsible */}
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup className="py-1">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1 hover:bg-muted/50">
                  <span>Manage Products</span>
                  {!isCollapsed && (
                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  )}
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {menuGroups.manageProducts.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.href} className={getNavCls}>
                            <item.icon className="h-4 w-4" />
                            {!isCollapsed && <span>{item.label}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>

          {/* Homepage Design - Collapsible */}
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup className="py-1">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1 hover:bg-muted/50">
                  <span>Homepage Design</span>
                  {!isCollapsed && (
                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  )}
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {menuGroups.homepageDesign.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.href} className={getNavCls}>
                            <item.icon className="h-4 w-4" />
                            {!isCollapsed && <span>{item.label}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>

          {/* Content - Collapsible */}
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup className="py-1">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1 hover:bg-muted/50">
                  <span>Content</span>
                  {!isCollapsed && (
                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  )}
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {menuGroups.content.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.href} className={getNavCls}>
                            <item.icon className="h-4 w-4" />
                            {!isCollapsed && <span>{item.label}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>

          {/* Messaging - Collapsible */}
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup className="py-1">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1 hover:bg-muted/50">
                  <span>Messaging</span>
                  {!isCollapsed && (
                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  )}
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {menuGroups.messaging.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.href} className={getNavCls}>
                            <item.icon className="h-4 w-4" />
                            {!isCollapsed && <span>{item.label}</span>}
                            {!isCollapsed && item.count !== undefined && item.count > 0 && (
                              <Badge variant="destructive" className="ml-auto">
                                {item.count}
                              </Badge>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>

          {/* System - Collapsible */}
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup className="py-1">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1 hover:bg-muted/50">
                  <span>System</span>
                  {!isCollapsed && (
                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  )}
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {menuGroups.system.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.href} className={getNavCls}>
                            <item.icon className="h-4 w-4" />
                            {!isCollapsed && <span>{item.label}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        </SidebarContent>
      </Sidebar>
    </>
  );
}
