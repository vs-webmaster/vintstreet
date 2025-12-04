import { ReactNode } from 'react';
import AdminHeader from '@/components/AdminHeader';
import AdminSidebar from '@/components/AdminSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <SidebarProvider>
        <div className="flex w-full">
          <AdminSidebar />
          <main className="container mx-auto flex-1 px-4 py-8">{children}</main>
        </div>
      </SidebarProvider>
    </div>
  );
};
