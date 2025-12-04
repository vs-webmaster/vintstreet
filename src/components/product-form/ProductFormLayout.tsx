interface ProductFormLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}

export const ProductFormLayout = ({ children, sidebar }: ProductFormLayoutProps) => {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">{children}</div>
      <div className="lg:col-span-1">
        <div className="sticky top-6">{sidebar}</div>
      </div>
    </div>
  );
};
