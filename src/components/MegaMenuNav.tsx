import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { useApp } from '@/hooks/useApp';

export const MegaMenuNav = () => {
  const navigate = useNavigate();
  const [value, setValue] = useState<string>('');
  const { megaMenuCategories, megaMenuCustomLists, megaMenuCustomListItems, loading } = useApp();

  if (loading) {
    return (
      <div className="hidden border-b bg-background md:block">
        <div className="container mx-auto px-4">
          <div className="flex h-12 items-center">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  const handleLinkClick = () => {
    setValue('');
  };

  const renderColumnContent = (category: unknown, type: string, label: string) => {
    switch (type) {
      case 'popular_brands':
        if (!category.brands || category.brands.length === 0) return null;
        return (
          <>
            <h4 className="text-sm font-semibold leading-none transition-colors hover:text-primary">{label}</h4>
            <ul className="space-y-1">
              {[...category.brands]
                .sort((a: unknown, b: unknown) => a.brands.name.localeCompare(b.brands.name))
                .map((categoryBrand: unknown) => (
                  <li key={categoryBrand.brand_id}>
                    <Link
                      to={`/shop/${category.slug}?brand=${categoryBrand.brands.name}`}
                      className="block border-b-2 border-transparent pb-0.5 text-xs text-muted-foreground transition-all hover:border-foreground hover:text-foreground"
                      onClick={handleLinkClick}
                    >
                      {categoryBrand.brands.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </>
        );

      case 'categories': {
        if (!category.product_subcategories || category.product_subcategories.length === 0) return null;
        const visibleSubcategories = category.product_subcategories.filter(
          (sub: unknown) => sub.show_in_mega_menu !== false,
        );
        if (visibleSubcategories.length === 0) return null;
        return (
          <>
            {visibleSubcategories.map((subcategory: unknown) => (
              <div key={subcategory.id} className="space-y-2">
                <Link
                  to={`/shop/${category.slug}/${subcategory.slug}`}
                  className="block text-sm font-semibold leading-none transition-colors hover:text-primary"
                  onClick={handleLinkClick}
                >
                  {subcategory.name}
                </Link>
                {subcategory.product_sub_subcategories && subcategory.product_sub_subcategories.length > 0 && (
                  <ul className="space-y-1">
                    {subcategory.product_sub_subcategories
                      .filter((subSub: unknown) => subSub.show_in_mega_menu !== false)
                      .map((subSubcategory: unknown) => (
                        <li key={subSubcategory.id}>
                          <Link
                            to={`/shop/${category.slug}/${subcategory.slug}/${subSubcategory.slug}`}
                            className="block border-b-2 border-transparent pb-0.5 text-xs text-muted-foreground transition-all hover:border-foreground hover:text-foreground"
                            onClick={handleLinkClick}
                          >
                            {subSubcategory.name}
                          </Link>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            ))}
          </>
        );
      }

      case 'trending':
        if (!category.trending || category.trending.length === 0) return null;
        return (
          <>
            <h4 className="text-sm font-semibold leading-none transition-colors hover:text-primary">{label}</h4>
            <ul className="space-y-1">
              {[...category.trending]
                .sort((a: unknown, b: unknown) => (a.name || '').localeCompare(b.name || ''))
                .map((item: unknown) =>
                  item.path ? (
                    <li key={item.id}>
                      <Link
                        to={item.path}
                        className="block border-b-2 border-transparent pb-0.5 text-xs text-muted-foreground transition-all hover:border-foreground hover:text-foreground"
                        onClick={handleLinkClick}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ) : null,
                )}
            </ul>
          </>
        );

      case 'best_sellers':
        if (!category.bestSellers || category.bestSellers.length === 0) return null;
        return (
          <>
            <h4 className="text-sm font-semibold leading-none transition-colors hover:text-primary">{label}</h4>
            <ul className="space-y-1">
              {[...category.bestSellers]
                .sort((a: unknown, b: unknown) => (a.name || '').localeCompare(b.name || ''))
                .map((item: unknown) =>
                  item.path ? (
                    <li key={item.id}>
                      <Link
                        to={item.path}
                        className="block border-b-2 border-transparent pb-0.5 text-xs text-muted-foreground transition-all hover:border-foreground hover:text-foreground"
                        onClick={handleLinkClick}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ) : null,
                )}
            </ul>
          </>
        );

      case 'luxury_brands':
        if (!category.luxuryBrands || category.luxuryBrands.length === 0) return null;
        return (
          <>
            <h4 className="text-sm font-semibold leading-none transition-colors hover:text-primary">{label}</h4>
            <ul className="space-y-1">
              {[...category.luxuryBrands]
                .sort((a: unknown, b: unknown) => a.brands.name.localeCompare(b.brands.name))
                .map((luxuryBrand: unknown) => (
                  <li key={luxuryBrand.brand_id}>
                    <Link
                      to={`/shop/${category.slug}?brand=${luxuryBrand.brands.name}`}
                      className="block border-b-2 border-transparent pb-0.5 text-xs text-muted-foreground transition-all hover:border-foreground hover:text-foreground"
                      onClick={handleLinkClick}
                    >
                      {luxuryBrand.brands.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </>
        );

      case 'custom': {
        // Resolve custom list globally by its system_name (unique identifier)
        const list = (megaMenuCustomLists as unknown)?.find((l: unknown) => l.system_name === label);
        if (!list) {
          return null;
        }
        const items = (megaMenuCustomListItems as unknown)?.filter((i: unknown) => i.list_id === list.id) || [];
        if (items.length === 0) {
          return null;
        }

        const isHeaderLinks = list.list_type === 'header-links';

        return (
          <>
            {!isHeaderLinks && (
              <h4 className="text-sm font-semibold leading-none transition-colors hover:text-primary">{list.name}</h4>
            )}
            <ul className={isHeaderLinks ? 'space-y-2.5' : 'space-y-1'}>
              {items.map((item: unknown) => {
                // The URL is already generated in the allCustomItems query
                const itemUrl = item.url || '/shop';
                const isExternal = itemUrl.startsWith('http://') || itemUrl.startsWith('https://');

                return (
                  <li key={item.id}>
                    {isExternal ? (
                      <a
                        href={itemUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block border-b-2 border-transparent pb-0.5 transition-all hover:border-foreground ${
                          isHeaderLinks
                            ? 'text-sm font-semibold leading-none text-foreground hover:text-primary'
                            : 'text-xs text-muted-foreground hover:text-foreground'
                        }`}
                        onClick={handleLinkClick}
                      >
                        {item.display_name || item.name}
                      </a>
                    ) : (
                      <Link
                        to={itemUrl}
                        className={`block border-b-2 border-transparent pb-0.5 transition-all hover:border-foreground ${
                          isHeaderLinks
                            ? 'text-sm font-semibold leading-none text-foreground hover:text-primary'
                            : 'text-xs text-muted-foreground hover:text-foreground'
                        }`}
                        onClick={handleLinkClick}
                      >
                        {item.display_name || item.name}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        );
      }

      default:
        return null;
    }
  };

  const renderMegaMenuContent = (category: unknown) => {
    const layout = category.layout;

    // If no layout configured, use default all-text layout with all sections
    if (!layout) {
      return (
        <>
          {category.brands && category.brands.length > 0 && (
            <div className="flex-1 space-y-3">{renderColumnContent(category, 'popular_brands', 'Popular Brands')}</div>
          )}
          <div className="flex-1 space-y-6">{renderColumnContent(category, 'categories', 'Categories')}</div>
          {category.trending && category.trending.length > 0 && (
            <div className="flex-1 space-y-3">{renderColumnContent(category, 'trending', 'Trending')}</div>
          )}
          {category.bestSellers && category.bestSellers.length > 0 && (
            <div className="flex-1 space-y-3">{renderColumnContent(category, 'best_sellers', 'Best Sellers')}</div>
          )}
          {category.luxuryBrands && category.luxuryBrands.length > 0 && (
            <div className="flex-1 space-y-3">{renderColumnContent(category, 'luxury_brands', 'Luxury Brands')}</div>
          )}
        </>
      );
    }

    // Render based on configured layout
    let columns = layout.columns || [];
    // Normalize old format to new format
    if (columns.length > 0 && !columns[0].items) {
      columns = columns.map((col: unknown) => ({
        items: [{ type: col.type, label: col.label }],
      }));
    }
    const images = category.images || [];

    return (
      <>
        {columns.map((col: unknown, index: number) => (
          <div key={index} className="flex-1 space-y-6">
            {col.items?.map((item: unknown, itemIndex: number) => (
              <div key={itemIndex} className="space-y-3">
                {renderColumnContent(category, item.type, item.label)}
              </div>
            ))}
          </div>
        ))}

        {images.length > 0 && (
          <div
            className="space-y-2 overflow-hidden rounded-lg"
            style={{
              flex: layout.image_column_span || 2,
              minWidth: `${(layout.image_column_span || 2) * 200}px`,
              maxWidth: `${(layout.image_column_span || 2) * 200}px`,
            }}
          >
            {images.map((image: unknown) => (
              <div key={image.id} className="overflow-hidden rounded-lg bg-white" style={{ maxHeight: '150px' }}>
                {image.image_link ? (
                  <Link to={image.image_link} onClick={handleLinkClick} className="block w-full">
                    <img
                      src={image.image_url}
                      alt={image.image_alt || 'Mega menu image'}
                      className="h-auto w-full object-contain transition-opacity hover:opacity-90"
                      style={{ maxHeight: '150px' }}
                    />
                  </Link>
                ) : (
                  <img
                    src={image.image_url}
                    alt={image.image_alt || 'Mega menu image'}
                    className="h-auto w-full object-contain"
                    style={{ maxHeight: '150px' }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="hidden border-b bg-background md:block">
      <div className="container mx-auto px-4">
        <NavigationMenu value={value} onValueChange={setValue}>
          <NavigationMenuList>
            {megaMenuCategories.map((category) => (
              <NavigationMenuItem key={category.id}>
                <NavigationMenuTrigger
                  className="h-10 cursor-pointer text-sm font-medium"
                  onClick={() => {
                    if (!category.disable_main_link) {
                      navigate(`/shop/${category.slug}`);
                      setValue('');
                    }
                  }}
                >
                  {category.name}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="mx-auto flex max-h-[80vh] w-[min(90vw,1200px)] gap-6 overflow-y-auto p-6">
                    {renderMegaMenuContent(category)}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
};
