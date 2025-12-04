import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PriceDisplay } from '@/components/PriceDisplay';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { fetchContentPageBySlug, fetchContentPageProducts, fetchPageSections } from '@/services/content';
import { fetchProductsByIds } from '@/services/products';
import { isFailure } from '@/types/api';

interface PageSection {
  section_type: string;
  content: any;
}

interface Product {
  id: string;
  slug: string;
  product_name: string;
  thumbnail: string;
  starting_price: number;
  discounted_price: number | null;
}

export default function ContentPage() {
  const { slug } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['content-page', slug],
    queryFn: async () => {
      const pageResult = await fetchContentPageBySlug(slug!);
      if (isFailure(pageResult)) throw pageResult.error;
      const page = pageResult.data;
      if (!page) throw new Error('Page not found');

      const sectionsResult = await fetchPageSections(page.id);
      if (isFailure(sectionsResult)) throw sectionsResult.error;

      // Fetch products if it's a product page
      let products: Product[] = [];
      if (page.page_type === 'product') {
        const productLinksResult = await fetchContentPageProducts(page.id);
        if (isFailure(productLinksResult)) throw productLinksResult.error;

        if (productLinksResult.data && productLinksResult.data.length > 0) {
          const productIds = productLinksResult.data.map((p) => p.product_id);
          const productsResult = await fetchProductsByIds(productIds);
          if (isFailure(productsResult)) throw productsResult.error;
          products = productsResult.data.map((p) => ({
            id: p.id,
            slug: p.slug,
            product_name: p.product_name,
            thumbnail: p.thumbnail,
            starting_price: p.starting_price,
            discounted_price: p.discounted_price,
          }));
        }
      }

      return { page, sections: sectionsResult.data as PageSection[], products };
    },
  });

  const renderSection = (section: PageSection, index: number) => {
    const content = section.content;

    switch (section.section_type) {
      case 'hero':
        return (
          <section key={index} className="relative px-4 py-20">
            {content.image && (
              <div
                className={`absolute inset-0 bg-cover bg-center ${content.fade_image !== false ? 'opacity-20' : ''}`}
                style={{ backgroundImage: `url(${content.image})` }}
              />
            )}
            <div className="container relative z-10 mx-auto text-center">
              <h1 className="mb-4 text-5xl font-bold">{content.title}</h1>
              {content.subtitle && <p className="mb-8 text-xl text-muted-foreground">{content.subtitle}</p>}
              {content.cta_text && content.cta_link && (
                <Button size="lg" onClick={() => (window.location.href = content.cta_link)}>
                  {content.cta_text}
                </Button>
              )}
            </div>
          </section>
        );

      case 'text_block':
        return (
          <section key={index} className="px-4 py-12">
            <div className="container mx-auto max-w-4xl">
              {content.title && <h2 className="mb-6 text-3xl font-bold">{content.title}</h2>}
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.content) }}
              />
            </div>
          </section>
        );

      case 'image_text':
        return (
          <section key={index} className="px-4 py-12">
            <div className="container mx-auto">
              <div
                className={`grid items-center gap-8 md:grid-cols-2 ${
                  content.image_position === 'right' ? 'md:flex-row-reverse' : ''
                }`}
              >
                {content.image_position === 'left' && content.image && (
                  <div>
                    <img src={content.image} alt={content.title} className="h-auto w-full rounded-lg" />
                  </div>
                )}
                <div>
                  {content.title && <h2 className="mb-4 text-3xl font-bold">{content.title}</h2>}
                  <div
                    className="prose prose-lg"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.content) }}
                  />
                </div>
                {content.image_position === 'right' && content.image && (
                  <div>
                    <img src={content.image} alt={content.title} className="h-auto w-full rounded-lg" />
                  </div>
                )}
              </div>
            </div>
          </section>
        );

      case 'cta':
        return (
          <section key={index} className="bg-primary/5 px-4 py-16">
            <div className="container mx-auto text-center">
              {content.title && <h2 className="mb-4 text-4xl font-bold">{content.title}</h2>}
              {content.subtitle && <p className="mb-8 text-xl text-muted-foreground">{content.subtitle}</p>}
              {content.button_text && content.button_link && (
                <Button size="lg" onClick={() => (window.location.href = content.button_link)}>
                  {content.button_text}
                </Button>
              )}
            </div>
          </section>
        );

      case 'faq':
        return (
          <section key={index} className="px-4 py-12">
            <div className="container mx-auto max-w-3xl">
              {content.title && <h2 className="mb-8 text-center text-3xl font-bold">{content.title}</h2>}
              <Accordion type="single" collapsible className="w-full">
                {content.items?.map((item: any, itemIndex: number) => (
                  <AccordionItem key={itemIndex} value={`item-${itemIndex}`}>
                    <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                    <AccordionContent>
                      <p className="whitespace-pre-wrap">{item.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        );

      case 'cards':
        return (
          <section key={index} className="px-4 py-12">
            <div className="container mx-auto">
              {content.title && <h2 className="mb-8 text-center text-3xl font-bold">{content.title}</h2>}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {content.cards?.map((card: any, cardIndex: number) => (
                  <Card key={cardIndex} className="overflow-hidden">
                    {card.image && (
                      <div className="aspect-video w-full overflow-hidden">
                        <img src={card.image} alt={card.title} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="mb-3 text-xl font-semibold">{card.title}</h3>
                      <p className="whitespace-pre-wrap text-muted-foreground">{card.text}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="mb-4 text-3xl font-bold">Page Not Found</h1>
          <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {data.sections.map((section, index) => renderSection(section, index))}

        {/* Products Section - only shown for product pages */}
        {data.products && data.products.length > 0 && (
          <section className="bg-muted/30 px-4 py-12">
            <div className="container mx-auto">
              <h2 className="mb-8 text-center text-3xl font-bold">Featured Products</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
                {data.products.map((product) => (
                  <Link key={product.id} to={`/product/${product.slug || product.id}`}>
                    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={product.thumbnail}
                          alt={product.product_name}
                          className="h-full w-full object-cover transition-transform hover:scale-105"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="mb-2 line-clamp-2 font-semibold">{product.product_name}</h3>
                        <div className="space-y-1">
                          {product.discounted_price ? (
                            <>
                              <PriceDisplay gbpPrice={product.discounted_price} className="text-primary" />
                              <PriceDisplay
                                gbpPrice={product.starting_price}
                                className="text-sm text-muted-foreground line-through"
                              />
                            </>
                          ) : (
                            <PriceDisplay gbpPrice={product.starting_price} />
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
